import type { IntentCluster } from './intent-clusterer'

export interface PillLabel {
  id: string
  label: string
  intent: string
  type: 'anticipate' | 'entice' | 'cta'
  confidence: number
  useCase: number[] // Which cases it's suitable for: [1, 2, 3]
  frequency: number // How many questions it addresses
  sentimentVariant?: string // For Case 3 CTA adaptation
}

export interface CaseRecommendation {
  case: number
  pills: PillLabel[]
  reasoning: string[]
}

export interface PillRecommendations {
  case1: CaseRecommendation
  case2: CaseRecommendation
  case3: CaseRecommendation
  pillLibrary: PillLabel[]
}

interface GenerateRecommendationsParams {
  intentClusters: IntentCluster[]
  campaignGoal?: {
    goalType: string
    businessPrompt: string
    ctaRequirement: any
  }
  testSessions?: any[]
}

export function generatePillRecommendations(
  params: GenerateRecommendationsParams
): PillRecommendations {
  const { intentClusters, campaignGoal, testSessions = [] } = params
  
  // Build complete pill library from intent clusters
  const pillLibrary: PillLabel[] = []
  let pillIdCounter = 0
  
  intentClusters.forEach(cluster => {
    cluster.pillCandidates.forEach(candidate => {
      const pillId = `pill_${pillIdCounter++}`
      
      // Determine pill type based on intent and frequency
      let type: 'anticipate' | 'entice' | 'cta' = 'anticipate'
      
      if (candidate.toLowerCase().includes('talk to') || 
          candidate.toLowerCase().includes('schedule') ||
          candidate.toLowerCase().includes('contact') ||
          candidate.toLowerCase().includes('recruiter')) {
        type = 'cta'
      } else if (cluster.frequency < intentClusters[0].frequency * 0.3) {
        // Lower frequency intents become "entice" pills
        type = 'entice'
      }
      
      // Determine suitable use cases
      const useCase: number[] = []
      const intent = cluster.intent.toLowerCase()
      
      // Case 1: Generic pills that work for everyone
      if (intent.includes('general') || intent.includes('explore') || type === 'cta') {
        useCase.push(1)
      }
      
      // Case 2: Topic-specific pills
      if (type === 'anticipate' || type === 'entice') {
        useCase.push(2)
      }
      
      // Case 3: All pills can work in Case 3 (we have rich data to filter)
      useCase.push(3)
      
      const confidence = calculateConfidence(cluster, candidate, testSessions)
      
      pillLibrary.push({
        id: pillId,
        label: candidate,
        intent: cluster.intent,
        type,
        confidence,
        useCase,
        frequency: cluster.frequency
      })
    })
  })
  
  // Deduplicate by normalized label - keep the pill with highest confidence for each unique label
  const deduplicatedLibrary = deduplicatePillsByLabel(pillLibrary)
  
  // Sort by confidence and frequency
  deduplicatedLibrary.sort((a, b) => {
    const scoreA = (a.confidence * 0.6) + (a.frequency / intentClusters.length * 0.4)
    const scoreB = (b.confidence * 0.6) + (b.frequency / intentClusters.length * 0.4)
    return scoreB - scoreA
  })
  
  // Generate Case 1 recommendations (Generic Default)
  const case1 = generateCase1Recommendations(deduplicatedLibrary, campaignGoal)
  
  // Generate Case 2 recommendations (Some Data)
  const case2 = generateCase2Recommendations(deduplicatedLibrary, intentClusters, campaignGoal)
  
  // Generate Case 3 recommendations (Rich Data)
  const case3 = generateCase3Recommendations(deduplicatedLibrary, intentClusters, campaignGoal)
  
  return {
    case1,
    case2,
    case3,
    pillLibrary: deduplicatedLibrary
  }
}

/**
 * Deduplicate pills by normalized label.
 * When multiple pills have the same label (case-insensitive, trimmed),
 * keep only the one with the highest confidence.
 */
function deduplicatePillsByLabel(pills: PillLabel[]): PillLabel[] {
  const normalizeLabel = (label: string): string => label.trim().toLowerCase()
  
  // Group pills by normalized label
  const labelMap = new Map<string, PillLabel>()
  
  for (const pill of pills) {
    const normalizedLabel = normalizeLabel(pill.label)
    const existing = labelMap.get(normalizedLabel)
    
    if (!existing) {
      // First pill with this label
      labelMap.set(normalizedLabel, pill)
    } else if ((pill.confidence || 0) > (existing.confidence || 0)) {
      // This pill has higher confidence, replace existing
      labelMap.set(normalizedLabel, pill)
    }
    // Otherwise, keep the existing pill (higher or equal confidence)
  }
  
  return Array.from(labelMap.values())
}

function calculateConfidence(
  cluster: IntentCluster,
  candidate: string,
  testSessions: any[]
): number {
  // Base confidence from frequency (normalized 0-1)
  let confidence = 0.5
  
  // Boost for high frequency intents
  if (cluster.frequency > 10) {
    confidence += 0.2
  }
  
  // Boost from test sessions (if available)
  const relevantSessions = testSessions.filter(session => 
    session.clickedPillLabel === candidate
  )
  
  if (relevantSessions.length > 0) {
    const avgRating = relevantSessions.reduce((sum, s) => sum + (s.rating || 3), 0) / relevantSessions.length
    confidence += (avgRating - 3) * 0.1 // -0.2 to +0.2 based on rating
  }
  
  return Math.min(1, Math.max(0, confidence))
}

function generateCase1Recommendations(
  pillLibrary: PillLabel[],
  campaignGoal?: any
): CaseRecommendation {
  // Case 1: No data - use generic, safe pills
  const case1Pills = pillLibrary.filter(p => p.useCase.includes(1))
  
  let selectedPills: PillLabel[] = []
  
  // Check for required pills from campaign goal
  const requiredPills: PillLabel[] = []
  if (campaignGoal?.ctaRequirement?.requiredPills && Array.isArray(campaignGoal.ctaRequirement.requiredPills)) {
    campaignGoal.ctaRequirement.requiredPills.forEach((requiredLabel: string) => {
      const foundPill = pillLibrary.find(p => 
        p.label.toLowerCase() === requiredLabel.toLowerCase() ||
        p.label.toLowerCase().includes(requiredLabel.toLowerCase())
      )
      if (foundPill && !requiredPills.find(rp => rp.id === foundPill.id)) {
        requiredPills.push(foundPill)
      }
    })
  }
  
  // Get min/max CTA count from campaign goal
  const minCtaCount = campaignGoal?.ctaRequirement?.minCount || 1
  const maxCtaCount = Math.min(campaignGoal?.ctaRequirement?.maxCount || 2, 2) // Cap at 2 for Case 1
  
  // Add required pills first (up to maxCtaCount)
  selectedPills.push(...requiredPills.slice(0, maxCtaCount))
  
  // If we need more CTA pills to meet minCount, add generic ones
  while (selectedPills.filter(p => p.type === 'cta').length < minCtaCount) {
    const additionalCta = case1Pills.find(p => 
      p.type === 'cta' && !selectedPills.find(sp => sp.id === p.id)
    ) || pillLibrary.find(p => 
      p.type === 'cta' && !selectedPills.find(sp => sp.id === p.id)
    )
    if (additionalCta) {
      selectedPills.push(additionalCta)
    } else {
      break
    }
  }
  
  // Fill remaining slots with non-CTA pills
  if (selectedPills.length < 4) {
    const orientationPill = case1Pills.find(p => 
      (p.intent.toLowerCase().includes('general') || p.label.toLowerCase().includes('help')) &&
      !selectedPills.find(sp => sp.id === p.id)
    )
    if (orientationPill) selectedPills.push(orientationPill)
  }
  
  if (selectedPills.length < 4) {
    const careerPill = case1Pills.find(p => 
      p.intent.toLowerCase().includes('career') &&
      p.type === 'anticipate' &&
      !selectedPills.find(sp => sp.id === p.id)
    )
    if (careerPill) selectedPills.push(careerPill)
  }
  
  if (selectedPills.length < 4) {
    const eligibilityPill = case1Pills.find(p => 
      p.intent.toLowerCase().includes('eligibility') &&
      p.type === 'anticipate' &&
      !selectedPills.find(sp => sp.id === p.id)
    )
    if (eligibilityPill) selectedPills.push(eligibilityPill)
  }
  
  // Fill any remaining slots with top confidence pills
  while (selectedPills.length < 4) {
    const nextPill = case1Pills.find(p => !selectedPills.find(sp => sp.id === p.id))
    if (nextPill) {
      selectedPills.push(nextPill)
    } else {
      break
    }
  }
  
  const reasoning = [
    'Generic default for unknown users',
    'Covers most common first-time intents',
    'Non-presumptive and broadly useful',
  ]
  
  if (requiredPills.length > 0) {
    reasoning.push(`Includes required CTA: ${requiredPills.map(p => p.label).join(', ')}`)
  } else {
    reasoning.push('Includes soft CTA for business goal')
  }
  
  return {
    case: 1,
    pills: selectedPills.slice(0, 4),
    reasoning
  }
}

function generateCase2Recommendations(
  pillLibrary: PillLabel[],
  intentClusters: IntentCluster[],
  campaignGoal?: any
): CaseRecommendation {
  // Case 2: Page/referral data - 2 anticipate + 2 entice
  const case2Pills = pillLibrary.filter(p => p.useCase.includes(2))
  
  let selectedPills: PillLabel[] = []
  
  // Get required pills from campaign goal
  const requiredPills: PillLabel[] = []
  if (campaignGoal?.ctaRequirement?.requiredPills && Array.isArray(campaignGoal.ctaRequirement.requiredPills)) {
    campaignGoal.ctaRequirement.requiredPills.forEach((requiredLabel: string) => {
      const foundPill = pillLibrary.find(p => 
        p.label.toLowerCase() === requiredLabel.toLowerCase() ||
        p.label.toLowerCase().includes(requiredLabel.toLowerCase())
      )
      if (foundPill && !requiredPills.find(rp => rp.id === foundPill.id)) {
        requiredPills.push(foundPill)
      }
    })
  }
  
  const minCtaCount = campaignGoal?.ctaRequirement?.minCount || 1
  const maxCtaCount = Math.min(campaignGoal?.ctaRequirement?.maxCount || 2, 2)
  
  // Get top 2 intents for anticipate pills
  const topIntents = intentClusters.slice(0, 2)
  const anticipatePills = topIntents.map(intent => 
    case2Pills.find(p => 
      p.intent === intent.intent && 
      p.type === 'anticipate' &&
      !selectedPills.find(sp => sp.id === p.id)
    )
  ).filter(Boolean) as PillLabel[]
  
  // Add 2 anticipate pills
  selectedPills.push(...anticipatePills.slice(0, 2))
  
  // Add required CTA pills (up to maxCtaCount)
  requiredPills.slice(0, maxCtaCount).forEach(pill => {
    if (!selectedPills.find(sp => sp.id === pill.id)) {
      selectedPills.push(pill)
    }
  })
  
  // If we need more pills to reach 4, add entice pills
  if (selectedPills.length < 4) {
    const enticePills = case2Pills.filter(p => 
      (p.type === 'entice' || p.type === 'cta') &&
      !selectedPills.find(sp => sp.id === p.id)
    )
    selectedPills.push(...enticePills.slice(0, 4 - selectedPills.length))
  }
  
  const reasoning = [
    'Based on page/referral context',
    '2 pills anticipate user intent from page topic',
    '2 pills entice with adjacent topics + campaign goal',
    'Demonstrates relevance while offering exploration'
  ]
  
  if (requiredPills.length > 0) {
    reasoning.push(`Required CTA included: ${requiredPills.map(p => p.label).join(', ')}`)
  }
  
  return {
    case: 2,
    pills: selectedPills.slice(0, 4),
    reasoning
  }
}

function generateCase3Recommendations(
  pillLibrary: PillLabel[],
  intentClusters: IntentCluster[],
  campaignGoal?: any
): CaseRecommendation {
  // Case 3: Rich data - highly targeted + strong CTA
  const case3Pills = pillLibrary.filter(p => p.useCase.includes(3))
  
  let selectedPills: PillLabel[] = []
  
  // Get required pills from campaign goal
  const requiredPills: PillLabel[] = []
  if (campaignGoal?.ctaRequirement?.requiredPills && Array.isArray(campaignGoal.ctaRequirement.requiredPills)) {
    campaignGoal.ctaRequirement.requiredPills.forEach((requiredLabel: string) => {
      const foundPill = pillLibrary.find(p => 
        p.label.toLowerCase() === requiredLabel.toLowerCase() ||
        p.label.toLowerCase().includes(requiredLabel.toLowerCase())
      )
      if (foundPill && !requiredPills.find(rp => rp.id === foundPill.id)) {
        requiredPills.push(foundPill)
      }
    })
  }
  
  const minCtaCount = campaignGoal?.ctaRequirement?.minCount || 1
  const maxCtaCount = Math.min(campaignGoal?.ctaRequirement?.maxCount || 2, 2)
  
  // Get most engaged intent for anticipate pills
  const topIntent = intentClusters[0]
  const anticipatePills = case3Pills
    .filter(p => p.intent === topIntent.intent && p.type === 'anticipate')
    .slice(0, 2)
  
  // Add anticipate pills
  selectedPills.push(...anticipatePills)
  
  // Add required CTA pills (Case 3 can have up to 2 CTAs)
  requiredPills.slice(0, maxCtaCount).forEach(pill => {
    if (!selectedPills.find(sp => sp.id === pill.id)) {
      selectedPills.push(pill)
    }
  })
  
  // Fill remaining slots with entice or additional CTA
  if (selectedPills.length < 4) {
    const enticePills = case3Pills.filter(p => 
      p.type === 'entice' &&
      !selectedPills.find(sp => sp.id === p.id)
    )
    selectedPills.push(...enticePills.slice(0, 4 - selectedPills.length))
  }
  
  // If still need to fill and have CTA budget, add more CTAs
  if (selectedPills.length < 4 && selectedPills.filter(p => p.type === 'cta').length < maxCtaCount) {
    const additionalCtas = case3Pills.filter(p => 
      p.type === 'cta' &&
      !selectedPills.find(sp => sp.id === p.id)
    )
    selectedPills.push(...additionalCtas.slice(0, 4 - selectedPills.length))
  }
  
  const reasoning = [
    'Tailored to user behavior and engagement',
    'Anticipate pills match most engaged topic',
    'Strong CTA aligned with campaign goal',
    'Sentiment can adjust CTA phrasing (positive = strong, negative = softer)'
  ]
  
  if (requiredPills.length > 0) {
    reasoning.push(`Required CTA enforced: ${requiredPills.map(p => p.label).join(', ')}`)
  }
  
  return {
    case: 3,
    pills: selectedPills.slice(0, 4),
    reasoning
  }
}

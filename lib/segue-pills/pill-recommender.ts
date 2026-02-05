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
  
  // Sort by confidence and frequency
  pillLibrary.sort((a, b) => {
    const scoreA = (a.confidence * 0.6) + (a.frequency / intentClusters.length * 0.4)
    const scoreB = (b.confidence * 0.6) + (b.frequency / intentClusters.length * 0.4)
    return scoreB - scoreA
  })
  
  // Generate Case 1 recommendations (Generic Default)
  const case1 = generateCase1Recommendations(pillLibrary, campaignGoal)
  
  // Generate Case 2 recommendations (Some Data)
  const case2 = generateCase2Recommendations(pillLibrary, intentClusters, campaignGoal)
  
  // Generate Case 3 recommendations (Rich Data)
  const case3 = generateCase3Recommendations(pillLibrary, intentClusters, campaignGoal)
  
  return {
    case1,
    case2,
    case3,
    pillLibrary
  }
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
  
  // Pick top pills by confidence
  const orientationPill = case1Pills.find(p => 
    p.intent.toLowerCase().includes('general') || 
    p.label.toLowerCase().includes('help')
  )
  
  const careerPill = case1Pills.find(p => 
    p.intent.toLowerCase().includes('career') &&
    p.type === 'anticipate'
  )
  
  const eligibilityPill = case1Pills.find(p => 
    p.intent.toLowerCase().includes('eligibility') &&
    p.type === 'anticipate'
  )
  
  const ctaPill = case1Pills.find(p => p.type === 'cta') || 
    pillLibrary.find(p => p.type === 'cta')
  
  const pills = [orientationPill, careerPill, eligibilityPill, ctaPill]
    .filter(Boolean) as PillLabel[]
  
  return {
    case: 1,
    pills: pills.slice(0, 4),
    reasoning: [
      'Generic default for unknown users',
      'Covers most common first-time intents',
      'Non-presumptive and broadly useful',
      'Includes soft CTA for business goal'
    ]
  }
}

function generateCase2Recommendations(
  pillLibrary: PillLabel[],
  intentClusters: IntentCluster[],
  campaignGoal?: any
): CaseRecommendation {
  // Case 2: Page/referral data - 2 anticipate + 2 entice
  const case2Pills = pillLibrary.filter(p => p.useCase.includes(2))
  
  // Get top 2 intents for anticipate pills
  const topIntents = intentClusters.slice(0, 2)
  const anticipatePills = topIntents.map(intent => 
    case2Pills.find(p => 
      p.intent === intent.intent && 
      p.type === 'anticipate'
    )
  ).filter(Boolean) as PillLabel[]
  
  // Get entice pills (adjacent topics + CTA)
  const enticePills = case2Pills.filter(p => p.type === 'entice' || p.type === 'cta')
    .slice(0, 2)
  
  return {
    case: 2,
    pills: [...anticipatePills, ...enticePills].slice(0, 4),
    reasoning: [
      'Based on page/referral context',
      '2 pills anticipate user intent from page topic',
      '2 pills entice with adjacent topics + campaign goal',
      'Demonstrates relevance while offering exploration'
    ]
  }
}

function generateCase3Recommendations(
  pillLibrary: PillLabel[],
  intentClusters: IntentCluster[],
  campaignGoal?: any
): CaseRecommendation {
  // Case 3: Rich data - highly targeted + strong CTA
  const case3Pills = pillLibrary.filter(p => p.useCase.includes(3))
  
  // Get most engaged intent for anticipate pills
  const topIntent = intentClusters[0]
  const anticipatePills = case3Pills
    .filter(p => p.intent === topIntent.intent && p.type === 'anticipate')
    .slice(0, 2)
  
  // Get CTA + one adjacent entice
  const ctaPills = case3Pills.filter(p => p.type === 'cta').slice(0, 1)
  const enticePills = case3Pills.filter(p => p.type === 'entice').slice(0, 1)
  
  return {
    case: 3,
    pills: [...anticipatePills, ...enticePills, ...ctaPills].slice(0, 4),
    reasoning: [
      'Tailored to user behavior and engagement',
      'Anticipate pills match most engaged topic',
      'Strong CTA aligned with campaign goal',
      'Sentiment can adjust CTA phrasing (positive = strong, negative = softer)'
    ]
  }
}

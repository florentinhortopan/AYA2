import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { generatePillRecommendations } from '@/lib/segue-pills/pill-recommender'
import { validatePillLabel } from '@/lib/segue-pills/answer-validator'
import type { IntentCluster } from '@/lib/segue-pills/intent-clusterer'
import type { PillLabel } from '@/lib/segue-pills/pill-recommender'

export const dynamic = 'force-dynamic'

const normalizePillLabel = (label: string): string => label.trim().toLowerCase()

const deduplicatePillsByLabel = (pills: PillLabel[]): PillLabel[] => {
  const seenLabels = new Set<string>()
  return pills.filter((pill) => {
    const normalized = normalizePillLabel(pill.label)
    if (seenLabels.has(normalized)) {
      return false
    }
    seenLabels.add(normalized)
    return true
  })
}

const CASE_POLICY = {
  minAnticipate: 1,
  minEntice: 1,
  maxPills: 4
} as const

const getRequiredBusinessLabels = (campaignGoal: any): string[] => {
  const labels = campaignGoal?.ctaRequirement?.requiredPills
  if (!Array.isArray(labels)) return []
  return labels
    .map((label: unknown) => String(label || '').trim())
    .filter(Boolean)
}

const matchesBusinessRequirement = (pill: PillLabel, requiredLabels: string[]): boolean => {
  if (requiredLabels.length === 0) {
    return pill.type === 'cta'
  }

  const label = normalizePillLabel(pill.label)
  return requiredLabels.some((required) => {
    const normalized = normalizePillLabel(required)
    return label === normalized || label.includes(normalized) || normalized.includes(label)
  })
}

const finalizeCasePills = (
  pills: PillLabel[],
  caseNumber: 1 | 2 | 3,
  caseName: string,
  validatedPillLibrary: PillLabel[],
  requiredBusinessLabels: string[] = [],
  fallbackCase1Pills: PillLabel[] = []
): PillLabel[] => {
  if (!Array.isArray(pills) || pills.length === 0) {
    return pills
  }

  const validatedCasePills = pills.filter((pill) => validatedPillLibrary.some((vp) => vp.id === pill.id))
  const prioritizedCasePills = deduplicatePillsByLabel(validatedCasePills)
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
  const originalCasePool = deduplicatePillsByLabel(pills)
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
  const validatedCasePool = deduplicatePillsByLabel(
    validatedPillLibrary
      .filter((pill) => Array.isArray(pill.useCase) && pill.useCase.includes(caseNumber))
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
  )

  const selected: PillLabel[] = []
  const selectedIds = new Set<string>()
  const selectedLabels = new Set<string>()
  const addPill = (pill: PillLabel | undefined) => {
    if (!pill) return false
    const normalized = normalizePillLabel(pill.label)
    if (selectedIds.has(pill.id) || selectedLabels.has(normalized)) return false
    selected.push(pill)
    selectedIds.add(pill.id)
    selectedLabels.add(normalized)
    return true
  }

  const businessPill =
    prioritizedCasePills.find((pill) => matchesBusinessRequirement(pill, requiredBusinessLabels)) ||
    validatedCasePool.find((pill) => matchesBusinessRequirement(pill, requiredBusinessLabels)) ||
    originalCasePool.find((pill) => matchesBusinessRequirement(pill, requiredBusinessLabels))
  addPill(businessPill)

  const anticipatePill =
    prioritizedCasePills.find((pill) => pill.type === 'anticipate') ||
    validatedCasePool.find((pill) => pill.type === 'anticipate') ||
    originalCasePool.find((pill) => pill.type === 'anticipate')
  addPill(anticipatePill)

  const enticePill =
    prioritizedCasePills.find((pill) => pill.type === 'entice') ||
    validatedCasePool.find((pill) => pill.type === 'entice') ||
    originalCasePool.find((pill) => pill.type === 'entice')
  addPill(enticePill)

  for (const candidate of validatedCasePool) {
    if (selected.length >= CASE_POLICY.maxPills) break
    addPill(candidate)
  }

  // Soft fallback for diversity: if validation is too strict, recover missing types from original case pills.
  if (!selected.some((pill) => pill.type === 'entice')) {
    addPill(originalCasePool.find((pill) => pill.type === 'entice'))
  }
  if (!selected.some((pill) => pill.type === 'anticipate')) {
    addPill(originalCasePool.find((pill) => pill.type === 'anticipate'))
  }

  const hasBusiness = selected.some((pill) => matchesBusinessRequirement(pill, requiredBusinessLabels))
  const anticipateCount = selected.filter((pill) => pill.type === 'anticipate').length
  const enticeCount = selected.filter((pill) => pill.type === 'entice').length
  const meetsPolicy =
    hasBusiness &&
    anticipateCount >= CASE_POLICY.minAnticipate &&
    enticeCount >= CASE_POLICY.minEntice

  if (!meetsPolicy) {
    if (caseNumber !== 1 && selected.length === 0 && fallbackCase1Pills.length > 0) {
      console.warn(
        `[Recommendations POST] ${caseName} has no pills after validation; falling back to case1`
      )
      return fallbackCase1Pills.slice(0, CASE_POLICY.maxPills)
    }
    console.warn(
      `[Recommendations POST] ${caseName} does not fully meet policy (business=${hasBusiness}, anticipate=${anticipateCount}, entice=${enticeCount}); keeping case-specific pills`
    )
  }

  const finalized = selected.slice(0, CASE_POLICY.maxPills)
  console.log(`[Recommendations POST] ${caseName}: finalized ${finalized.length}/${pills.length} pills`)
  return finalized
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { intentClusters, campaignGoal, testSessions, qaProjectId } = body

    if (!intentClusters || !Array.isArray(intentClusters) || intentClusters.length === 0) {
      return NextResponse.json(
        { error: 'Intent clusters array is required' },
        { status: 400 }
      )
    }

    // Generate pill recommendations
    const recommendations = generatePillRecommendations({
      intentClusters: intentClusters as IntentCluster[],
      campaignGoal,
      testSessions: testSessions || []
    })

    // Validate pills against available answers if Q&A project is linked
    if (qaProjectId) {
      console.log(`[Recommendations] Validating pills against Q&A project: ${qaProjectId}`)
      const requiredBusinessLabels = getRequiredBusinessLabels(campaignGoal)
      
      // Validate all pills in the library
      const validatedPillLibrary: PillLabel[] = []
      for (const pill of recommendations.pillLibrary) {
        const isValid = await validatePillLabel(
          pill.label,
          qaProjectId,
          ['approved', 'published', 'valid', 'pending'],
          ['approved', 'published', 'valid', 'pending']
        )
        
        if (isValid) {
          validatedPillLibrary.push(pill)
        } else {
          console.warn(`[Recommendations] Filtered out pill "${pill.label}" - no matching answers found`)
        }
      }

      // Update recommendations with validated pills
      recommendations.pillLibrary = validatedPillLibrary

      const case1Pills = finalizeCasePills(
        recommendations.case1.pills,
        1,
        'case1',
        validatedPillLibrary,
        requiredBusinessLabels
      )
      recommendations.case1.pills = case1Pills
      recommendations.case2.pills = finalizeCasePills(
        recommendations.case2.pills,
        2,
        'case2',
        validatedPillLibrary,
        requiredBusinessLabels,
        case1Pills
      )
      recommendations.case3.pills = finalizeCasePills(
        recommendations.case3.pills,
        3,
        'case3',
        validatedPillLibrary,
        requiredBusinessLabels,
        case1Pills
      )

      console.log(`[Recommendations POST] Validated pills: ${validatedPillLibrary.length}/${recommendations.pillLibrary.length} valid`)
    }

    return NextResponse.json({
      success: true,
      recommendations
    })

  } catch (error) {
    console.error('Error in recommendations API:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

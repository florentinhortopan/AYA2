import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { generatePillRecommendations } from '@/lib/segue-pills/pill-recommender'
import { validatePillLabel } from '@/lib/segue-pills/answer-validator'
import type { IntentCluster } from '@/lib/segue-pills/intent-clusterer'
import type { PillLabel } from '@/lib/segue-pills/pill-recommender'

export const dynamic = 'force-dynamic'

const jsonNoStore = (payload: unknown, init?: Parameters<typeof NextResponse.json>[1]) => {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  return response
}

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

const mergePillLibraries = (primary: PillLabel[], secondary: PillLabel[]): PillLabel[] => {
  const mergedByLabel = new Map<string, PillLabel>()

  const upsert = (pill: PillLabel) => {
    if (!pill?.id || !pill?.label) return
    const key = normalizePillLabel(pill.label)
    const current = mergedByLabel.get(key)
    if (!current) {
      mergedByLabel.set(key, pill)
      return
    }

    const currentConfidence = Number(current.confidence || 0)
    const nextConfidence = Number(pill.confidence || 0)
    const winner = nextConfidence > currentConfidence ? pill : current
    const mergedUseCase = Array.from(
      new Set([...(Array.isArray(current.useCase) ? current.useCase : []), ...(Array.isArray(pill.useCase) ? pill.useCase : [])])
    )
    mergedByLabel.set(key, { ...winner, useCase: mergedUseCase })
  }

  primary.forEach(upsert)
  secondary.forEach(upsert)
  return Array.from(mergedByLabel.values())
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
    // If no explicit labels are configured, CTA acts as business requirement.
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

  // Mandatory business pill first.
  const businessPill =
    prioritizedCasePills.find((pill) => matchesBusinessRequirement(pill, requiredBusinessLabels)) ||
    validatedCasePool.find((pill) => matchesBusinessRequirement(pill, requiredBusinessLabels))
  addPill(businessPill)

  // Guarantee at least one anticipate and one entice.
  const anticipatePill =
    prioritizedCasePills.find((pill) => pill.type === 'anticipate') ||
    validatedCasePool.find((pill) => pill.type === 'anticipate')
  addPill(anticipatePill)

  const enticePill =
    prioritizedCasePills.find((pill) => pill.type === 'entice') ||
    validatedCasePool.find((pill) => pill.type === 'entice')
  addPill(enticePill)

  // Fill remaining slots from validated pool by confidence.
  const backfillCandidates = validatedCasePool
    .filter((pill) => Array.isArray(pill.useCase) && pill.useCase.includes(caseNumber))

  for (const candidate of backfillCandidates) {
    if (selected.length >= CASE_POLICY.maxPills) break
    addPill(candidate)
  }

  const hasBusiness = selected.some((pill) => matchesBusinessRequirement(pill, requiredBusinessLabels))
  const anticipateCount = selected.filter((pill) => pill.type === 'anticipate').length
  const enticeCount = selected.filter((pill) => pill.type === 'entice').length
  const meetsPolicy =
    hasBusiness &&
    anticipateCount >= CASE_POLICY.minAnticipate &&
    enticeCount >= CASE_POLICY.minEntice

  if (!meetsPolicy) {
    if (caseNumber !== 1 && fallbackCase1Pills.length > 0) {
      console.warn(
        `[Recommendations GET] ${caseName} does not meet policy (business=${hasBusiness}, anticipate=${anticipateCount}, entice=${enticeCount}); falling back to case1`
      )
      return fallbackCase1Pills.slice(0, CASE_POLICY.maxPills)
    }
    console.warn(
      `[Recommendations GET] ${caseName} cannot meet policy and no fallback is available; keeping best validated pills`
    )
  }

  const finalized = selected.slice(0, CASE_POLICY.maxPills)
  console.log(`[Recommendations GET] ${caseName}: finalized ${finalized.length}/${pills.length} pills`)
  return finalized
}

export async function GET(
  request: NextRequest,
  { params }: { params: { researchId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return jsonNoStore({ error: 'Unauthorized' }, { status: 401 })
    }

    const { researchId } = params
    const campaignGoalId = request.nextUrl.searchParams.get('campaignGoalId')
    const useCase = request.nextUrl.searchParams.get('useCase') || '1'

    // Fetch research
    const research = await prisma.seguePillResearch.findUnique({
      where: { id: researchId },
      include: {
        campaignGoal: true,
        testSessions: {
          take: 100, // Use recent test sessions for learning
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!research) {
      return jsonNoStore({ error: 'Research not found' }, { status: 404 })
    }

    // Check if recommendations already exist
    if (research.recommendations) {
      const existing = research.recommendations as any
      
      // Validate pills against answers if Q&A project is linked
      if (research.qaProjectId && (existing.pillLibrary || research.pillLibrary)) {
        console.log(`[Recommendations GET] Validating existing pills against Q&A project: ${research.qaProjectId}`)
        const requiredBusinessLabels = getRequiredBusinessLabels(research.campaignGoal)
        const existingLibrary = Array.isArray(existing.pillLibrary) ? (existing.pillLibrary as PillLabel[]) : []
        const persistedLibrary = Array.isArray(research.pillLibrary) ? (research.pillLibrary as unknown as PillLabel[]) : []
        const sourceLibrary = mergePillLibraries(existingLibrary, persistedLibrary)
        
        const validatedPillLibrary: PillLabel[] = []
        for (const pill of sourceLibrary) {
          const isValid = await validatePillLabel(
            pill.label,
            research.qaProjectId,
            ['approved', 'published', 'valid', 'pending'],
            ['approved', 'published', 'valid', 'pending']
          )
          
          if (isValid) {
            validatedPillLibrary.push(pill)
          }
        }

        // Update recommendations with validated pills
        existing.pillLibrary = validatedPillLibrary

        const case1Pills = existing.case1
          ? finalizeCasePills(existing.case1.pills || [], 1, 'case1', validatedPillLibrary, requiredBusinessLabels)
          : []
        if (existing.case1) existing.case1.pills = case1Pills
        if (existing.case2) {
          existing.case2.pills = finalizeCasePills(
            existing.case2.pills || [],
            2,
            'case2',
            validatedPillLibrary,
            requiredBusinessLabels,
            case1Pills
          )
        }
        if (existing.case3) {
          existing.case3.pills = finalizeCasePills(
            existing.case3.pills || [],
            3,
            'case3',
            validatedPillLibrary,
            requiredBusinessLabels,
            case1Pills
          )
        }
      }
      
      return jsonNoStore({
        recommendations: existing,
        pillLibrary: existing.pillLibrary || []
      })
    }

    // If no recommendations, generate them from intent clusters
    if (!research.intentClusters) {
      return jsonNoStore({
        error: 'No intent clusters found. Please generate pills first in the Research Lab.'
      }, { status: 400 })
    }

    const intentClusters = research.intentClusters as unknown as IntentCluster[]
    
    // Get campaign goal if specified
    let campaignGoal = research.campaignGoal
    if (campaignGoalId && campaignGoalId !== research.campaignGoalId) {
      const goal = await prisma.segueCampaignGoal.findUnique({
        where: { id: campaignGoalId }
      })
      if (goal) campaignGoal = goal
    }

    // Generate recommendations
    const recommendations = generatePillRecommendations({
      intentClusters,
      campaignGoal: campaignGoal ? {
        goalType: campaignGoal.goalType,
        businessPrompt: campaignGoal.businessPrompt,
        ctaRequirement: campaignGoal.ctaRequirement as any
      } : undefined,
      testSessions: research.testSessions
    })

    // Validate pills against answers if Q&A project is linked
    if (research.qaProjectId) {
      console.log(`[Recommendations GET] Validating generated pills against Q&A project: ${research.qaProjectId}`)
      const requiredBusinessLabels = getRequiredBusinessLabels(campaignGoal)
      const persistedLibrary = Array.isArray(research.pillLibrary) ? (research.pillLibrary as unknown as PillLabel[]) : []
      const sourceLibrary = mergePillLibraries(recommendations.pillLibrary, persistedLibrary)
      
      const validatedPillLibrary: PillLabel[] = []
      for (const pill of sourceLibrary) {
        const isValid = await validatePillLabel(
          pill.label,
          research.qaProjectId,
          ['approved', 'published', 'valid', 'pending'],
          ['approved', 'published', 'valid', 'pending']
        )
        
        if (isValid) {
          validatedPillLibrary.push(pill)
        } else {
          console.warn(`[Recommendations GET] Filtered out pill "${pill.label}" - no matching answers found`)
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

      console.log(`[Recommendations GET] Validated pills: ${validatedPillLibrary.length}/${recommendations.pillLibrary.length} valid`)
    }

    // Optionally save recommendations back to database
    // (We'll do this async to not block the response)
    prisma.seguePillResearch.update({
      where: { id: researchId },
      data: { recommendations: recommendations as any }
    }).catch(console.error)

    return jsonNoStore({
      recommendations,
      pillLibrary: recommendations.pillLibrary
    })
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return jsonNoStore({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}

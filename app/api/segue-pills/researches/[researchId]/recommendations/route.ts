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
      if (research.qaProjectId && existing.pillLibrary) {
        console.log(`[Recommendations GET] Validating existing pills against Q&A project: ${research.qaProjectId}`)
        
        const validatedPillLibrary: PillLabel[] = []
        for (const pill of existing.pillLibrary) {
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

        // Filter case recommendations
        const filterPills = (pills: PillLabel[]) => 
          pills.filter(p => validatedPillLibrary.some(vp => vp.id === p.id))

        if (existing.case1) existing.case1.pills = filterPills(existing.case1.pills || [])
        if (existing.case2) existing.case2.pills = filterPills(existing.case2.pills || [])
        if (existing.case3) existing.case3.pills = filterPills(existing.case3.pills || [])
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
      
      const validatedPillLibrary: PillLabel[] = []
      for (const pill of recommendations.pillLibrary) {
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

      // Filter case recommendations
      const filterPills = (pills: PillLabel[]) => 
        pills.filter(p => validatedPillLibrary.some(vp => vp.id === p.id))

      recommendations.case1.pills = filterPills(recommendations.case1.pills)
      recommendations.case2.pills = filterPills(recommendations.case2.pills)
      recommendations.case3.pills = filterPills(recommendations.case3.pills)

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

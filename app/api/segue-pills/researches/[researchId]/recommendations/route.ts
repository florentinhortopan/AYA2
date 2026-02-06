import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { generatePillRecommendations } from '@/lib/segue-pills/pill-recommender'
import type { IntentCluster } from '@/lib/segue-pills/intent-clusterer'

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

    const intentClusters = research.intentClusters as IntentCluster[]
    
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

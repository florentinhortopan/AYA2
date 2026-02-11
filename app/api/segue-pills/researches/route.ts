import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const jsonNoStore = (payload: unknown, init?: Parameters<typeof NextResponse.json>[1]) => {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  return response
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return jsonNoStore({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all researches (optionally filter by status)
    const statusParam = request.nextUrl.searchParams.get('status')
    const withPillsOnly = request.nextUrl.searchParams.get('withPillsOnly') === 'true'
    const where: any = {}
    
    if (statusParam) {
      // Support comma-separated statuses
      const statuses = statusParam.split(',').map(s => s.trim())
      if (statuses.length === 1) {
        where.status = statuses[0]
      } else {
        where.status = { in: statuses }
      }
    }

    const researches = await prisma.seguePillResearch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        campaignGoal: {
          select: {
            id: true,
            name: true,
            goalType: true
          }
        },
        qaProject: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    // Filter to only researches with intentClusters (pills generated)
    // Either if withPillsOnly=true OR if status filter includes testing/completed
    let filteredResearches = researches
    if (withPillsOnly || (statusParam && (statusParam.includes('testing') || statusParam.includes('completed')))) {
      filteredResearches = researches.filter(r => r.intentClusters !== null && r.intentClusters !== undefined)
    }

    return jsonNoStore({ researches: filteredResearches })
  } catch (error) {
    console.error('Error fetching researches:', error)
    return jsonNoStore({ error: 'Failed to fetch researches' }, { status: 500 })
  }
}

// POST: Create or update a research project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return jsonNoStore({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id, // Optional: if provided, update existing
      name,
      description,
      personas,
      topics,
      questionCount,
      syntheticQuestions,
      scrapedQuestions,
      scrapedUrls,
      intentClusters,
      pillLibrary,
      recommendations,
      campaignGoalId,
      qaProjectId,
      status
    } = body

    if (!name) {
      return jsonNoStore({ error: 'Name is required' }, { status: 400 })
    }

    // Get user ID
    let userId: string | null = null
    if (session.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })
      userId = user?.id || null
    }

    // Determine status. Preserve explicit "published" to support operator publish workflow.
    let finalStatus = status || 'draft'
    if (status === 'published') {
      finalStatus = 'published'
    } else if (recommendations) {
      finalStatus = 'completed'
    } else if (intentClusters) {
      finalStatus = 'testing'
    }

    if (id) {
      // Update existing research
      const research = await prisma.seguePillResearch.update({
        where: { id },
        data: {
          name,
          description,
          personas: personas || [],
          topics: topics || [],
          questionCount: questionCount || 100,
          syntheticQuestions: syntheticQuestions || null,
          scrapedQuestions: scrapedQuestions || null,
          scrapedUrls: scrapedUrls || [],
          intentClusters: intentClusters || null,
          pillLibrary: pillLibrary || null,
          recommendations: recommendations || null,
          campaignGoalId: campaignGoalId || null,
          qaProjectId: qaProjectId || null,
          status: finalStatus
        }
      })

      return jsonNoStore({ research })
    } else {
      // Create new research
      const research = await prisma.seguePillResearch.create({
        data: {
          name,
          description,
          personas: personas || [],
          topics: topics || [],
          questionCount: questionCount || 100,
          syntheticQuestions: syntheticQuestions || null,
          scrapedQuestions: scrapedQuestions || null,
          scrapedUrls: scrapedUrls || [],
          intentClusters: intentClusters || null,
          pillLibrary: pillLibrary || null,
          recommendations: recommendations || null,
          campaignGoalId: campaignGoalId || null,
          qaProjectId: qaProjectId || null,
          status: finalStatus,
          createdById: userId
        }
      })

      return jsonNoStore({ research })
    }
  } catch (error) {
    console.error('Error saving research:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to save research'
    return jsonNoStore({ error: errorMessage }, { status: 500 })
  }
}

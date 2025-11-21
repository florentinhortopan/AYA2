import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all' // all, week, month, year

    // Calculate date filter
    let startDate: Date | undefined
    const now = new Date()
    
    switch (filter) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = undefined
    }

    // Fetch insights history
    const history = await prisma.insightsHistory.findMany({
      where: {
        userId,
        ...(startDate && { createdAt: { gte: startDate } })
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to last 100 snapshots
    })

    return NextResponse.json({
      history: history.map(h => ({
        id: h.id,
        engagementLevel: h.engagementLevel,
        engagementScore: h.engagementScore,
        experienceTotal: h.experienceTotal,
        sentimentLabel: h.sentimentLabel,
        sentimentScore: h.sentimentScore,
        preferences: h.preferences,
        personalityTraits: h.personalityTraits,
        snapshot: h.insightsSnapshot,
        createdAt: h.createdAt
      })),
      filter
    })
  } catch (error) {
    console.error('Insights history fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights history' },
      { status: 500 }
    )
  }
}


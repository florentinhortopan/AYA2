import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildUserContext, formatContextForPrompt } from '@/lib/context-builder'
import { analyzeConversationSentiment } from '@/lib/sentiment'
import { generateUserInsights } from '@/lib/insights'
import { prisma } from '@/lib/db'
import { saveInsightsSnapshot } from '@/lib/insights-history'

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

    // Build comprehensive context
    const userContext = await buildUserContext(userId)
    
    if (!userContext) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get all agent sessions for sentiment analysis
    const allAgentSessions = await prisma.agentSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 50
    })

    // Analyze sentiment
    const sentiment = await analyzeConversationSentiment(allAgentSessions)

    // Generate insights
    const insights = await generateUserInsights(userContext, sentiment || undefined)

    // Calculate total experience from all progress categories
    const totalExperience = userContext.progress.reduce((sum, p) => sum + p.experience, 0)

    // Save insights snapshot to history when insights change (non-blocking)
    if (insights && sentiment) {
      saveInsightsSnapshot(
        userId, 
        insights, 
        sentiment, 
        totalExperience,
        userContext.conversationInsights || undefined
      ).catch(err =>
        console.error('Failed to save insights snapshot:', err)
      )
    }

    // Get formatted context
    const formattedContext = formatContextForPrompt(userContext, 'recruitment' as any)

    // Get activity stats
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentActivities = await prisma.userActivity.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({
      profile: userContext.profile,
      progress: userContext.progress,
      activity: userContext.activity,
      usage: userContext.usage,
      conversations: userContext.conversations,
      sentiment: sentiment || null,
      insights: insights || null,
      formattedContext,
      recentActivities: recentActivities.map(a => ({
        type: a.type,
        agentType: a.agentType,
        action: a.action,
        page: a.page,
        createdAt: a.createdAt
      }))
    })
  } catch (error) {
    console.error('Insights fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}


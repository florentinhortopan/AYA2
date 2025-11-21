import { prisma } from './db'
import { UserInsight } from './insights'

/**
 * Saves an insights snapshot to history
 * This is called non-blocking to avoid slowing down the main request
 */
export async function saveInsightsSnapshot(
  userId: string,
  insights: UserInsight | null,
  sentiment: { score: number; sentiment: string; summary: string } | null,
  totalExperience: number
): Promise<void> {
  if (!insights || !sentiment) {
    return
  }

  try {
    const engagementLevelToScore: Record<string, number> = {
      low: 25,
      medium: 50,
      high: 75,
      very_high: 100
    }

    // Check if we should save (avoid saving duplicates too frequently)
    // Only save if last snapshot was more than 5 minutes ago
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recentSnapshot = await prisma.insightsHistory.findFirst({
      where: {
        userId,
        createdAt: { gte: fiveMinutesAgo }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Skip if we just saved a snapshot recently (rate limiting)
    if (recentSnapshot) {
      return
    }

    await prisma.insightsHistory.create({
      data: {
        userId,
        engagementLevel: insights.engagement.level,
        engagementScore: engagementLevelToScore[insights.engagement.level] || 50,
        experienceTotal: totalExperience,
        sentimentLabel: sentiment.sentiment,
        sentimentScore: sentiment.score,
        preferences: JSON.parse(JSON.stringify(insights.preferences || [])) as any,
        personalityTraits: JSON.parse(JSON.stringify(insights.personality?.traits || [])) as any,
        insightsSnapshot: JSON.parse(JSON.stringify({
          summary: insights.summary,
          preferences: insights.preferences,
          engagement: insights.engagement,
          recommendations: insights.recommendations,
          personality: insights.personality,
          sentiment: {
            sentiment: sentiment.sentiment,
            score: sentiment.score,
            summary: sentiment.summary
          }
        })) as any
      }
    })
  } catch (error) {
    // Silently fail - don't break the main flow
    console.error('Failed to save insights snapshot:', error)
  }
}


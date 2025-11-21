import { prisma } from './db'
import { UserInsight } from './insights'
import { ConversationInsights } from './conversation-extractor'

/**
 * Saves an insights snapshot to history when insights change
 * Detects actual changes in insights and saves data points for XY graph
 */
export async function saveInsightsSnapshot(
  userId: string,
  insights: UserInsight | null,
  sentiment: { score: number; sentiment: string; summary: string } | null,
  totalExperience: number,
  conversationInsights?: ConversationInsights | null
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

    // Get the most recent snapshot to compare
    const lastSnapshot = await prisma.insightsHistory.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    // Prepare current insights data for comparison
    const currentEngagement = insights.engagement.level
    const currentEngagementScore = engagementLevelToScore[currentEngagement] || 50
    const currentPreferences = JSON.stringify((insights.preferences || []).sort())
    const currentPersonalityTraits = JSON.stringify((insights.personality?.traits || []).sort())
    const currentSummary = insights.summary || ''
    const currentSentimentLabel = sentiment.sentiment
    const currentSentimentScore = sentiment.score

    // Check if insights have actually changed
    let hasChanged = false
    
    if (!lastSnapshot) {
      // First snapshot - always save
      hasChanged = true
      console.log(`First insights snapshot for user ${userId}`)
    } else {
      // Compare with last snapshot
      const lastEngagement = lastSnapshot.engagementLevel
      const lastEngagementScore = lastSnapshot.engagementScore || 0
      const lastPreferences = JSON.stringify((Array.isArray(lastSnapshot.preferences) ? lastSnapshot.preferences : []).sort())
      const lastPersonalityTraits = JSON.stringify((Array.isArray(lastSnapshot.personalityTraits) ? lastSnapshot.personalityTraits : []).sort())
      const lastSummary = (lastSnapshot.insightsSnapshot as any)?.summary || ''
      const lastSentimentLabel = lastSnapshot.sentimentLabel
      const lastSentimentScore = lastSnapshot.sentimentScore || 0
      const lastExperienceTotal = lastSnapshot.experienceTotal || 0

      // Check for meaningful changes (more lenient thresholds)
      const engagementChanged = currentEngagement !== lastEngagement || Math.abs(currentEngagementScore - lastEngagementScore) >= 3
      const preferencesChanged = currentPreferences !== lastPreferences
      const personalityChanged = currentPersonalityTraits !== lastPersonalityTraits
      
      // More lenient summary change detection - check if substantially different
      const summaryLengthDiff = Math.abs(currentSummary.length - lastSummary.length)
      const summarySubstantiallyDifferent = currentSummary !== lastSummary && 
        (currentSummary.length > 30 || lastSummary.length === 0 || summaryLengthDiff >= 20)
      
      const sentimentChanged = currentSentimentLabel !== lastSentimentLabel || 
        Math.abs(currentSentimentScore - lastSentimentScore) >= 0.15
      const experienceChanged = Math.abs(totalExperience - lastExperienceTotal) >= 5

      // Save if any meaningful change detected
      hasChanged = engagementChanged || preferencesChanged || personalityChanged || 
                   summarySubstantiallyDifferent || sentimentChanged || experienceChanged

      // Also check time-based: save if last snapshot was more than 10 minutes ago (even if no change)
      // This ensures we capture insights even if changes are subtle
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      const shouldSaveByTime = lastSnapshot.createdAt < tenMinutesAgo

      // If summary changed (even if other fields didn't), always save
      // AI-generated summaries change frequently and represent real insight updates
      const shouldSaveForSummaryChange = summarySubstantiallyDifferent && currentSummary.length > 30

      // Debug logging
      if (hasChanged || shouldSaveByTime || shouldSaveForSummaryChange) {
        console.log(`Insights snapshot decision for user ${userId}:`, {
          hasChanged,
          shouldSaveByTime,
          shouldSaveForSummaryChange,
          engagementChanged,
          preferencesChanged,
          personalityChanged,
          summaryChanged: summarySubstantiallyDifferent,
          sentimentChanged,
          experienceChanged,
          currentEngagement,
          lastEngagement,
          currentSummaryLength: currentSummary.length,
          lastSummaryLength: lastSummary.length,
          timeSinceLastSnapshot: Math.round((Date.now() - lastSnapshot.createdAt.getTime()) / 1000 / 60) + ' minutes'
        })
      }

      if (!hasChanged && !shouldSaveByTime && !shouldSaveForSummaryChange) {
        // No meaningful changes and recent snapshot exists
        console.log(`Skipping snapshot for user ${userId} - no significant changes detected`)
        return
      }
    }

    // Create comprehensive snapshot with conversation insights
    const snapshotData = {
      summary: insights.summary,
      preferences: insights.preferences,
      engagement: insights.engagement,
      recommendations: insights.recommendations,
      personality: insights.personality,
      sentiment: {
        sentiment: sentiment.sentiment,
        score: sentiment.score,
        summary: sentiment.summary
      },
      conversationInsights: conversationInsights ? {
        topics: conversationInsights.topics,
        interests: conversationInsights.interests,
        questions: conversationInsights.questions,
        concerns: conversationInsights.concerns,
        goals: conversationInsights.goals,
        preferences: conversationInsights.preferences,
        summary: conversationInsights.summary
      } : null
    }

    await prisma.insightsHistory.create({
      data: {
        userId,
        engagementLevel: currentEngagement,
        engagementScore: currentEngagementScore,
        experienceTotal: totalExperience,
        sentimentLabel: currentSentimentLabel,
        sentimentScore: currentSentimentScore,
        preferences: JSON.parse(JSON.stringify(insights.preferences || [])) as any,
        personalityTraits: JSON.parse(JSON.stringify(insights.personality?.traits || [])) as any,
        insightsSnapshot: JSON.parse(JSON.stringify(snapshotData)) as any
      }
    })

    console.log(`Insights snapshot saved for user ${userId} - Engagement: ${currentEngagement}, Experience: ${totalExperience}`)
  } catch (error) {
    // Silently fail - don't break the main flow
    console.error('Failed to save insights snapshot:', error)
  }
}


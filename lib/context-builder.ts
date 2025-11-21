import { prisma } from './db'
import { AgentType } from '@/types'

export interface UserContextData {
  profile: {
    age?: number | null
    location?: string | null
    interests: string[]
    fitnessLevel?: string | null
    mentalHealth?: string | null
    careerGoals?: any
    preferences?: any
  }
  progress: Array<{
    category: string
    level: number
    experience: number
    progress: any
  }>
  activity: {
    trainingLogs: Array<{
      type: string
      activity: string
      duration?: number | null
      intensity?: string | null
      createdAt: Date
    }>
    recentActions: number
    totalInteractions: number
  }
  usage: {
    agentCounts: Record<string, number>
    mostUsedAgent: string | null
    totalSessions: number
    recentActivity: Array<{
      agentType: string
      count: number
      lastInteraction: Date
    }>
  }
  conversations: Array<{
    agentType: string
    sessionCount: number
    totalMessages: number
    lastInteraction: Date
    topics?: string[]
  }>
}

/**
 * Aggregates comprehensive user context data for AI agents
 */
export async function buildUserContext(userId: string): Promise<UserContextData | null> {
  try {
    // Fetch profile
    const profile = await prisma.profile.findUnique({
      where: { userId }
    })

    if (!profile) {
      return null
    }

    // Fetch progress data
    const progress = await prisma.userProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    }).catch(() => []) // Graceful fallback

    // Fetch training logs (last 30 days, max 20)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const trainingLogs = await prisma.trainingLog.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        type: true,
        activity: true,
        duration: true,
        intensity: true,
        createdAt: true
      }
    }).catch(() => []) // Graceful fallback if query fails

    // Count recent actions (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentActions = await prisma.userActivity.count({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo }
      }
    }).catch(() => 0) // Graceful fallback

    // Fetch agent sessions
    const agentSessions = await prisma.agentSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 50 // Get recent sessions
    }).catch(() => []) // Graceful fallback

    // Count interactions per agent type
    const agentCounts: Record<string, number> = {}
    const agentLastInteraction: Record<string, Date> = {}
    
    agentSessions.forEach(session => {
      const agentType = session.agentType
      agentCounts[agentType] = (agentCounts[agentType] || 0) + 1
      
      if (!agentLastInteraction[agentType] || session.updatedAt > agentLastInteraction[agentType]) {
        agentLastInteraction[agentType] = session.updatedAt
      }
    })

    // Find most used agent
    const mostUsedAgent = Object.entries(agentCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null

    // Build usage stats
    const usage = {
      agentCounts,
      mostUsedAgent,
      totalSessions: agentSessions.length,
      recentActivity: Object.entries(agentCounts)
        .map(([agentType, count]) => ({
          agentType,
          count,
          lastInteraction: agentLastInteraction[agentType]
        }))
        .sort((a, b) => b.count - a.count)
    }

    // Analyze conversations per agent type
    const conversationAnalysis: Record<string, {
      sessionCount: number
      totalMessages: number
      lastInteraction: Date
      topics: string[]
    }> = {}

    agentSessions.forEach(session => {
      const agentType = session.agentType
      const sessionData = session.sessionData as any
      const messages = sessionData?.messages || []
      
      if (!conversationAnalysis[agentType]) {
        conversationAnalysis[agentType] = {
          sessionCount: 0,
          totalMessages: 0,
          lastInteraction: session.updatedAt,
          topics: []
        }
      }

      conversationAnalysis[agentType].sessionCount++
      conversationAnalysis[agentType].totalMessages += messages.length
      
      if (session.updatedAt > conversationAnalysis[agentType].lastInteraction) {
        conversationAnalysis[agentType].lastInteraction = session.updatedAt
      }

      // Extract topics from recent messages (simple keyword extraction)
      const topicKeywords = [
        'training', 'workout', 'career', 'benefits', 'education', 
        'physical', 'mental', 'fitness', 'special forces', 'it', 'technology',
        'combat', 'leadership', 'medical', 'aviation', 'intelligence', 'administration'
      ]
      
      messages.slice(-10).forEach((msg: any) => {
        if (msg.role === 'user' && msg.content) {
          const content = msg.content.toLowerCase()
          topicKeywords.forEach(keyword => {
            if (content.includes(keyword) && !conversationAnalysis[agentType].topics.includes(keyword)) {
              conversationAnalysis[agentType].topics.push(keyword)
            }
          })
        }
      })
    })

    const conversations = Object.entries(conversationAnalysis).map(([agentType, data]) => ({
      agentType,
      ...data
    }))

    return {
      profile: {
        age: profile.age,
        location: profile.location,
        interests: profile.interests || [],
        fitnessLevel: profile.fitnessLevel,
        mentalHealth: profile.mentalHealth,
        careerGoals: profile.careerGoals,
        preferences: profile.preferences
      },
      progress: progress.map(p => ({
        category: p.category,
        level: p.level,
        experience: p.experience,
        progress: p.progress
      })),
      activity: {
        trainingLogs: trainingLogs.map(log => ({
          type: log.type,
          activity: log.activity,
          duration: log.duration,
          intensity: log.intensity,
          createdAt: log.createdAt
        })),
        recentActions,
        totalInteractions: agentSessions.length
      },
      usage,
      conversations
    }
  } catch (error) {
    console.error('Error building user context:', error)
    return null
  }
}

/**
 * Formats user context into a readable prompt string
 */
export function formatContextForPrompt(
  context: UserContextData,
  currentAgentType: AgentType
): string {
  const lines: string[] = []

  // Profile section
  lines.push('=== USER PROFILE ===')
  if (context.profile.age) lines.push(`- Age: ${context.profile.age}`)
  if (context.profile.location) lines.push(`- Location: ${context.profile.location}`)
  if (context.profile.interests.length > 0) {
    lines.push(`- Interests: ${context.profile.interests.join(', ')}`)
  }
  if (context.profile.fitnessLevel) {
    lines.push(`- Fitness Level: ${context.profile.fitnessLevel}`)
  }
  if (context.profile.careerGoals) {
    try {
      const goals = typeof context.profile.careerGoals === 'string' 
        ? JSON.parse(context.profile.careerGoals) 
        : context.profile.careerGoals
      if (goals.text) {
        lines.push(`- Career Goals: ${goals.text}`)
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Progress section
  if (context.progress.length > 0) {
    lines.push('\n=== PROGRESS OVERVIEW ===')
    context.progress.forEach(p => {
      lines.push(`- ${p.category}: Level ${p.level}, ${p.experience} XP`)
    })
  }

  // Activity section
  if (context.activity.trainingLogs.length > 0) {
    lines.push('\n=== RECENT ACTIVITY ===')
    const recentCount = context.activity.trainingLogs.length
    const physicalCount = context.activity.trainingLogs.filter(l => l.type === 'physical').length
    const mentalCount = context.activity.trainingLogs.filter(l => l.type === 'mental').length
    lines.push(`- Training Sessions (last 30 days): ${recentCount} total (${physicalCount} physical, ${mentalCount} mental)`)
  }

  // Usage patterns section
  if (context.usage.totalSessions > 0) {
    lines.push('\n=== USAGE PATTERNS ===')
    lines.push(`- Total Interactions: ${context.usage.totalSessions}`)
    if (context.usage.mostUsedAgent) {
      lines.push(`- Most Used Agent: ${context.usage.mostUsedAgent} (${context.usage.agentCounts[context.usage.mostUsedAgent]} sessions)`)
    }
    if (context.usage.recentActivity.length > 0) {
      lines.push('- Agent Engagement:')
      context.usage.recentActivity.slice(0, 4).forEach(activity => {
        lines.push(`  • ${activity.agentType}: ${activity.count} sessions`)
      })
    }
  }

    // Conversation insights section
    if (context.conversations.length > 0) {
      lines.push('\n=== CONVERSATION HISTORY ===')
      context.conversations.forEach(conv => {
        lines.push(`- ${conv.agentType}: ${conv.sessionCount} sessions, ${conv.totalMessages} messages`)
        if (conv.topics && conv.topics.length > 0) {
          lines.push(`  Topics discussed: ${conv.topics.slice(0, 5).join(', ')}`)
        }
      })
    }

    // Current agent context
    const currentAgentContext = context.conversations.find(c => c.agentType === currentAgentType)
    if (currentAgentContext) {
      lines.push(`\n=== CURRENT AGENT (${currentAgentType}) ===`)
      lines.push(`- Previous sessions: ${currentAgentContext.sessionCount}`)
      lines.push(`- Total messages: ${currentAgentContext.totalMessages}`)
      if (currentAgentContext.topics && currentAgentContext.topics.length > 0) {
        lines.push(`- Previously discussed: ${currentAgentContext.topics.join(', ')}`)
      }
    }

  return lines.join('\n')
}


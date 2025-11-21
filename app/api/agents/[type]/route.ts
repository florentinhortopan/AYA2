import { NextRequest, NextResponse } from 'next/server'
import { createAgent, hasRichResponse } from '@/agents'
import { AgentType, RichAgentResponse } from '@/types'
import { prisma } from '@/lib/db'
import { buildUserContext, formatContextForPrompt } from '@/lib/context-builder'
import { analyzeConversationSentiment } from '@/lib/sentiment'
import { generateUserInsights } from '@/lib/insights'
import { saveInsightsSnapshot } from '@/lib/insights-history'

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const agentType = params.type as AgentType
    const body = await request.json()
    const { message, sessionId, userId, history = [] } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Validate agent type
    const validTypes: AgentType[] = ['recruitment', 'training', 'financial', 'educational']
    if (!validTypes.includes(agentType)) {
      return NextResponse.json(
        { error: 'Invalid agent type' },
        { status: 400 }
      )
    }

    // Build comprehensive user context if logged in
    let enhancedContext: Record<string, unknown> | undefined = undefined
    
    if (userId) {
      // Get comprehensive context data
      const userContext = await buildUserContext(userId)
      
      if (userContext) {
        // Get user's previous sessions with current agent for sentiment
        const currentAgentSessions = await prisma.agentSession.findMany({
          where: {
            userId,
            agentType
          },
          orderBy: { updatedAt: 'desc' },
          take: 10
        })

        // Analyze sentiment from conversations
        const sentiment = await analyzeConversationSentiment(currentAgentSessions)
        
        // Generate insights (cache this - could be expensive, run periodically)
        const insights = await generateUserInsights(userContext, sentiment || undefined)

        // Calculate total experience and save insights snapshot (non-blocking)
        if (insights && sentiment) {
          const totalExperience = userContext.progress.reduce((sum, p) => sum + p.experience, 0)
          saveInsightsSnapshot(userId, insights, sentiment, totalExperience).catch(err =>
            console.error('Failed to save insights snapshot:', err)
          )
        }

        // Format context for prompt
        const formattedContext = formatContextForPrompt(userContext, agentType)

        // Build enhanced context object
        enhancedContext = {
          profile: {
            age: userContext.profile.age,
            location: userContext.profile.location,
            interests: userContext.profile.interests,
            fitnessLevel: userContext.profile.fitnessLevel,
            mentalHealth: userContext.profile.mentalHealth,
            careerGoals: userContext.profile.careerGoals,
            preferences: userContext.profile.preferences
          },
          progress: userContext.progress,
          activity: userContext.activity,
          usage: userContext.usage,
          conversations: userContext.conversations,
          formattedContext, // Pre-formatted string for prompts
          sentiment: sentiment || null,
          insights: insights || null
        }

        // Track this interaction (non-blocking)
        prisma.userActivity.create({
          data: {
            userId,
            type: 'agent_interaction',
            agentType,
            action: 'message_sent',
            metadata: { messageLength: message.length } as any
          }
        }).catch(err => console.error('Activity tracking error:', err))
      }
    }

    // Create agent with enhanced context
    const agent = createAgent(agentType, {
      userId,
      sessionId,
      profile: enhancedContext?.profile as Record<string, unknown> | undefined,
      enhancedContext
    })

    // Process message with rich UI support
    let result: RichAgentResponse
    
    // Check if agent has processMessageRich method
    if ('processMessageRich' in agent && typeof (agent as any).processMessageRich === 'function') {
      // Use rich response if agent supports it
      result = await (agent as any).processMessageRich(message, history)
    } else {
      // Fallback to legacy method - BaseAgent always has processMessage
      const legacyResult = await agent.processMessage(message, history)
      result = {
        text: legacyResult.response,
        components: [],
        metadata: legacyResult.metadata
      }
    }

    const assistantMessage = {
      role: 'assistant' as const,
      content: result.text,
      timestamp: new Date().toISOString()
    }

    // Prepare session data as JSON-compatible
    const sessionData = {
      messages: [
        ...history,
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        assistantMessage
      ],
      lastResponse: JSON.parse(JSON.stringify(result)) as unknown // Serialize to ensure JSON compatibility
    }

    // Save or update agent session
    if (sessionId) {
      await prisma.agentSession.update({
        where: { id: sessionId },
        data: {
          sessionData: sessionData as any
        }
      })
    } else {
      // Create new session if needed
      const session = await prisma.agentSession.create({
        data: {
          userId: userId || undefined,
          agentType,
          sessionData: {
            messages: [
              { role: 'user', content: message, timestamp: new Date().toISOString() },
              assistantMessage
            ],
            lastResponse: JSON.parse(JSON.stringify(result)) as unknown
          } as any
        }
      })
      return NextResponse.json({
        ...result,
        sessionId: session.id
      })
    }

    return NextResponse.json({
      ...result,
      sessionId
    })
  } catch (error) {
    console.error('Agent API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const agentType = params.type as AgentType
    const agent = createAgent(agentType)
    
    return NextResponse.json({
      initialMessage: agent.getInitialMessage(),
      agentType
    })
  } catch (error) {
    console.error('Agent API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createAgent } from '@/agents'
import { AgentType } from '@/types'
import { prisma } from '@/lib/db'

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

    // Get user profile if logged in
    let profile: Record<string, unknown> | undefined = undefined
    if (userId) {
      const userProfile = await prisma.profile.findUnique({
        where: { userId }
      })
      if (userProfile) {
        profile = {
          interests: userProfile.interests,
          fitnessLevel: userProfile.fitnessLevel,
          careerGoals: userProfile.careerGoals,
          preferences: userProfile.preferences
        }
      }
    }

    // Create agent with context
    const agent = createAgent(agentType, {
      userId,
      sessionId,
      profile
    })

    // Process message
    const result = await agent.processMessage(message, history)

    // Save or update agent session
    if (sessionId) {
      await prisma.agentSession.update({
        where: { id: sessionId },
        data: {
          sessionData: {
            messages: [
              ...history,
              { role: 'user', content: message, timestamp: new Date().toISOString() },
              { role: 'assistant', content: result.response, timestamp: new Date().toISOString() }
            ]
          }
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
              { role: 'assistant', content: result.response, timestamp: new Date().toISOString() }
            ]
          }
        }
      })
      return NextResponse.json({
        response: result.response,
        sessionId: session.id,
        metadata: result.metadata
      })
    }

    return NextResponse.json({
      response: result.response,
      sessionId,
      metadata: result.metadata
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


import OpenAI from 'openai'
import { prisma } from './db'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface ConversationInsights {
  topics: string[] // Main topics discussed
  interests: string[] // Interests expressed
  questions: string[] // Key questions asked
  concerns: string[] // Concerns or worries mentioned
  goals: string[] // Goals or aspirations mentioned
  preferences: string[] // Preferences expressed
  summary: string // Brief summary of conversation themes
}

/**
 * Extracts meaningful insights from conversation history
 * Uses AI to understand what users actually discussed
 */
export async function extractConversationInsights(
  userId: string,
  limit: number = 50
): Promise<ConversationInsights | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null
  }

  try {
    // Fetch recent agent sessions
    const agentSessions = await prisma.agentSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit
    })

    if (agentSessions.length === 0) {
      return null
    }

    // Collect user messages from all sessions
    const userMessages: Array<{
      agentType: string
      content: string
      timestamp: string
    }> = []

    agentSessions.forEach(session => {
      const sessionData = session.sessionData as any
      const messages = sessionData?.messages || []
      
      messages.forEach((msg: any) => {
        if (msg.role === 'user' && msg.content && msg.content.trim().length > 10) {
          userMessages.push({
            agentType: session.agentType,
            content: msg.content,
            timestamp: msg.timestamp || session.updatedAt.toISOString()
          })
        }
      })
    })

    if (userMessages.length === 0) {
      return null
    }

    // Take recent messages (last 30 to avoid token limits)
    const recentMessages = userMessages.slice(0, 30)

    // Format messages for AI analysis
    const messagesText = recentMessages
      .map((m, idx) => {
        const date = new Date(m.timestamp).toLocaleDateString()
        return `[${m.agentType} agent, ${date}]: ${m.content}`
      })
      .join('\n\n')

    // Use AI to extract insights
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Analyze the following user conversation messages and extract meaningful insights. Return ONLY valid JSON in this format:
{
  "topics": [<array of main topics discussed, e.g., "physical training", "career paths", "fitness requirements">],
  "interests": [<array of interests explicitly expressed, e.g., "special forces", "IT roles", "mental wellness">],
  "questions": [<array of key questions asked, e.g., "What are the requirements?", "How do I prepare?">],
  "concerns": [<array of concerns or worries mentioned, e.g., "worried about fitness", "unsure about requirements">],
  "goals": [<array of goals or aspirations mentioned, e.g., "become an officer", "improve fitness", "learn new skills">],
  "preferences": [<array of preferences expressed, e.g., "prefers structured programs", "likes hands-on learning">],
  "summary": "<brief 2-3 sentence summary of what the user has been discussing across all conversations>"
}

Focus on extracting:
- Actual topics discussed (not just keywords)
- Interests the user explicitly mentioned
- Questions that reveal what they want to know
- Concerns that might affect their decisions
- Goals they've expressed
- Preferences about how they want to learn or be helped

Be specific and actionable.`
        },
        {
          role: 'user',
          content: `User conversation messages:\n\n${messagesText}`
        }
      ],
      temperature: 0.5,
      max_tokens: 600,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (content) {
      const parsed = JSON.parse(content)
      return {
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
        interests: Array.isArray(parsed.interests) ? parsed.interests : [],
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
        goals: Array.isArray(parsed.goals) ? parsed.goals : [],
        preferences: Array.isArray(parsed.preferences) ? parsed.preferences : [],
        summary: parsed.summary || ''
      }
    }

    return null
  } catch (error) {
    console.error('Conversation extraction error:', error)
    return null
  }
}

/**
 * Simple fallback extraction without AI (for when API key is not available)
 */
export function extractConversationInsightsSimple(
  sessions: Array<{ agentType: string; sessionData: any; updatedAt: Date }>
): ConversationInsights {
  const topics: string[] = []
  const interests: string[] = []
  const questions: string[] = []

  const topicKeywords: Record<string, string> = {
    'training': 'Physical Training',
    'workout': 'Physical Training',
    'fitness': 'Physical Fitness',
    'career': 'Career Paths',
    'benefits': 'Benefits',
    'education': 'Education',
    'physical': 'Physical Training',
    'mental': 'Mental Wellness',
    'special forces': 'Special Forces',
    'it': 'IT/Technology',
    'technology': 'IT/Technology',
    'combat': 'Combat Roles',
    'leadership': 'Leadership',
    'medical': 'Medical Roles',
    'aviation': 'Aviation',
    'intelligence': 'Intelligence',
    'administration': 'Administration',
    'requirements': 'Requirements',
    'qualifications': 'Requirements',
    'prepare': 'Preparation'
  }

  sessions.forEach(session => {
    const sessionData = session.sessionData as any
    const messages = sessionData?.messages || []
    
    messages.slice(-10).forEach((msg: any) => {
      if (msg.role === 'user' && msg.content) {
        const content = msg.content.toLowerCase()
        
        // Extract topics
        Object.entries(topicKeywords).forEach(([keyword, topic]) => {
          if (content.includes(keyword) && !topics.includes(topic)) {
            topics.push(topic)
          }
        })

        // Extract questions
        if (content.includes('?') || content.includes('what') || content.includes('how') || content.includes('why')) {
          const questionMatch = msg.content.match(/([^.!?]*\?)/)
          if (questionMatch && questionMatch[1].length > 10 && questionMatch[1].length < 150) {
            const question = questionMatch[1].trim()
            if (!questions.includes(question)) {
              questions.push(question)
            }
          }
        }
      }
    })
  })

  return {
    topics: topics.slice(0, 10),
    interests: [],
    questions: questions.slice(0, 5),
    concerns: [],
    goals: [],
    preferences: [],
    summary: `User has discussed ${topics.length} main topics across ${sessions.length} sessions.`
  }
}


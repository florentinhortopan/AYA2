import OpenAI from 'openai'
import { UserContextData } from './context-builder'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface UserInsight {
  summary: string // 2-3 sentence behavioral summary
  preferences: string[] // Key preferences identified
  engagement: {
    level: 'low' | 'medium' | 'high' | 'very_high'
    description: string
  }
  recommendations: string[] // Suggested focus areas or approaches
  personality: {
    traits: string[]
    learningStyle?: string
    motivationType?: string
  }
}

/**
 * Generates AI-powered insights about user behavior and preferences
 */
export async function generateUserInsights(
  context: UserContextData,
  sentiment?: { score: number; sentiment: string; summary: string } | null
): Promise<UserInsight | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null
  }

  try {
    // Format context data for AI analysis
    const contextSummary = `
Profile:
- Age: ${context.profile.age || 'Unknown'}
- Location: ${context.profile.location || 'Unknown'}
- Interests: ${context.profile.interests.join(', ') || 'None'}
- Fitness Level: ${context.profile.fitnessLevel || 'Unknown'}
- Career Goals: ${typeof context.profile.careerGoals === 'object' && context.profile.careerGoals?.text 
  ? context.profile.careerGoals.text 
  : 'Not specified'}

Progress:
${context.progress.map(p => `- ${p.category}: Level ${p.level}, ${p.experience} XP`).join('\n') || 'No progress data'}

Activity:
- Training Sessions: ${context.activity.trainingLogs.length} in last 30 days
- Total Interactions: ${context.activity.totalInteractions}

Usage Patterns:
- Most Used Agent: ${context.usage.mostUsedAgent || 'None'}
- Agent Distribution: ${Object.entries(context.usage.agentCounts).map(([k, v]) => `${k}: ${v}`).join(', ') || 'None'}

Conversations:
${context.conversations.map(c => 
  `- ${c.agentType}: ${c.sessionCount} sessions, ${c.totalMessages} messages${c.topics?.length > 0 ? `, topics: ${c.topics.slice(0, 3).join(', ')}` : ''}`
).join('\n') || 'No conversations'}

${sentiment ? `Sentiment: ${sentiment.sentiment} (${sentiment.summary})` : ''}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Analyze the user data and generate behavioral insights. Return ONLY valid JSON in this format:
{
  "summary": "<2-3 sentence summary of user's behavior, interests, and engagement patterns>",
  "preferences": [<array of identified preferences, e.g., "structured guidance", "technical content", "fitness focused">],
  "engagement": {
    "level": "low" | "medium" | "high" | "very_high",
    "description": "<brief description of engagement level>"
  },
  "recommendations": [<array of recommended approaches or focus areas for interactions>],
  "personality": {
    "traits": [<array of personality traits identified, e.g., "goal-oriented", "curious", "motivated">],
    "learningStyle": "<optional: preferred learning style if identifiable>",
    "motivationType": "<optional: what motivates the user>"
  }
}

Be concise but insightful. Focus on actionable insights that can improve agent interactions.`
        },
        {
          role: 'user',
          content: contextSummary
        }
      ],
      temperature: 0.7,
      max_tokens: 400,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (content) {
      const parsed = JSON.parse(content)
      return {
        summary: parsed.summary || '',
        preferences: parsed.preferences || [],
        engagement: parsed.engagement || { level: 'medium', description: '' },
        recommendations: parsed.recommendations || [],
        personality: parsed.personality || { traits: [] }
      }
    }

    return null
  } catch (error) {
    console.error('Insight generation error:', error)
    return null
  }
}


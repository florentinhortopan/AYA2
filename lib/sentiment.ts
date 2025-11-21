import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface SentimentAnalysis {
  score: number // -1 (very negative) to 1 (very positive)
  sentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive'
  confidence: number // 0 to 1
  keywords: string[]
  summary: string
}

/**
 * Analyzes sentiment of a conversation or text
 */
export async function analyzeSentiment(
  messages: Array<{ role: string; content: string }>
): Promise<SentimentAnalysis | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null
  }

  try {
    // Extract user messages (most relevant for sentiment)
    const userMessages = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n')

    if (!userMessages || userMessages.length < 10) {
      return {
        score: 0,
        sentiment: 'neutral',
        confidence: 0.5,
        keywords: [],
        summary: 'Insufficient data for sentiment analysis'
      }
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Analyze the sentiment of the following user messages. Return ONLY valid JSON in this format:
{
  "score": <number between -1 and 1>,
  "sentiment": "very_negative" | "negative" | "neutral" | "positive" | "very_positive",
  "confidence": <number between 0 and 1>,
  "keywords": [<array of key emotional words or phrases>],
  "summary": "<brief summary of the sentiment>"
}`
        },
        {
          role: 'user',
          content: userMessages.slice(0, 2000) // Limit to avoid token limits
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (content) {
      const parsed = JSON.parse(content)
      return {
        score: parsed.score || 0,
        sentiment: parsed.sentiment || 'neutral',
        confidence: parsed.confidence || 0.5,
        keywords: parsed.keywords || [],
        summary: parsed.summary || ''
      }
    }

    return null
  } catch (error) {
    console.error('Sentiment analysis error:', error)
    return null
  }
}

/**
 * Analyzes sentiment across multiple conversations
 */
export async function analyzeConversationSentiment(
  sessions: Array<{ sessionData: any; updatedAt: Date }>
): Promise<SentimentAnalysis | null> {
  if (sessions.length === 0) return null

  // Collect messages from all sessions
  const allMessages: Array<{ role: string; content: string }> = []
  
  sessions.forEach(session => {
    const sessionData = session.sessionData as any
    const messages = sessionData?.messages || []
    allMessages.push(...messages)
  })

  if (allMessages.length === 0) return null

  return analyzeSentiment(allMessages)
}


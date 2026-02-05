import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export interface SyntheticQuestion {
  id: string
  question: string
  intent: string
  persona: string
  context: string
  confidence: number
}

export interface QuestionGenerationParams {
  personas: string[]
  topics: string[]
  count: number
  campaignContext?: string
}

function buildQuestionGenerationPrompt(params: QuestionGenerationParams): string {
  const personasList = params.personas.join(', ')
  const topicsList = params.topics.join(', ')
  
  return `You are analyzing Army recruitment website visitors to generate realistic questions they would ask.

Generate ${params.count} diverse, realistic questions that users would ask when exploring:
${topicsList.split(',').map(t => `- ${t.trim()}`).join('\n')}

Consider these user personas:
${personasList.split(',').map(p => `- ${p.trim()}`).join('\n')}

${params.campaignContext ? `Campaign Context: ${params.campaignContext}\n` : ''}

Requirements:
- Questions should vary from beginner to advanced knowledge levels
- Use natural, conversational language (how real people ask questions)
- Mix question types: yes/no, how-to, what-if, comparison, eligibility
- Include context about user's situation where relevant
- Some should be direct, others more exploratory

Return a JSON object with this structure:
{
  "questions": [
    {
      "question": "The actual question text",
      "intent": "Primary intent category (eligibility, careers, benefits, training, join_process, general)",
      "persona": "Which persona would ask this",
      "context": "Brief context about why they're asking",
      "confidence": "How confident you are this is realistic (0.0-1.0)"
    }
  ]
}

Generate varied, realistic questions that feel authentic.`
}

export async function generateSyntheticQuestions(
  params: QuestionGenerationParams
): Promise<SyntheticQuestion[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: 'You are an expert at understanding user intent and generating realistic questions for user research.'
      }, {
        role: 'user',
        content: buildQuestionGenerationPrompt(params)
      }],
      response_format: { type: 'json_object' },
      temperature: 0.8, // Higher temperature for diversity
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const parsed = JSON.parse(content)
    
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response format: missing questions array')
    }

    const questions: SyntheticQuestion[] = parsed.questions.map((q: any, index: number) => ({
      id: `q_${Date.now()}_${index}`,
      question: q.question,
      intent: q.intent,
      persona: q.persona,
      context: q.context,
      confidence: q.confidence || 0.5
    }))

    return questions
  } catch (error) {
    console.error('Error generating synthetic questions:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to generate synthetic questions: ' + String(error))
  }
}

// Batch generation for large counts
export async function generateSyntheticQuestionsBatch(
  params: QuestionGenerationParams
): Promise<SyntheticQuestion[]> {
  const batchSize = 50 // Generate in batches of 50
  const batches = Math.ceil(params.count / batchSize)
  const allQuestions: SyntheticQuestion[] = []

  for (let i = 0; i < batches; i++) {
    const batchCount = Math.min(batchSize, params.count - (i * batchSize))
    const batchParams = { ...params, count: batchCount }
    
    const questions = await generateSyntheticQuestions(batchParams)
    allQuestions.push(...questions)
  }

  return allQuestions
}

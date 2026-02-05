import OpenAI from 'openai'
import type { SyntheticQuestion } from './question-generator'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export interface IntentCluster {
  intent: string
  description: string
  questionIds: string[]
  questions: string[]
  frequency: number
  pillCandidates: string[]
}

export async function clusterQuestionsIntoIntents(
  questions: SyntheticQuestion[]
): Promise<IntentCluster[]> {
  try {
    const questionsList = questions.map(q => ({
      id: q.id,
      question: q.question,
      suggestedIntent: q.intent
    }))

    const prompt = `Analyze these ${questions.length} user questions and cluster them into 8-12 core intent categories.

Questions:
${JSON.stringify(questionsList, null, 2)}

Requirements:
- Create 8-12 intent categories that cover all questions
- Each intent should be clear and actionable
- Group similar questions together
- Some questions may fit multiple intents (pick the primary one)
- For each intent, suggest 3-5 short pill labels (clickable prompts) that would address that intent

Common intent categories for Army recruitment:
- Eligibility & Requirements
- Career Exploration & MOS
- Benefits & Compensation
- Training & Education
- Joining Process & Next Steps
- Military Life & Culture
- Physical Fitness
- General Information

Return a JSON object:
{
  "clusters": [
    {
      "intent": "Intent name",
      "description": "Brief description of this intent",
      "questionIds": ["q_123", "q_456"],
      "pillCandidates": ["Short pill label 1", "Short pill label 2", "Short pill label 3"]
    }
  ]
}

Pill labels should be:
- 2-5 words max
- Action-oriented or question-based
- Clear and direct
- Natural language (how users would say it)`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: 'You are an expert at intent classification and user experience design for conversational interfaces.'
      }, {
        role: 'user',
        content: prompt
      }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const parsed = JSON.parse(content)
    
    // Enhance clusters with actual question text and frequency
    const clusters: IntentCluster[] = parsed.clusters.map((cluster: any) => {
      const clusterQuestions = questions.filter(q => 
        cluster.questionIds.includes(q.id)
      )
      
      return {
        intent: cluster.intent,
        description: cluster.description,
        questionIds: cluster.questionIds,
        questions: clusterQuestions.map(q => q.question),
        frequency: clusterQuestions.length,
        pillCandidates: cluster.pillCandidates
      }
    })

    // Sort by frequency (most common intents first)
    clusters.sort((a, b) => b.frequency - a.frequency)

    return clusters
  } catch (error) {
    console.error('Error clustering questions:', error)
    throw new Error('Failed to cluster questions into intents')
  }
}

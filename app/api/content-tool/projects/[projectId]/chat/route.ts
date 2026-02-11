import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { aiService } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const DEFAULT_QUESTION_STATUSES = ['approved']
const DEFAULT_ANSWER_STATUSES = ['approved']

const VARIANT_LEVELS = ['very_direct', 'direct', 'somewhat_direct', 'indirect'] as const
type VariantLevel = (typeof VARIANT_LEVELS)[number]

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'than', 'to', 'of', 'for', 'on', 'in', 'at', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'with', 'from', 'as', 'it', 'this', 'that', 'these',
  'those', 'i', 'you', 'we', 'they', 'he', 'she', 'my', 'your', 'our', 'their', 'me', 'us', 'them', 'do',
  'does', 'did', 'can', 'could', 'should', 'would', 'will', 'may', 'might', 'about', 'into', 'what', 'how',
  'why', 'when', 'where', 'which', 'who'
])

const jsonNoStore = (payload: unknown, init?: Parameters<typeof NextResponse.json>[1]) => {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  return response
}

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const tokenize = (value: string) =>
  normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))

const buildSearchableText = (
  questionText: string,
  topic?: string | null,
  persona?: string | null,
  tone?: string | null,
  answers?: Array<{ answerText: string; sourceLink?: string | null; keywords: string[] }>
) => {
  const answerText = answers?.map((answer) => answer.answerText).join(' ') || ''
  const answerKeywords = answers?.flatMap((answer) => answer.keywords).join(' ') || ''
  return [questionText, topic, persona, tone, answerText, answerKeywords].filter(Boolean).join(' ')
}

const scoreMatch = (queryTokens: string[], text: string) => {
  const textTokens = new Set(tokenize(text))
  let score = 0
  for (const token of queryTokens) {
    if (textTokens.has(token)) {
      score += 1
    }
  }
  return score
}

const parseVariantLevel = (value: string | null | undefined): VariantLevel | null => {
  if (!value) {
    return null
  }
  const normalized = value.toLowerCase().trim()
  return VARIANT_LEVELS.find((level) => level === normalized) || null
}

const resolveVariantLevel = async (message: string): Promise<VariantLevel> => {
  if (!process.env.OPENAI_API_KEY) {
    return 'direct'
  }

  const systemPrompt = [
    'You are a strict classifier.',
    'Classify the user message into one of:',
    'very_direct, direct, somewhat_direct, indirect.',
    'Return ONLY the label.'
  ].join('\n')

  const result = await aiService.generateResponse(
    [{ role: 'user', content: message }],
    { systemPrompt }
  )

  return parseVariantLevel(result) || 'direct'
}

/**
 * Generate an AI fallback response when no questions match or no close match is found.
 * Uses the project's corpus and guideline to provide contextual answers.
 */
const generateAIFallbackResponse = async (
  message: string,
  projectId: string
): Promise<{ response: string; variantLevel: VariantLevel }> => {
  if (!process.env.OPENAI_API_KEY) {
    return {
      response: 'I apologize, but I could not find a matching answer. Please try rephrasing your question or check back later.',
      variantLevel: 'direct'
    }
  }

  try {
    // Load project with corpus, guideline, and answer prompt
    const project = await prisma.qaProject.findUnique({
      where: { id: projectId },
      include: {
        corpusFile: true,
        guideline: true,
        answerPrompt: true
      }
    })

    if (!project) {
      return {
        response: 'Project not found.',
        variantLevel: 'direct'
      }
    }

    // Build system prompt with project context
    let systemPrompt = 'You are a helpful assistant that answers questions based on the provided knowledge base.\n\n'
    
    // Add corpus content if available (truncate if too large to avoid token limits)
    if (project.corpusFile?.fileContent) {
      const corpusContent = project.corpusFile.fileContent
      // Limit to ~50k characters to stay within reasonable token limits
      const maxCorpusLength = 50000
      const truncatedCorpus = corpusContent.length > maxCorpusLength
        ? corpusContent.substring(0, maxCorpusLength) + '\n\n[... corpus truncated for length ...]'
        : corpusContent
      systemPrompt += `## Knowledge Base\n${truncatedCorpus}\n\n`
    }

    // Add guideline if available
    if (project.guideline?.content) {
      systemPrompt += `## Guidelines\n${project.guideline.content}\n\n`
    }

    // Add answer prompt if available (for style consistency)
    if (project.answerPrompt?.content) {
      systemPrompt += `## Answer Style Guidelines\n${project.answerPrompt.content}\n\n`
    }

    systemPrompt += `## Instructions
- Answer the user's question based on the knowledge base and guidelines provided above.
- If the question cannot be answered from the knowledge base, politely explain that you don't have that information.
- Be helpful, accurate, and concise.
- Match the tone and style specified in the guidelines.`

    // Determine variant level
    const variantLevel = await resolveVariantLevel(message)

    // Generate response using OpenAI
    const response = await aiService.generateResponse(
      [{ role: 'user', content: message }],
      { systemPrompt }
    )

    return {
      response: response || 'I apologize, but I could not generate a response.',
      variantLevel
    }
  } catch (error) {
    console.error('Error generating AI fallback response:', error)
    return {
      response: 'I apologize, but I encountered an error while generating a response. Please try again.',
      variantLevel: 'direct'
    }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const body = await request.json()
  const { message, questionStatuses, answerStatuses } = body || {}

  if (!message || typeof message !== 'string') {
    return jsonNoStore({ error: 'message is required' }, { status: 400 })
  }

  const questionStatusList = Array.isArray(questionStatuses) && questionStatuses.length > 0
    ? questionStatuses
    : DEFAULT_QUESTION_STATUSES
  const answerStatusList = Array.isArray(answerStatuses) && answerStatuses.length > 0
    ? answerStatuses
    : DEFAULT_ANSWER_STATUSES

  // Project will be loaded again in fallback if needed, but we check it exists here
  const project = await prisma.qaProject.findUnique({
    where: { id: params.projectId }
  })

  if (!project) {
    return jsonNoStore({ error: 'Project not found' }, { status: 404 })
  }

  const questions = await prisma.qaQuestion.findMany({
    where: {
      projectId: params.projectId,
      status: { in: questionStatusList }
    },
    include: {
      answers: {
        where: {
          validationStatus: { in: answerStatusList }
        },
        orderBy: { updatedAt: 'desc' }
      }
    }
  })

  if (questions.length === 0) {
    // No questions match - use AI fallback
    const aiResponse = await generateAIFallbackResponse(message, params.projectId)
    return jsonNoStore(aiResponse)
  }

  const queryTokens = tokenize(message)
  if (queryTokens.length === 0) {
    // Query has no meaningful tokens (e.g., very short pill text) - use AI fallback
    const aiResponse = await generateAIFallbackResponse(message, params.projectId)
    return jsonNoStore(aiResponse)
  }

  const scored = questions
    .map((question) => ({
      question,
      score: scoreMatch(
        queryTokens,
        buildSearchableText(
          question.questionText,
          question.topic,
          question.persona,
          question.tone,
          question.answers.map((answer) => ({
            answerText: answer.answerText,
            sourceLink: answer.sourceLink,
            keywords: answer.keywords
          }))
        )
      )
    }))
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0 || scored[0].score === 0) {
    // No close match found - use AI fallback
    const aiResponse = await generateAIFallbackResponse(message, params.projectId)
    return jsonNoStore(aiResponse)
  }

  const best = scored.find((item) => item.score > 0 && item.question.answers.length > 0)
    || scored.find((item) => item.score > 0)
    || scored.find((item) => item.question.answers.length > 0)
    || scored[0]
  const variantLevel = await resolveVariantLevel(message)

  const answerForVariant =
    best.question.answers.find((answer) => answer.variantLevel === variantLevel) ||
    best.question.answers[0]

  if (!answerForVariant) {
    // No answer matches - use AI fallback
    const aiResponse = await generateAIFallbackResponse(message, params.projectId)
    return jsonNoStore({
      ...aiResponse,
      variantLevel // Use the variant level we already determined
    })
  }

  return jsonNoStore({
    response: answerForVariant.answerText,
    matchedQuestionId: best.question.id,
    matchedQuestionText: best.question.questionText,
    matchedQuestionStatus: best.question.status,
    matchedAnswerId: answerForVariant.id,
    matchedAnswerStatus: answerForVariant.validationStatus,
    matchedSourceLink: answerForVariant.sourceLink || null,
    variantLevel
  })
}

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
    return jsonNoStore({
      response: 'No questions match the current filters yet.',
      variantLevel: 'direct'
    })
  }

  const queryTokens = tokenize(message)
  if (queryTokens.length === 0) {
    return jsonNoStore({
      response: 'Please rephrase with more specific keywords so I can match a question.',
      variantLevel: 'direct'
    })
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
    return jsonNoStore({
      response: 'No close match found for that question. Try different keywords or add a related Q&A first.',
      variantLevel: 'direct'
    })
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
    return jsonNoStore({
      response: 'No answers match the current filters yet.',
      variantLevel
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

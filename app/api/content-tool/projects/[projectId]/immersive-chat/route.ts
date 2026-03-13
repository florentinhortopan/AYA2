import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import {
  buildFallbackPayload,
  ImmersiveCard,
  parseImmersiveScenePayload
} from '@/lib/content/immersive/scene-orchestrator'
import { collectImmersiveCards } from '@/lib/content/immersive/data-adapters'
import { prisma } from '@/lib/db'
import { extractMarkdownTables } from '@/lib/content/markdown-table'

export const dynamic = 'force-dynamic'

interface WorkspaceState {
  title: string
  summary: string
  audience: string
  tone: string
  goals: string[]
  sections: Array<{
    id: string
    title: string
    status: 'draft' | 'in_review' | 'ready'
    notes: string
  }>
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ImmersiveRequest {
  message?: string
  history?: ChatMessage[]
  state?: WorkspaceState
  sttEnabled?: boolean
  ttsEnabled?: boolean
}

const DEFAULT_QUESTION_STATUSES = ['approved']
const DEFAULT_ANSWER_STATUSES = ['approved', 'published', 'valid']

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'than', 'to', 'of', 'for', 'on', 'in', 'at', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'with', 'from', 'as', 'it', 'this', 'that', 'these',
  'those', 'i', 'you', 'we', 'they', 'he', 'she', 'my', 'your', 'our', 'their', 'me', 'us', 'them', 'do',
  'does', 'did', 'can', 'could', 'should', 'would', 'will', 'may', 'might', 'about', 'into', 'what', 'how',
  'why', 'when', 'where', 'which', 'who'
])

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const tokenize = (value: string) =>
  normalize(value)
    .split(' ')
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))

const scoreOverlap = (queryTokens: string[], text: string) => {
  const textTokens = new Set(tokenize(text))
  let score = 0
  for (const token of queryTokens) {
    if (textTokens.has(token)) score += 1
  }
  return score
}

const buildSearchText = (
  questionText: string,
  topic?: string | null,
  persona?: string | null,
  tone?: string | null,
  answers?: Array<{ answerText: string; keywords: string[] }>
) => {
  const answerText = answers?.map((a) => a.answerText).join(' ') || ''
  const answerKeywords = answers?.flatMap((a) => a.keywords).join(' ') || ''
  return [questionText, topic, persona, tone, answerText, answerKeywords].filter(Boolean).join(' ')
}

const truncate = (value: string, max = 320) => {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trim()}...`
}

type QaMatch = {
  projectId: string
  projectName: string
  questionId: string
  questionText: string
  answerId: string
  answerText: string
  sourceUrl: string | null
  score: number
}

async function findBestQaMatch(projectId: string, message: string, history: ChatMessage[]): Promise<QaMatch | null> {
  const queryTokens = tokenize(
    [...history.filter((h) => h.role === 'user').map((h) => h.content).slice(-4), message].join(' ')
  )
  if (queryTokens.length === 0) return null

  const fetchQuestions = async (where: { projectId?: string }) =>
    prisma.qaQuestion.findMany({
      where: {
        ...where,
        status: { in: DEFAULT_QUESTION_STATUSES as any }
      },
      include: {
        project: { select: { id: true, name: true } },
        answers: {
          where: { validationStatus: { in: DEFAULT_ANSWER_STATUSES as any } },
          orderBy: { updatedAt: 'desc' }
        }
      },
      take: where.projectId ? 300 : 1200
    })

  const scoreQuestions = (questions: Awaited<ReturnType<typeof fetchQuestions>>) =>
    questions
    .map((question) => ({
      question,
      score: scoreOverlap(
        queryTokens,
        buildSearchText(
          question.questionText,
          question.topic,
          question.persona,
          question.tone,
          question.answers.map((answer) => ({
            answerText: answer.answerText,
            keywords: answer.keywords
          }))
        )
      )
    }))
    .sort((a, b) => b.score - a.score)

  // First prefer current project.
  const scopedQuestions = await fetchQuestions({ projectId })
  let scored = scoreQuestions(scopedQuestions)
  let best = scored.find((item) => item.score > 0 && item.question.answers.length > 0)

  // Then fall back to all projects as testing ground.
  if (!best) {
    const allQuestions = await fetchQuestions({})
    scored = scoreQuestions(allQuestions)
    best = scored.find((item) => item.score > 0 && item.question.answers.length > 0)
  }

  if (!best) return null

  const answer = best.question.answers[0]
  return {
    projectId: best.question.project?.id || projectId,
    projectName: best.question.project?.name || 'Current Project',
    questionId: best.question.id,
    questionText: best.question.questionText,
    answerId: answer.id,
    answerText: answer.answerText,
    sourceUrl: answer.sourceLink || null,
    score: best.score
  }
}

function buildQaDrivenCards(match: QaMatch | null) {
  if (!match) return []

  const cards: ImmersiveCard[] = []
  cards.push({
    id: `qa-answer-${match.answerId}`,
    type: 'insight',
    title: `Q&A Match: ${match.questionText}`,
    body: truncate(match.answerText, 380),
    sourceUrl: match.sourceUrl || undefined,
    metadata: {
      project: match.projectName,
      score: match.score
    }
  })

  const tables = extractMarkdownTables(match.answerText).slice(0, 2)
  tables.forEach((table, index) => {
    cards.push({
      id: `qa-table-${match.answerId}-${index}`,
      type: 'table',
      title: `${match.projectName} - Structured Data`,
      body: 'Extracted table view from the matched answer.',
      sourceUrl: match.sourceUrl || undefined,
      table: {
        headers: table.headers,
        rows: table.rows
      },
      metadata: {
        columns: table.headers.length,
        rows: table.rows.length
      }
    })
  })

  return cards
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const body = (await request.json()) as ImmersiveRequest
    const {
      message,
      history = [],
      state,
      sttEnabled = false,
      ttsEnabled = false
    } = body

    if (!message || !state) {
      return NextResponse.json({ error: 'Message and state are required' }, { status: 400 })
    }

    const cards = await collectImmersiveCards({
      projectId: params.projectId,
      message,
      history
    })
    const qaMatch = await findBestQaMatch(params.projectId, message, history)
    const qaCards = buildQaDrivenCards(qaMatch)
    const candidateCards = [...qaCards, ...cards]
    const qaReply = qaMatch
      ? qaMatch.answerText
      : "I couldn't find a strong Q&A match yet. Try a more specific question, or seed more approved Q&A entries."

    const fallbackPayload = buildFallbackPayload({
      message,
      cards: candidateCards,
      sttEnabled,
      ttsEnabled,
      reply: qaReply
    })

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(fallbackPayload)
    }

    const shortHistory = history.slice(-8).map((entry) => ({
      role: entry.role,
      content: entry.content
    }))

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: `You are an immersive full-page chatbot orchestrator.
Return only JSON with this shape:
{
  "assistantReply": "short assistant response to user",
  "sceneDirectives": [
    {
      "id": "string",
      "action": "hero_swap|panel_add|panel_remove|emphasis|cta_state|focus_shift",
      "target": "string",
      "transition": "fade|slide|parallax|none",
      "intensity": 0.0,
      "reason": "string"
    }
  ],
  "contentCards": [
    {
      "id": "string",
      "type": "rag|job|video|cta|insight|table|image",
      "title": "string",
      "body": "string",
      "sourceUrl": "optional url",
      "thumbnailUrl": "optional url",
      "metadata": {}
    }
  ],
  "voiceDirectives": {
    "speak": true,
    "priority": "low|normal|high",
    "mode": "none|stt|stt_tts"
  },
  "telemetry": {
    "journey": "discover|compare|convert",
    "confidence": 0.0,
    "sourceAttributionCount": 0
  }
}
Use at most 6 content cards.
Keep reply concise and practical.
Never invent source URLs; only use provided cards.`
        },
        {
          role: 'user',
          content: JSON.stringify({
            projectId: params.projectId,
            message,
            history: shortHistory,
            currentState: state,
            candidateCards: candidateCards.slice(0, 8),
            defaultSceneDirectives: fallbackPayload.sceneDirectives,
            voicePreference: { sttEnabled, ttsEnabled },
            qaReply,
            qaMatch: qaMatch
              ? {
                  projectName: qaMatch.projectName,
                  questionText: qaMatch.questionText,
                  sourceUrl: qaMatch.sourceUrl
                }
              : null
          })
        }
      ]
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(fallbackPayload)
    }

    const parsedRaw = JSON.parse(content) as unknown
    const parsed = parseImmersiveScenePayload(parsedRaw)
    if (!parsed) {
      return NextResponse.json(fallbackPayload)
    }

    // Keep conversational response grounded in Q&A while canvas remains rich/multimodal.
    const mergedCards = [...qaCards, ...parsed.contentCards]
      .filter((card, index, array) => array.findIndex((c) => c.id === card.id) === index)
      .slice(0, 8)

    return NextResponse.json({
      ...parsed,
      assistantReply: qaReply,
      contentCards: mergedCards
    })
  } catch (error) {
    console.error('Immersive chat error:', error)
    return NextResponse.json({ error: 'Failed to process immersive chat' }, { status: 500 })
  }
}

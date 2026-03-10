import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { buildFallbackPayload, parseImmersiveScenePayload } from '@/lib/content/immersive/scene-orchestrator'
import { collectImmersiveCards } from '@/lib/content/immersive/data-adapters'

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

    const fallbackPayload = buildFallbackPayload({
      message,
      cards,
      sttEnabled,
      ttsEnabled,
      reply:
        "I updated the immersive workspace. Tell me what to compare, what story to show, or ask me to move toward application guidance."
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
      "type": "rag|job|video|cta|insight",
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
            candidateCards: fallbackPayload.contentCards,
            defaultSceneDirectives: fallbackPayload.sceneDirectives,
            voicePreference: { sttEnabled, ttsEnabled }
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

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Immersive chat error:', error)
    return NextResponse.json({ error: 'Failed to process immersive chat' }, { status: 500 })
  }
}

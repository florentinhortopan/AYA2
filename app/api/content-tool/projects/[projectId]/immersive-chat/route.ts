import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

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

interface ImmersiveUpdate {
  setTitle?: string
  setSummary?: string
  setAudience?: string
  setTone?: string
  addGoals?: string[]
  updateSectionStatus?: Array<{
    id: string
    status: 'draft' | 'in_review' | 'ready'
    notes?: string
  }>
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

function fallbackResponse(message: string): { reply: string; updates: ImmersiveUpdate } {
  const lower = message.toLowerCase()
  const updates: ImmersiveUpdate = {}

  if (lower.includes('tone')) {
    updates.setTone = 'confident'
  }
  if (lower.includes('summary') || lower.includes('positioning')) {
    updates.setSummary = 'Clear value-first messaging for first-time visitors.'
  }
  if (lower.includes('goal')) {
    updates.addGoals = ['Increase engagement on primary call-to-action']
  }
  if (lower.includes('publish') || lower.includes('ready')) {
    updates.updateSectionStatus = [{ id: 'publish', status: 'ready', notes: 'Ready for release check.' }]
  }

  return {
    reply:
      "I updated the workspace based on your request. You can keep guiding me with messages like 'set tone to bold', 'add a goal for conversions', or 'mark publish as ready'.",
    updates
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const body = await request.json()
    const {
      message,
      history = [],
      state
    }: { message?: string; history?: ChatMessage[]; state?: WorkspaceState } = body

    if (!message || !state) {
      return NextResponse.json({ error: 'Message and state are required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(fallbackResponse(message))
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
          content: `You are a workspace copilot for content teams.
Return only JSON with this shape:
{
  "reply": "short assistant response to user",
  "updates": {
    "setTitle": "optional string",
    "setSummary": "optional string",
    "setAudience": "optional string",
    "setTone": "optional string",
    "addGoals": ["optional", "string", "array"],
    "updateSectionStatus": [
      { "id": "strategy|questions|answers|publish", "status": "draft|in_review|ready", "notes": "optional" }
    ]
  }
}
Only propose updates that are explicitly useful from the user message.
Keep reply concise and practical.`
        },
        {
          role: 'user',
          content: JSON.stringify({
            projectId: params.projectId,
            message,
            history: shortHistory,
            currentState: state
          })
        }
      ]
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(fallbackResponse(message))
    }

    const parsed = JSON.parse(content) as {
      reply?: string
      updates?: ImmersiveUpdate
    }

    return NextResponse.json({
      reply: parsed.reply || 'I made a few updates to the workspace.',
      updates: parsed.updates || {}
    })
  } catch (error) {
    console.error('Immersive chat error:', error)
    return NextResponse.json({ error: 'Failed to process immersive chat' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { runPrompt } from '@/lib/content/prompt-runner'
import { resolvePromptAndGuideline } from '@/lib/content/prompt-resolver'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { systemPrompt, userMessage, guidelineText, promptId, guidelineId, projectId } = body || {}

  if (!userMessage) {
    return NextResponse.json({ error: 'userMessage is required' }, { status: 400 })
  }

  try {
    const resolved = await resolvePromptAndGuideline({
      promptType: 'question_generator',
      promptId,
      guidelineId,
      projectId,
    })

    const finalSystemPrompt = resolved.systemPrompt || systemPrompt
    if (!finalSystemPrompt) {
      return NextResponse.json({ error: 'systemPrompt or promptId is required' }, { status: 400 })
    }

    const output = await runPrompt({
      systemPrompt: finalSystemPrompt,
      userMessage,
      guidelineText: resolved.guidelineText || guidelineText
    })

    return NextResponse.json({
      output,
      promptId: resolved.promptId,
      guidelineId: resolved.guidelineId
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to resolve prompt'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

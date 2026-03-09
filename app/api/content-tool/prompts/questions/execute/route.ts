import { NextRequest, NextResponse } from 'next/server'
import { runPrompt } from '@/lib/content/prompt-runner'
import { resolvePromptAndGuideline } from '@/lib/content/prompt-resolver'
import { parseQuestionsFromMarkdown } from '@/lib/content/qa-parser'
import { prisma } from '@/lib/db'

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

    const strictUserMessage = `${userMessage}\n\nOutput format requirements:\n- Return ONLY a markdown table.\n- Columns must be exactly: topic | persona | tone | question | source_urls\n- source_urls should be comma-separated if multiple.\n- Do not include commentary or additional sections.`

    const output = await runPrompt({
      systemPrompt: finalSystemPrompt,
      userMessage: strictUserMessage,
      guidelineText: resolved.guidelineText || guidelineText
    })

    const parsedQuestions = parseQuestionsFromMarkdown(output)
    let createdCount = 0
    let skippedCount = 0

    if (projectId && parsedQuestions.length > 0) {
      const payload = parsedQuestions.map((row) => ({
        projectId,
        topic: row.topic,
        persona: row.persona,
        tone: row.tone,
        questionText: row.questionText,
        sourceUrls: row.sourceUrls ?? [],
        ratingDefault: 3,
        ratingValue: 3,
      }))

      const result = await prisma.qaQuestion.createMany({
        data: payload
      })

      createdCount = result.count
      skippedCount = parsedQuestions.length - result.count
    }

    return NextResponse.json({
      output,
      parsedQuestions,
      createdCount,
      skippedCount,
      promptId: resolved.promptId,
      guidelineId: resolved.guidelineId
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to resolve prompt'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

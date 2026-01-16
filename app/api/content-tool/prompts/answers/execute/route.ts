import { NextRequest, NextResponse } from 'next/server'
import { runPrompt } from '@/lib/content/prompt-runner'
import { resolvePromptAndGuideline } from '@/lib/content/prompt-resolver'
import { normalizeVariantLevel, parseAnswersFromMarkdown } from '@/lib/content/qa-parser'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { systemPrompt, userMessage, guidelineText, promptId, guidelineId, projectId } = body || {}

  if (!userMessage) {
    return NextResponse.json({ error: 'userMessage is required' }, { status: 400 })
  }

  try {
    const resolved = await resolvePromptAndGuideline({
      promptType: 'answer_generator',
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

    const parsedAnswers = parseAnswersFromMarkdown(output)
    let createdCount = 0
    let skippedCount = 0

    if (projectId && parsedAnswers.length > 0) {
      const questions = await prisma.qaQuestion.findMany({
        where: { projectId },
        select: { id: true, questionText: true }
      })
      const questionLookup = new Map(
        questions.map((question) => [question.questionText.trim(), question.id])
      )

      const payload = parsedAnswers.flatMap((row) => {
        const questionText = row.questionText?.trim()
        const questionId = questionText ? questionLookup.get(questionText) : undefined

        if (!questionId) {
          skippedCount += 1
          return []
        }

        return [{
          questionId,
          variantLevel: normalizeVariantLevel(row.variantLevel),
          answerText: row.answerText,
          sourceLink: row.sourceLink,
          keywords: [],
          characterCount: row.answerText.length,
          ratingDefault: 3,
          ratingValue: 3,
        }]
      })

      if (payload.length > 0) {
        const result = await prisma.qaAnswer.createMany({
          data: payload
        })
        createdCount = result.count
      }
    }

    return NextResponse.json({
      output,
      parsedAnswers,
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

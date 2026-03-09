import { NextRequest, NextResponse } from 'next/server'
import { runPrompt } from '@/lib/content/prompt-runner'
import { resolvePromptAndGuideline } from '@/lib/content/prompt-resolver'
import { normalizeVariantLevel, parseAnswersFromMarkdown } from '@/lib/content/qa-parser'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { systemPrompt, userMessage, guidelineText, promptId, guidelineId, projectId, questionId } = body || {}

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

    let resolvedQuestionText: string | undefined
    if (questionId) {
      const question = await prisma.qaQuestion.findUnique({
        where: { id: questionId },
        select: { id: true, questionText: true }
      })

      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
      }

      resolvedQuestionText = question.questionText
    }

    const strictUserMessage = `${userMessage}\n\nOutput format requirements:\n- Return ONLY a markdown table.\n- Columns must be exactly: question | variant_level | answer | source_link | keywords\n- keywords should be comma-separated if multiple.\n- Do not include commentary or additional sections.`

    const output = await runPrompt({
      systemPrompt: finalSystemPrompt,
      userMessage: resolvedQuestionText
        ? `${strictUserMessage}\n\nQuestion:\n${resolvedQuestionText}`
        : strictUserMessage,
      guidelineText: resolved.guidelineText || guidelineText
    })

    const parsedAnswers = parseAnswersFromMarkdown(output).map((row) => ({
      ...row,
      questionText: row.questionText || resolvedQuestionText
    }))
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
        const resolvedQuestionId = questionId || (questionText ? questionLookup.get(questionText) : undefined)

        if (!resolvedQuestionId) {
          skippedCount += 1
          return []
        }

        return [{
          questionId: resolvedQuestionId,
          variantLevel: normalizeVariantLevel(row.variantLevel),
          answerText: row.answerText,
          sourceLink: row.sourceLink,
          keywords: row.keywords ?? [],
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

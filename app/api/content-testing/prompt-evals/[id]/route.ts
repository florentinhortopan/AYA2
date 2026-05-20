import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import { updatePromptEvalSchema } from '@/lib/content-testing/schemas'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const promptEval = await prisma.contentTestPromptEval.findUnique({
      where: { id: params.id },
      include: {
        scores: true,
        issues: true,
        quoteEvaluation: true,
        nextStepEvaluation: true,
      },
    })
    if (!promptEval) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ promptEval })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const body = updatePromptEvalSchema.parse(await req.json())
    const promptEval = await prisma.contentTestPromptEval.update({
      where: { id: params.id },
      data: {
        ...(body.promptText !== undefined ? { promptText: body.promptText } : {}),
        ...(body.topicArea !== undefined ? { topicArea: body.topicArea ?? null } : {}),
        ...(body.responseSummary !== undefined ? { responseSummary: body.responseSummary ?? null } : {}),
        ...(body.fullResponse !== undefined ? { fullResponse: body.fullResponse ?? null } : {}),
        ...(body.responseUrl !== undefined ? { responseUrl: body.responseUrl ?? null } : {}),
        ...(body.responseVersion !== undefined ? { responseVersion: body.responseVersion ?? null } : {}),
        ...(body.participantReaction !== undefined
          ? { participantReaction: body.participantReaction ?? null }
          : {}),
        ...(body.keyParticipantQuote !== undefined
          ? { keyParticipantQuote: body.keyParticipantQuote ?? null }
          : {}),
        ...(body.quoteIncluded !== undefined ? { quoteIncluded: body.quoteIncluded } : {}),
        ...(body.nextStepIncluded !== undefined ? { nextStepIncluded: body.nextStepIncluded } : {}),
        ...(body.influencerType !== undefined ? { influencerType: body.influencerType ?? null } : {}),
        ...(body.outOfScopeCategory !== undefined
          ? { outOfScopeCategory: body.outOfScopeCategory ?? null }
          : {}),
        ...(body.sensitiveTopicCategory !== undefined
          ? { sensitiveTopicCategory: body.sensitiveTopicCategory ?? null }
          : {}),
        ...(body.misuseType !== undefined ? { misuseType: body.misuseType ?? null } : {}),
        ...(body.followUpAnswers !== undefined
          ? { followUpAnswers: (body.followUpAnswers as unknown as object) ?? null }
          : {}),
        ...(body.toneDescription !== undefined ? { toneDescription: body.toneDescription ?? null } : {}),
        ...(body.observerNotes !== undefined ? { observerNotes: body.observerNotes ?? null } : {}),
        ...(body.moderatorNotes !== undefined ? { moderatorNotes: body.moderatorNotes ?? null } : {}),
        ...(body.overallReadiness !== undefined
          ? { overallReadiness: body.overallReadiness ?? null }
          : {}),
        ...(body.completed ? { completedAt: new Date() } : {}),
      },
    })
    return NextResponse.json({ promptEval })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    await prisma.contentTestPromptEval.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}

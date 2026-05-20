import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import { createPromptEvalSchema } from '@/lib/content-testing/schemas'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const body = createPromptEvalSchema.parse(await req.json())

    // Determine next promptNumber for activity if not provided
    let promptNumber = body.promptNumber
    if (!promptNumber) {
      const last = await prisma.contentTestPromptEval.findFirst({
        where: { sessionId: params.id, activitySlug: body.activitySlug },
        orderBy: { promptNumber: 'desc' },
        select: { promptNumber: true },
      })
      promptNumber = (last?.promptNumber ?? 0) + 1
    }

    const promptEval = await prisma.contentTestPromptEval.create({
      data: {
        sessionId: params.id,
        activitySlug: body.activitySlug,
        promptNumber,
        promptText: body.promptText,
        promptSource: body.promptSource ?? 'PARTICIPANT',
        useCaseCategory: body.useCaseCategory,
        topicArea: body.topicArea ?? null,
        responseSummary: body.responseSummary ?? null,
        fullResponse: body.fullResponse ?? null,
      },
    })
    return NextResponse.json({ promptEval })
  } catch (err) {
    return handleApiError(err)
  }
}

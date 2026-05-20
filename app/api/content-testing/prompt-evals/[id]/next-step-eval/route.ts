import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import { nextStepEvalSchema } from '@/lib/content-testing/schemas'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const body = nextStepEvalSchema.parse(await req.json())
    const nextStepEvaluation = await prisma.contentTestNextStepEval.upsert({
      where: { promptEvalId: params.id },
      create: {
        promptEvalId: params.id,
        nextStepNeeded: body.nextStepNeeded ?? true,
        nextStepProvided: body.nextStepProvided ?? false,
        nextStepType: body.nextStepType ?? null,
        clarity: body.clarity ?? null,
        appropriateness: body.appropriateness ?? null,
        overRecruiterReliance: body.overRecruiterReliance ?? false,
        suggestion: body.suggestion ?? null,
        notes: body.notes ?? null,
      },
      update: {
        nextStepNeeded: body.nextStepNeeded ?? true,
        nextStepProvided: body.nextStepProvided ?? false,
        nextStepType: body.nextStepType ?? null,
        clarity: body.clarity ?? null,
        appropriateness: body.appropriateness ?? null,
        overRecruiterReliance: body.overRecruiterReliance ?? false,
        suggestion: body.suggestion ?? null,
        notes: body.notes ?? null,
      },
    })
    return NextResponse.json({ nextStepEvaluation })
  } catch (err) {
    return handleApiError(err)
  }
}

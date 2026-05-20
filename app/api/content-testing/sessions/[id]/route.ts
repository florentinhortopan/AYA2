import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import { updateSessionSchema } from '@/lib/content-testing/schemas'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const session = await prisma.contentTestSession.findUnique({
      where: { id: params.id },
      include: {
        round: { select: { id: true, name: true, status: true } },
        moderator: { select: { id: true, name: true, email: true } },
        promptEvaluations: {
          orderBy: [{ activitySlug: 'asc' }, { promptNumber: 'asc' }],
          include: {
            scores: true,
            issues: true,
            quoteEvaluation: true,
            nextStepEvaluation: true,
          },
        },
        warmupAnswers: true,
        summary: true,
        issues: true,
      },
    })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ session })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const body = updateSessionSchema.parse(await req.json())
    const session = await prisma.contentTestSession.update({
      where: { id: params.id },
      data: {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.status === 'IN_PROGRESS' ? { startedAt: new Date() } : {}),
        ...(body.consentConfirmed !== undefined ? { consentConfirmed: body.consentConfirmed } : {}),
        ...(body.recordingPermission !== undefined
          ? { recordingPermission: body.recordingPermission }
          : {}),
        ...(body.activityProgress !== undefined ? { activityProgress: body.activityProgress as any } : {}),
        ...(body.participantNotes !== undefined ? { participantNotes: body.participantNotes ?? null } : {}),
        ...(body.sessionObjective !== undefined ? { sessionObjective: body.sessionObjective ?? null } : {}),
        ...(body.knownLimitations !== undefined ? { knownLimitations: body.knownLimitations ?? null } : {}),
        ...(body.accessibilityNotes !== undefined
          ? { accessibilityNotes: body.accessibilityNotes ?? null }
          : {}),
        ...(body.observerIds !== undefined ? { observerIds: body.observerIds } : {}),
        ...(body.participantType !== undefined ? { participantType: body.participantType } : {}),
        ...(body.environment !== undefined ? { environment: body.environment } : {}),
      },
    })
    return NextResponse.json({ session })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    await prisma.contentTestSession.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}

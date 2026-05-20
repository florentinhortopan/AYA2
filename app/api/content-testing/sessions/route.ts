import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import { createSessionSchema } from '@/lib/content-testing/schemas'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAuthed()
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const roundId = url.searchParams.get('roundId')
    const participantType = url.searchParams.get('participantType')
    const where: Prisma.ContentTestSessionWhereInput = {}
    if (status) where.status = status as Prisma.ContentTestSessionWhereInput['status']
    if (roundId) where.roundId = roundId
    if (participantType) where.participantType = participantType as Prisma.ContentTestSessionWhereInput['participantType']

    const sessions = await prisma.contentTestSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        round: { select: { id: true, name: true, status: true } },
        moderator: { select: { id: true, name: true, email: true } },
        _count: { select: { promptEvaluations: true, issues: true } },
      },
    })
    return NextResponse.json({ sessions })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthed()
    const body = createSessionSchema.parse(await req.json())
    const session = await prisma.contentTestSession.create({
      data: {
        roundId: body.roundId ?? null,
        moderatorId: auth.userId,
        observerIds: body.observerIds ?? [],
        participantId: body.participantId,
        participantType: body.participantType ?? 'INTERNAL_TESTER',
        participantNotes: body.participantNotes ?? null,
        environment: body.environment ?? 'STAGING',
        recordingPermission: body.recordingPermission ?? false,
        consentConfirmed: body.consentConfirmed ?? false,
        sessionObjective: body.sessionObjective ?? null,
        knownLimitations: body.knownLimitations ?? null,
        accessibilityNotes: body.accessibilityNotes ?? null,
        status: 'DRAFT',
      },
    })
    return NextResponse.json({ session })
  } catch (err) {
    return handleApiError(err)
  }
}

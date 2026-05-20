import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import { createRoundSchema } from '@/lib/content-testing/schemas'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAuthed()
    const rounds = await prisma.contentTestRound.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { sessions: true } },
      },
    })
    return NextResponse.json({ rounds })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthed()
    const body = createRoundSchema.parse(await req.json())
    const round = await prisma.contentTestRound.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        status: body.status ?? 'PLANNED',
        defaultEnvironment: body.defaultEnvironment ?? 'STAGING',
        ownerId: auth.userId,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      },
    })
    return NextResponse.json({ round })
  } catch (err) {
    return handleApiError(err)
  }
}

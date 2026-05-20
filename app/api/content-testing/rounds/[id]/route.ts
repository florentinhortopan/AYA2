import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import { updateRoundSchema } from '@/lib/content-testing/schemas'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const round = await prisma.contentTestRound.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        sessions: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!round) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ round })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const body = updateRoundSchema.parse(await req.json())
    const round = await prisma.contentTestRound.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description ?? null } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.defaultEnvironment !== undefined ? { defaultEnvironment: body.defaultEnvironment } : {}),
        ...(body.startsAt !== undefined
          ? { startsAt: body.startsAt ? new Date(body.startsAt) : null }
          : {}),
        ...(body.endsAt !== undefined
          ? { endsAt: body.endsAt ? new Date(body.endsAt) : null }
          : {}),
      },
    })
    return NextResponse.json({ round })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    await prisma.contentTestRound.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}

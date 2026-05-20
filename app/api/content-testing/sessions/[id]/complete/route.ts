import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const session = await prisma.contentTestSession.update({
      where: { id: params.id },
      data: { status: 'COMPLETE', completedAt: new Date() },
    })
    return NextResponse.json({ session })
  } catch (err) {
    return handleApiError(err)
  }
}

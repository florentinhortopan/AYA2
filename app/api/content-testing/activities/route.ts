import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthed, handleApiError } from '@/lib/content-testing/authz'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await getAuthed()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [activities, criteria] = await Promise.all([
      prisma.contentTestActivity.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          promptBank: {
            where: { isArchived: false },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.contentTestCriterion.findMany({ orderBy: { order: 'asc' } }),
    ])
    return NextResponse.json({ activities, criteria })
  } catch (err) {
    return handleApiError(err)
  }
}

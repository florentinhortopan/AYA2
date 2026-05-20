import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAuthed()
    const url = new URL(req.url)
    const severity = url.searchParams.get('severity')
    const status = url.searchParams.get('status')
    const issueType = url.searchParams.get('issueType')
    const owner = url.searchParams.get('owner')
    const requiresSme = url.searchParams.get('requiresSme')
    const where: Prisma.ContentTestIssueWhereInput = {}
    if (severity) where.severity = severity as Prisma.ContentTestIssueWhereInput['severity']
    if (status) where.status = status as Prisma.ContentTestIssueWhereInput['status']
    if (issueType) where.issueType = issueType as Prisma.ContentTestIssueWhereInput['issueType']
    if (owner) where.owner = owner
    if (requiresSme === 'true') where.requiresSme = true

    const issues = await prisma.contentTestIssue.findMany({
      where,
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      include: {
        session: {
          select: { id: true, participantId: true, participantType: true, round: { select: { name: true } } },
        },
        promptEval: {
          select: {
            id: true,
            promptText: true,
            topicArea: true,
            activitySlug: true,
            useCaseCategory: true,
          },
        },
      },
    })
    return NextResponse.json({ issues })
  } catch (err) {
    return handleApiError(err)
  }
}

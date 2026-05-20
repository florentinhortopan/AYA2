import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import { createIssueSchema } from '@/lib/content-testing/schemas'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const issues = await prisma.contentTestIssue.findMany({
      where: { promptEvalId: params.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ issues })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const body = createIssueSchema.parse(await req.json())
    const promptEval = await prisma.contentTestPromptEval.findUnique({
      where: { id: params.id },
      select: { sessionId: true },
    })
    if (!promptEval) return NextResponse.json({ error: 'Prompt eval not found' }, { status: 404 })
    const issue = await prisma.contentTestIssue.create({
      data: {
        sessionId: promptEval.sessionId,
        promptEvalId: params.id,
        issueType: body.issueType,
        severity: body.severity ?? 'MEDIUM',
        description: body.description,
        evidenceResponse: body.evidenceResponse ?? null,
        evidenceParticipant: body.evidenceParticipant ?? null,
        recommendedAction: body.recommendedAction ?? 'EDIT',
        suggestedRevision: body.suggestedRevision ?? null,
        owner: body.owner ?? null,
        priority: body.priority ?? 'PHASE_1',
        status: body.status ?? 'OPEN',
        requiresSme: body.requiresSme ?? false,
        requiresOfficialSource: body.requiresOfficialSource ?? false,
        requiresRecruiterReferral: body.requiresRecruiterReferral ?? false,
      },
    })
    return NextResponse.json({ issue })
  } catch (err) {
    return handleApiError(err)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import { updateIssueSchema } from '@/lib/content-testing/schemas'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const body = updateIssueSchema.parse(await req.json())
    const issue = await prisma.contentTestIssue.update({
      where: { id: params.id },
      data: {
        ...(body.issueType !== undefined ? { issueType: body.issueType } : {}),
        ...(body.severity !== undefined ? { severity: body.severity } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.evidenceResponse !== undefined ? { evidenceResponse: body.evidenceResponse ?? null } : {}),
        ...(body.evidenceParticipant !== undefined
          ? { evidenceParticipant: body.evidenceParticipant ?? null }
          : {}),
        ...(body.recommendedAction !== undefined ? { recommendedAction: body.recommendedAction } : {}),
        ...(body.suggestedRevision !== undefined ? { suggestedRevision: body.suggestedRevision ?? null } : {}),
        ...(body.owner !== undefined ? { owner: body.owner ?? null } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.requiresSme !== undefined ? { requiresSme: body.requiresSme } : {}),
        ...(body.requiresOfficialSource !== undefined
          ? { requiresOfficialSource: body.requiresOfficialSource }
          : {}),
        ...(body.requiresRecruiterReferral !== undefined
          ? { requiresRecruiterReferral: body.requiresRecruiterReferral }
          : {}),
      },
    })
    return NextResponse.json({ issue })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    await prisma.contentTestIssue.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}

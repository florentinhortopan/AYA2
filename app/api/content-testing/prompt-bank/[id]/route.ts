import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin, handleApiError } from '@/lib/content-testing/authz'
import { updatePromptBankItemSchema } from '@/lib/content-testing/schemas'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const body = updatePromptBankItemSchema.parse(await req.json())
    const item = await prisma.contentTestPromptBankItem.update({
      where: { id: params.id },
      data: {
        ...(body.activitySlug !== undefined ? { activitySlug: body.activitySlug } : {}),
        ...(body.promptText !== undefined ? { promptText: body.promptText } : {}),
        ...(body.topicArea !== undefined ? { topicArea: body.topicArea ?? null } : {}),
        ...(body.notes !== undefined ? { notes: body.notes ?? null } : {}),
        ...(body.isArchived !== undefined ? { isArchived: body.isArchived } : {}),
      },
    })
    return NextResponse.json({ item })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    await prisma.contentTestPromptBankItem.update({
      where: { id: params.id },
      data: { isArchived: true },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}

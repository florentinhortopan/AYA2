import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  requireAuthed,
  requireAdmin,
  handleApiError,
} from '@/lib/content-testing/authz'
import { promptBankItemSchema } from '@/lib/content-testing/schemas'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAuthed()
    const url = new URL(req.url)
    const activitySlug = url.searchParams.get('activitySlug')
    const items = await prisma.contentTestPromptBankItem.findMany({
      where: {
        isArchived: false,
        ...(activitySlug ? { activitySlug } : {}),
      },
      orderBy: [{ activitySlug: 'asc' }, { createdAt: 'asc' }],
    })
    return NextResponse.json({ items })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = promptBankItemSchema.parse(await req.json())
    const item = await prisma.contentTestPromptBankItem.create({
      data: {
        activitySlug: body.activitySlug,
        promptText: body.promptText,
        topicArea: body.topicArea ?? null,
        notes: body.notes ?? null,
        isArchived: body.isArchived ?? false,
      },
    })
    return NextResponse.json({ item })
  } catch (err) {
    return handleApiError(err)
  }
}

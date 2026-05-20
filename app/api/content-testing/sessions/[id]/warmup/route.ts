import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import { warmupSchema } from '@/lib/content-testing/schemas'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const body = warmupSchema.parse(await req.json())
    const results = await Promise.all(
      body.answers.map((a) =>
        prisma.contentTestWarmupAnswer.upsert({
          where: {
            sessionId_questionKey: { sessionId: params.id, questionKey: a.questionKey },
          },
          create: {
            sessionId: params.id,
            questionKey: a.questionKey,
            answer: a.answer ?? null,
            keyQuote: a.keyQuote ?? null,
            themeTags: a.themeTags ?? [],
            notes: a.notes ?? null,
          },
          update: {
            answer: a.answer ?? null,
            keyQuote: a.keyQuote ?? null,
            themeTags: a.themeTags ?? [],
            notes: a.notes ?? null,
          },
        })
      )
    )
    return NextResponse.json({ warmupAnswers: results })
  } catch (err) {
    return handleApiError(err)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import { scoresUpsertSchema } from '@/lib/content-testing/schemas'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const body = scoresUpsertSchema.parse(await req.json())
    const results = await Promise.all(
      body.scores.map(async (s) => {
        if (s.value == null) {
          // Null = remove score
          await prisma.contentTestScore
            .delete({
              where: {
                promptEvalId_criterionKey: {
                  promptEvalId: params.id,
                  criterionKey: s.criterionKey,
                },
              },
            })
            .catch(() => null)
          return null
        }
        return prisma.contentTestScore.upsert({
          where: {
            promptEvalId_criterionKey: {
              promptEvalId: params.id,
              criterionKey: s.criterionKey,
            },
          },
          create: {
            promptEvalId: params.id,
            criterionKey: s.criterionKey,
            value: s.value,
            notes: s.notes ?? null,
          },
          update: {
            value: s.value,
            notes: s.notes ?? null,
          },
        })
      })
    )
    return NextResponse.json({ scores: results.filter(Boolean) })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const scores = await prisma.contentTestScore.findMany({
      where: { promptEvalId: params.id },
    })
    return NextResponse.json({ scores })
  } catch (err) {
    return handleApiError(err)
  }
}

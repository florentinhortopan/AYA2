import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(request: NextRequest, { params }: { params: { questionId: string } }) {
  const body = await request.json()
  const { questionText, tone, persona, status, ratingValue } = body || {}

  const question = await prisma.qaQuestion.update({
    where: { id: params.questionId },
    data: {
      questionText,
      tone,
      persona,
      status,
      ratingValue,
      ratingUpdatedAt: ratingValue ? new Date() : undefined,
    }
  })

  return NextResponse.json({ question })
}

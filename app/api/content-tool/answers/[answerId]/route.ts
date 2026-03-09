import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(request: NextRequest, { params }: { params: { answerId: string } }) {
  const body = await request.json()
  const { answerText, validationStatus, ratingValue, sourceLink } = body || {}

  const answer = await prisma.qaAnswer.update({
    where: { id: params.answerId },
    data: {
      answerText,
      validationStatus,
      ratingValue,
      sourceLink,
      characterCount: answerText !== undefined ? answerText.length : undefined,
      ratingUpdatedAt: ratingValue ? new Date() : undefined,
    }
  })

  return NextResponse.json({ answer })
}

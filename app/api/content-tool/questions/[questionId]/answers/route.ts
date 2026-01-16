import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: { questionId: string } }) {
  const answers = await prisma.qaAnswer.findMany({
    where: { questionId: params.questionId },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ answers })
}

export async function POST(request: NextRequest, { params }: { params: { questionId: string } }) {
  const body = await request.json()
  const {
    variantLevel,
    answerText,
    sourceLink,
    keywords = [],
    ratingDefault = 3
  } = body || {}

  if (!variantLevel || !answerText) {
    return NextResponse.json({ error: 'variantLevel and answerText are required' }, { status: 400 })
  }

  const answer = await prisma.qaAnswer.create({
    data: {
      questionId: params.questionId,
      variantLevel,
      answerText,
      sourceLink,
      keywords,
      characterCount: answerText.length,
      ratingDefault,
      ratingValue: ratingDefault,
    }
  })

  return NextResponse.json({ answer })
}

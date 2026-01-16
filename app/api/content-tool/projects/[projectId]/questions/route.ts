import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: { projectId: string } }) {
  const questions = await prisma.qaQuestion.findMany({
    where: { projectId: params.projectId },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ questions })
}

export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
  const body = await request.json()
  const {
    topic,
    persona,
    tone,
    questionText,
    sourceUrls = [],
    ratingDefault = 3
  } = body || {}

  if (!topic || !questionText) {
    return NextResponse.json({ error: 'topic and questionText are required' }, { status: 400 })
  }

  const question = await prisma.qaQuestion.create({
    data: {
      projectId: params.projectId,
      topic,
      persona,
      tone,
      questionText,
      sourceUrls,
      ratingDefault,
      ratingValue: ratingDefault,
    }
  })

  return NextResponse.json({ question })
}

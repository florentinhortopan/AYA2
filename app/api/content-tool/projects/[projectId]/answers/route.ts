import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: { projectId: string } }) {
  const answers = await prisma.qaAnswer.findMany({
    where: {
      question: { projectId: params.projectId }
    },
    include: {
      question: { select: { questionText: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ answers })
}

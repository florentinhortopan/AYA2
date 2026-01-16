import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: { projectId: string } }) {
  const project = await prisma.qaProject.findUnique({
    where: { id: params.projectId },
    include: {
      _count: { select: { questions: true } }
    }
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      targetQuestionCount: project.targetQuestionCount,
      questionCount: project._count.questions,
      promptIds: {
        questionPromptId: project.questionPromptId || undefined,
        answerPromptId: project.answerPromptId || undefined,
        guidelineId: project.guidelineId || undefined,
      }
    }
  })
}

export async function PUT(request: NextRequest, { params }: { params: { projectId: string } }) {
  const body = await request.json()
  const { status, description, questionPromptId, answerPromptId, guidelineId } = body || {}

  const project = await prisma.qaProject.update({
    where: { id: params.projectId },
    data: {
      status,
      description,
      questionPromptId,
      answerPromptId,
      guidelineId,
    }
  })

  return NextResponse.json({ project })
}

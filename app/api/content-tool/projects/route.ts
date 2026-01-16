import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const projects = await prisma.qaProject.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          questions: true,
        }
      }
    }
  })

  const projectsWithAnswers = await Promise.all(
    projects.map(async (project) => {
      const answerCount = await prisma.qaAnswer.count({
        where: { question: { projectId: project.id } }
      })

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        targetQuestionCount: project.targetQuestionCount,
        questionCount: project._count.questions,
        answerCount,
        promptIds: {
          questionPromptId: project.questionPromptId || undefined,
          answerPromptId: project.answerPromptId || undefined,
          guidelineId: project.guidelineId || undefined,
        }
      }
    })
  )

  return NextResponse.json({ projects: projectsWithAnswers })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    name,
    description,
    targetQuestionCount = 250,
    questionPromptId,
    answerPromptId,
    guidelineId,
    ratingDefault = 3,
  } = body || {}

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const project = await prisma.qaProject.create({
    data: {
      name,
      description,
      targetQuestionCount,
      questionPromptId,
      answerPromptId,
      guidelineId,
    }
  })

  return NextResponse.json({ project, ratingDefault })
}

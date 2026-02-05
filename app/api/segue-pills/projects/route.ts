import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all QA projects with question counts
    const projects = await prisma.qaProject.findMany({
      where: {
        status: {
          in: ['in_progress', 'review', 'published']
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        targetQuestionCount: true,
        _count: {
          select: {
            questions: true
          }
        },
        corpusFile: {
          select: {
            name: true,
            sourceUrls: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    const formattedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      questionCount: project._count.questions,
      targetCount: project.targetQuestionCount,
      corpus: project.corpusFile ? {
        name: project.corpusFile.name,
        sourceUrls: project.corpusFile.sourceUrls
      } : null
    }))

    return NextResponse.json({
      success: true,
      projects: formattedProjects
    })

  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

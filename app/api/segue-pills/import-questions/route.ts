import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import type { SyntheticQuestion } from '@/lib/segue-pills/question-generator'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Fetch questions from the project
    const questions = await prisma.qaQuestion.findMany({
      where: {
        projectId,
        status: {
          in: ['approved', 'published']
        }
      },
      select: {
        id: true,
        questionText: true,
        topic: true,
        persona: true,
        sourceUrls: true,
        createdAt: true
      }
    })

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No approved questions found in this project' },
        { status: 404 }
      )
    }

    // Convert QaQuestion to SyntheticQuestion format
    const syntheticQuestions: SyntheticQuestion[] = questions.map((q, index) => ({
      id: `imported_${q.id}`,
      question: q.questionText,
      intent: q.topic || 'general',
      persona: q.persona || 'general',
      context: `Imported from project. Sources: ${q.sourceUrls.slice(0, 2).join(', ')}`,
      confidence: 1.0 // High confidence since these are validated questions
    }))

    return NextResponse.json({
      success: true,
      questions: syntheticQuestions,
      count: syntheticQuestions.length,
      projectId
    })

  } catch (error) {
    console.error('Error importing questions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to import questions'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

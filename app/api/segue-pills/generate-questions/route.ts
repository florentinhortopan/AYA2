import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { generateSyntheticQuestionsBatch } from '@/lib/segue-pills/question-generator'

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
    const { personas, topics, count = 100, campaignContext } = body

    if (!personas || !Array.isArray(personas) || personas.length === 0) {
      return NextResponse.json(
        { error: 'Personas array is required' },
        { status: 400 }
      )
    }

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json(
        { error: 'Topics array is required' },
        { status: 400 }
      )
    }

    if (count < 10 || count > 500) {
      return NextResponse.json(
        { error: 'Count must be between 10 and 500' },
        { status: 400 }
      )
    }

    // Generate synthetic questions
    const questions = await generateSyntheticQuestionsBatch({
      personas,
      topics,
      count,
      campaignContext
    })

    return NextResponse.json({
      success: true,
      questions,
      count: questions.length
    })

  } catch (error) {
    console.error('Error in generate-questions API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate questions'
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    )
  }
}

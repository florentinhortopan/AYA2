import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { clusterQuestionsIntoIntents } from '@/lib/segue-pills/intent-clusterer'
import type { SyntheticQuestion } from '@/lib/segue-pills/question-generator'

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
    const { questions, campaignGoal } = body

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Questions array is required' },
        { status: 400 }
      )
    }

    // Cluster questions into intents (with optional campaign goal context)
    const clusters = await clusterQuestionsIntoIntents(
      questions as SyntheticQuestion[],
      campaignGoal
    )

    return NextResponse.json({
      success: true,
      clusters,
      count: clusters.length
    })

  } catch (error) {
    console.error('Error in cluster-intents API:', error)
    return NextResponse.json(
      { error: 'Failed to cluster questions' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { clusterQuestionsIntoIntents } from '@/lib/segue-pills/intent-clusterer'
import { validateIntentsAgainstAnswers } from '@/lib/segue-pills/answer-validator'
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
    const { questions, campaignGoal, qaProjectId } = body

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

    // Validate clusters against available answers in the linked Q&A project
    const { validClusters, invalidClusters } = await validateIntentsAgainstAnswers(
      clusters,
      qaProjectId,
      ['approved', 'published', 'valid', 'pending'], // Include more statuses for validation
      ['approved', 'published', 'valid', 'pending']
    )

    // Log validation results
    if (invalidClusters.length > 0) {
      console.log(`[Cluster Intents] Filtered out ${invalidClusters.length} intents without matching answers:`)
      invalidClusters.forEach(c => console.log(`  - ${c.intent}`))
    }

    // Use only validated clusters (those with matching answers)
    const finalClusters = validClusters.length > 0 ? validClusters : clusters

    return NextResponse.json({
      success: true,
      clusters: finalClusters,
      count: finalClusters.length,
      validation: {
        total: clusters.length,
        valid: validClusters.length,
        invalid: invalidClusters.length,
        invalidIntents: invalidClusters.map(c => c.intent)
      }
    })

  } catch (error) {
    console.error('Error in cluster-intents API:', error)
    return NextResponse.json(
      { error: 'Failed to cluster questions' },
      { status: 500 }
    )
  }
}

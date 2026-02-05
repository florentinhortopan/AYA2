import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { generatePillRecommendations } from '@/lib/segue-pills/pill-recommender'
import type { IntentCluster } from '@/lib/segue-pills/intent-clusterer'

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
    const { intentClusters, campaignGoal, testSessions } = body

    if (!intentClusters || !Array.isArray(intentClusters) || intentClusters.length === 0) {
      return NextResponse.json(
        { error: 'Intent clusters array is required' },
        { status: 400 }
      )
    }

    // Generate pill recommendations
    const recommendations = generatePillRecommendations({
      intentClusters: intentClusters as IntentCluster[],
      campaignGoal,
      testSessions: testSessions || []
    })

    return NextResponse.json({
      success: true,
      recommendations
    })

  } catch (error) {
    console.error('Error in recommendations API:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

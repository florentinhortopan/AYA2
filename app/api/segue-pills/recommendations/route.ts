import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { generatePillRecommendations } from '@/lib/segue-pills/pill-recommender'
import { validatePillLabel } from '@/lib/segue-pills/answer-validator'
import type { IntentCluster } from '@/lib/segue-pills/intent-clusterer'
import type { PillLabel } from '@/lib/segue-pills/pill-recommender'

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
    const { intentClusters, campaignGoal, testSessions, qaProjectId } = body

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

    // Validate pills against available answers if Q&A project is linked
    if (qaProjectId) {
      console.log(`[Recommendations] Validating pills against Q&A project: ${qaProjectId}`)
      
      // Validate all pills in the library
      const validatedPillLibrary: PillLabel[] = []
      for (const pill of recommendations.pillLibrary) {
        const isValid = await validatePillLabel(
          pill.label,
          qaProjectId,
          ['approved', 'published', 'valid', 'pending'],
          ['approved', 'published', 'valid', 'pending']
        )
        
        if (isValid) {
          validatedPillLibrary.push(pill)
        } else {
          console.warn(`[Recommendations] Filtered out pill "${pill.label}" - no matching answers found`)
        }
      }

      // Update recommendations with validated pills
      recommendations.pillLibrary = validatedPillLibrary

      // Filter case recommendations - but be lenient: if validation fails, keep original pills
      const filterPills = (pills: PillLabel[], caseName: string) => {
        const filtered = pills.filter(p => validatedPillLibrary.some(vp => vp.id === p.id))
        // If validation filtered out all pills, keep original (fail open)
        if (filtered.length === 0 && pills.length > 0) {
          console.warn(`[Recommendations POST] Validation filtered out all pills for ${caseName}, keeping original ${pills.length} pills`)
          return pills
        }
        console.log(`[Recommendations POST] ${caseName}: ${filtered.length}/${pills.length} pills validated`)
        return filtered
      }

      recommendations.case1.pills = filterPills(recommendations.case1.pills, 'case1')
      recommendations.case2.pills = filterPills(recommendations.case2.pills, 'case2')
      recommendations.case3.pills = filterPills(recommendations.case3.pills, 'case3')

      console.log(`[Recommendations POST] Validated pills: ${validatedPillLibrary.length}/${recommendations.pillLibrary.length} valid`)
    }

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

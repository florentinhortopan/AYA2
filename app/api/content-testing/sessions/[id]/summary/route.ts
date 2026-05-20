import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import { summarySchema } from '@/lib/content-testing/schemas'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const body = summarySchema.parse(await req.json())
    const summary = await prisma.contentTestSummary.upsert({
      where: { sessionId: params.id },
      create: {
        sessionId: params.id,
        overallHelpfulness: body.overallHelpfulness ?? null,
        strongestContentMoment: body.strongestContentMoment ?? null,
        weakestContentMoment: body.weakestContentMoment ?? null,
        mostConcerningResponse: body.mostConcerningResponse ?? null,
        mostAuthenticResponse: body.mostAuthenticResponse ?? null,
        mostObviousContentGap: body.mostObviousContentGap ?? null,
        repeatedTheme: body.repeatedTheme ?? null,
        riskyResponse: body.riskyResponse ?? null,
        marketingSpeakExamples: body.marketingSpeakExamples ?? null,
        expectedTopics: body.expectedTopics ?? null,
        contentGaps: body.contentGaps ?? null,
        prospectImprovementIdeas: body.prospectImprovementIdeas ?? null,
        influencerImprovementIdeas: body.influencerImprovementIdeas ?? null,
        topImprovement: body.topImprovement ?? null,
        otherComments: body.otherComments ?? null,
        participantTrustLevel: body.participantTrustLevel ?? null,
        participantPerceivedHelpfulness: body.participantPerceivedHelpfulness ?? null,
        overallContentReadiness: body.overallContentReadiness ?? null,
        topRecommendations: body.topRecommendations
          ? (body.topRecommendations as unknown as object)
          : undefined,
        additionalNotes: body.additionalNotes ?? null,
      },
      update: {
        overallHelpfulness: body.overallHelpfulness ?? null,
        strongestContentMoment: body.strongestContentMoment ?? null,
        weakestContentMoment: body.weakestContentMoment ?? null,
        mostConcerningResponse: body.mostConcerningResponse ?? null,
        mostAuthenticResponse: body.mostAuthenticResponse ?? null,
        mostObviousContentGap: body.mostObviousContentGap ?? null,
        repeatedTheme: body.repeatedTheme ?? null,
        riskyResponse: body.riskyResponse ?? null,
        marketingSpeakExamples: body.marketingSpeakExamples ?? null,
        expectedTopics: body.expectedTopics ?? null,
        contentGaps: body.contentGaps ?? null,
        prospectImprovementIdeas: body.prospectImprovementIdeas ?? null,
        influencerImprovementIdeas: body.influencerImprovementIdeas ?? null,
        topImprovement: body.topImprovement ?? null,
        otherComments: body.otherComments ?? null,
        participantTrustLevel: body.participantTrustLevel ?? null,
        participantPerceivedHelpfulness: body.participantPerceivedHelpfulness ?? null,
        overallContentReadiness: body.overallContentReadiness ?? null,
        topRecommendations: body.topRecommendations
          ? (body.topRecommendations as unknown as object)
          : undefined,
        additionalNotes: body.additionalNotes ?? null,
      },
    })
    return NextResponse.json({ summary })
  } catch (err) {
    return handleApiError(err)
  }
}

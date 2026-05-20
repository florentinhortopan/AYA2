import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import { quoteEvalSchema } from '@/lib/content-testing/schemas'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthed()
    const body = quoteEvalSchema.parse(await req.json())
    const quoteEvaluation = await prisma.contentTestQuoteEval.upsert({
      where: { promptEvalId: params.id },
      create: {
        promptEvalId: params.id,
        quoteText: body.quoteText ?? null,
        quoteSource: body.quoteSource ?? null,
        quoteType: body.quoteType ?? null,
        authenticity: body.authenticity ?? null,
        value: body.value ?? null,
        brandSafety: body.brandSafety ?? null,
        contextSufficient: body.contextSufficient ?? null,
        marketingSpeak: body.marketingSpeak ?? false,
        preservesSoldierVoice: body.preservesSoldierVoice ?? null,
        sensitiveInfo: body.sensitiveInfo ?? null,
        actionRecommendation: body.actionRecommendation ?? 'KEEP',
        suggestedEdit: body.suggestedEdit ?? null,
        needsSmeReview: body.needsSmeReview ?? false,
        notes: body.notes ?? null,
      },
      update: {
        quoteText: body.quoteText ?? null,
        quoteSource: body.quoteSource ?? null,
        quoteType: body.quoteType ?? null,
        authenticity: body.authenticity ?? null,
        value: body.value ?? null,
        brandSafety: body.brandSafety ?? null,
        contextSufficient: body.contextSufficient ?? null,
        marketingSpeak: body.marketingSpeak ?? false,
        preservesSoldierVoice: body.preservesSoldierVoice ?? null,
        sensitiveInfo: body.sensitiveInfo ?? null,
        actionRecommendation: body.actionRecommendation ?? 'KEEP',
        suggestedEdit: body.suggestedEdit ?? null,
        needsSmeReview: body.needsSmeReview ?? false,
        notes: body.notes ?? null,
      },
    })
    return NextResponse.json({ quoteEvaluation })
  } catch (err) {
    return handleApiError(err)
  }
}

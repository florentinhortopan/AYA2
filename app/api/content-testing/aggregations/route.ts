import { NextRequest, NextResponse } from 'next/server'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import { buildAggregations } from '@/lib/content-testing/aggregations'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAuthed()
    const url = new URL(req.url)
    const filters = {
      roundId: url.searchParams.get('roundId'),
      participantType: url.searchParams.get('participantType'),
      topicArea: url.searchParams.get('topicArea'),
    }
    const data = await buildAggregations(filters)
    return NextResponse.json(data)
  } catch (err) {
    return handleApiError(err)
  }
}

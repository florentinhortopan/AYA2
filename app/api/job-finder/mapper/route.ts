import { NextRequest, NextResponse } from 'next/server'
import { loadJobFinderComponentRegistry } from '@/lib/job-finder/component-registry'
import { mapPageBlocksToComponents } from '@/lib/job-finder/component-mapper'
import { loadScrapedJobsPayload } from '@/lib/job-finder/scraped-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const payload = await loadScrapedJobsPayload()
  if (!payload) {
    return NextResponse.json({ error: 'Scraped dataset is not available.' }, { status: 404 })
  }

  const registry = await loadJobFinderComponentRegistry()
  const pageIndexRaw = request.nextUrl.searchParams.get('pageIndex')
  const pageIndex = pageIndexRaw ? Number(pageIndexRaw) : 0
  const targetPage = payload.pages[Math.max(0, Math.min(pageIndex, payload.pages.length - 1))]
  const mapped = mapPageBlocksToComponents(targetPage, registry, { maxBlocks: 10 })

  return NextResponse.json({
    generatedAt: payload.generatedAt,
    coverage: payload.coverage || null,
    registry,
    selectedPage: {
      index: pageIndex,
      url: targetPage.url,
      title: targetPage.title,
      matchedLabels: targetPage.matchedLabels,
      blockCount: targetPage.componentBlocks?.length || 0
    },
    mapped
  })
}

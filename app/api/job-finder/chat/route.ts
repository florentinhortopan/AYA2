import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai'
import { loadScrapedJobsPayload, searchScrapedPages } from '@/lib/job-finder/scraped-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const payload = await loadScrapedJobsPayload()
  return NextResponse.json({
    initialMessage:
      "Hello! I'm your job finder assistant. I search across the latest scraped GoArmy jobs content and help you compare options quickly. What type of role are you exploring?",
    scrapedPagesIndexed: payload?.pages.length || 0,
    generatedAt: payload?.generatedAt || null
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { message, history = [] } = body || {}

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  const payload = await loadScrapedJobsPayload()
  if (!payload || payload.pages.length === 0) {
    return NextResponse.json({
      text: 'I could not load the scraped jobs dataset yet. Please refresh crawl data and try again.',
      components: [],
      segues: [],
      metadata: { sourceCount: 0 }
    })
  }

  // Search across all scraped pages, then pass top relevant chunks to the model.
  const relevantPages = await searchScrapedPages(
    [
      ...history
        .slice(-4)
        .filter((h: any) => h?.role === 'user' && typeof h.content === 'string')
        .map((h: any) => h.content),
      message
    ].join(' '),
    8
  )

  const contextBlock = relevantPages
    .map((page, index) =>
      [
        `### Source ${index + 1}: ${page.title}`,
        `URL: ${page.url}`,
        `Matched Labels: ${page.matchedLabels.join(', ') || 'none'}`,
        `Excerpt: ${page.textExcerpt}`
      ].join('\n')
    )
    .join('\n\n')

  const systemPrompt = [
    'You are the AYA Job Finder Assistant.',
    `You are powered by scraped GoArmy jobs content with ${payload.pages.length} indexed pages.`,
    'Answer only with support from provided sources.',
    'Prefer concise, practical recommendations.',
    'When possible, include 2-4 source URLs inline at the end under "Sources:".',
    'If sources are insufficient, say what is missing clearly.',
    '',
    '## Retrieved Sources',
    contextBlock
  ].join('\n')

  const aiMessages = history
    .slice(-10)
    .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  aiMessages.push({ role: 'user', content: message })

  const text = await aiService.generateResponse(aiMessages, { systemPrompt })
  const sources = relevantPages.slice(0, 4).map((page) => page.url)
  const textWithSources =
    sources.length > 0 && !text.toLowerCase().includes('sources:')
      ? `${text}\n\nSources:\n${sources.map((url) => `- ${url}`).join('\n')}`
      : text

  return NextResponse.json({
    text: textWithSources,
    components: [],
    segues: [],
    metadata: {
      sourceCount: payload.pages.length,
      retrievedSourceCount: relevantPages.length,
      generatedAt: payload.generatedAt
    }
  })
}

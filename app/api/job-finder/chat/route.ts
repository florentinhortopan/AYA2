import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai'
import { loadScrapedJobsPayload, searchScrapedPages } from '@/lib/job-finder/scraped-data'
import { jobFinderAgentConfig } from '@/agents/config/job-finder'
import { RichAgentResponse } from '@/types'
import { loadJobFinderComponentRegistry } from '@/lib/job-finder/component-registry'
import { mapPageBlocksToComponents } from '@/lib/job-finder/component-mapper'

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

  const registry = await loadJobFinderComponentRegistry()
  const mappedComponents = relevantPages
    .slice(0, 2)
    .flatMap((page) =>
      mapPageBlocksToComponents(page, registry, { maxBlocks: 6, allowCustom: false }).components
    )
    .filter((component) => component.type !== 'custom')
    .slice(0, 4)

  const systemPrompt = [
    'You are the AYA Job Finder Assistant.',
    `You are powered by scraped GoArmy jobs content with ${payload.pages.length} indexed pages.`,
    'Answer only with support from provided sources.',
    'Prefer concise, practical recommendations.',
    'Always include a "Sources:" section with 2-4 URLs from the retrieved sources.',
    'If sources are insufficient, say what is missing clearly.',
    'Use polished UI components where relevant (table, card, timeline, matrix, list, segue).',
    'When asked to compare jobs, prioritize table/matrix components.',
    'When describing progression, prefer timeline components.',
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

  const rich = await aiService.generateRichResponse(
    aiMessages,
    {
      ...jobFinderAgentConfig,
      systemPrompt
    },
    {
      scrapedContext: {
        sourceCount: payload.pages.length,
        generatedAt: payload.generatedAt
      }
    }
  )

  const sources = relevantPages.slice(0, 4).map((page) => page.url)
  const textWithSources =
    sources.length > 0 && !rich.text.toLowerCase().includes('sources:')
      ? `${rich.text}\n\nSources:\n${sources.map((url) => `- ${url}`).join('\n')}`
      : rich.text

  const fallbackComponents: RichAgentResponse['components'] = [
    {
      type: 'table',
      props: {
        title: 'Top Retrieved Job Pages',
        description: 'Most relevant pages from scraped GoArmy content',
        headers: ['Title', 'Matched Labels', 'Source'],
        rows: relevantPages.slice(0, 4).map((page) => [
          page.title,
          page.matchedLabels.slice(0, 2).join(', ') || 'General',
          page.url
        ])
      }
    } as any,
    {
      type: 'card',
      props: {
        title: 'Source Coverage',
        description: 'Scraped dataset grounding stats',
        content: `Indexed pages: ${payload.pages.length}. Retrieved for this answer: ${relevantPages.length}. Generated: ${payload.generatedAt}.`,
        variant: 'outline'
      }
    } as any
  ]

  const baseComponents = (rich.components && rich.components.length > 0)
    ? [...rich.components]
    : fallbackComponents
  const components = [...baseComponents, ...mappedComponents, ...fallbackComponents.slice(1, 2)]

  return NextResponse.json({
    text: textWithSources,
    components,
    segues: rich.segues || [],
    metadata: {
      ...(rich.metadata || {}),
      sourceCount: payload.pages.length,
      retrievedSourceCount: relevantPages.length,
      generatedAt: payload.generatedAt
    }
  })
}

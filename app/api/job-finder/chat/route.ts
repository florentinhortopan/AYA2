import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai'
import { loadScrapedJobsPayload, searchScrapedPages } from '@/lib/job-finder/scraped-data'
import { jobFinderAgentConfig } from '@/agents/config/job-finder'
import { RichAgentResponse } from '@/types'
import { selectSeguePills } from '@/lib/job-finder/segue-pill-selector'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const RECRUITER_SEGUE_MIN_INTERACTIONS = 3

const isRecruiterSegueLabel = (label: string): boolean => {
  const value = String(label || '').toLowerCase()
  return value.includes('recruiter')
}

const applyRecruiterSeguePolicy = (
  segues: RichAgentResponse['segues'],
  interactionTurns: number
): RichAgentResponse['segues'] => {
  if (!Array.isArray(segues)) return []
  if (interactionTurns >= RECRUITER_SEGUE_MIN_INTERACTIONS) return segues
  return segues.filter((segue: any) => !isRecruiterSegueLabel(String(segue?.props?.label || '')))
}

const cleanSnippetForChat = (value: string) =>
  value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\\r\\n|\\n|\\t/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/data-component="[^"]*"/gi, ' ')
    .replace(/id="[^"]*"/gi, ' ')
    .replace(/class="[^"]*"/gi, ' ')
    .replace(/xdm:linkurl/gi, ' ')
    .replace(/\/content\/dam\/[^\s"']+/gi, ' ')
    .replace(/\{\{|\}\}|\["|\]"|":\s*"/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const sanitizeAssistantText = (value: string) =>
  value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\\r\\n|\\n|\\t/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/xdm:linkurl/gi, ' ')
    .replace(/\/content\/dam\/[^\s"']+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const formatSourceSlugLabel = (url: string, title: string): string => {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/').filter(Boolean)
    const slug = segments[segments.length - 1]
    if (slug) {
      return decodeURIComponent(slug)
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
    }
  } catch {
    // Fallback to title below.
  }
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

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
        `Excerpt: ${cleanSnippetForChat(page.textExcerpt).slice(0, 420)}`
      ].join('\n')
    )
    .join('\n\n')

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
  const cleanTextWithSources = sanitizeAssistantText(
    rich.text.replace(/\n?\s*sources:\s*[\s\S]*$/i, '').trim()
  )
  const sourceLinks = relevantPages.slice(0, 4).map((page) => ({
    title: page.title,
    url: page.url,
    slugLabel: formatSourceSlugLabel(page.url, page.title)
  }))

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
    } as any
  ]

  const baseComponents = (rich.components && rich.components.length > 0)
    ? [...rich.components]
    : fallbackComponents
  const components = [...baseComponents]
  const strategySegues = selectSeguePills({
    message,
    history,
    relevantPages
  })
  const interactionTurns = history.filter((h: any) => h?.role === 'user').length + 1
  const fallbackSegues = applyRecruiterSeguePolicy(rich.segues || [], interactionTurns)
  const segues = strategySegues.length >= 2 ? strategySegues : fallbackSegues

  return NextResponse.json({
    text: cleanTextWithSources,
    components,
    segues,
    metadata: {
      ...(rich.metadata || {}),
      sourceCount: payload.pages.length,
      retrievedSourceCount: relevantPages.length,
      generatedAt: payload.generatedAt,
      sources: sourceLinks
    }
  })
}

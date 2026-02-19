import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/ai'
import { loadScrapedJobsPayload, searchScrapedPages } from '@/lib/job-finder/scraped-data'
import { jobFinderAgentConfig } from '@/agents/config/job-finder'
import { RichAgentResponse } from '@/types'
import { selectSeguePills } from '@/lib/job-finder/segue-pill-selector'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const RECRUITER_SEGUE_MIN_INTERACTIONS = 3
const RECRUITER_REQUEST_TEXT =
  'Hello! 👋 In order to get started, please confirm you are at least 17 years old and interested in joining the Army by providing your full name, email, phone number, zip code, and date of birth.'

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

interface RecruiterProfile {
  fullName?: string
  email?: string
  phone?: string
  zipCode?: string
  dateOfBirth?: string
}

const detectRecruiterFlowIntent = (
  message: string
): 'cancel' | 'continue_intake' | 'exit_to_chat' => {
  const text = String(message || '').trim().toLowerCase()
  if (!text) return 'continue_intake'

  if (/(cancel|stop|exit).*(recruiter|intake)|cancel|never mind|nevermind|not now|later/i.test(text)) {
    return 'cancel'
  }

  const hasEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)
  const hasPhone = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(text)
  const hasZip = /\b\d{5}(?:-\d{4})?\b/.test(text)
  const hasDob =
    /\b(0?[1-9]|1[0-2])[\/.-](0?[1-9]|[12][0-9]|3[01])[\/.-](19|20)\d{2}\b/.test(text) ||
    /\b(19|20)\d{2}-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])\b/.test(text)
  const hasNameCue = /(name\s*[:\-]|full\s*name|i am\s+[a-z]|this is\s+[a-z])/i.test(text)
  const intakeSignals = [hasEmail, hasPhone, hasZip, hasDob, hasNameCue].filter(Boolean).length

  if (intakeSignals > 0) return 'continue_intake'

  const chatIntentSignals =
    /(job|career|role|mos|training|benefit|pay|eligib|asvab|officer|enlisted|compare|difference|timeline|path|special forces)/i.test(
      text
    ) || /\b(what|how|which|can i|should i|best)\b/i.test(text) || text.includes('?')

  if (chatIntentSignals) return 'exit_to_chat'
  return 'continue_intake'
}

const normalizePhone = (value: string): string => {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return value.trim()
}

const extractRecruiterProfile = (messages: string[]): RecruiterProfile => {
  const combined = messages.join('\n')
  const profile: RecruiterProfile = {}

  const fullNameMatch =
    combined.match(/(?:full\s*name|name)\s*[:\-]\s*([a-z][a-z\s.'-]{2,})/i) ||
    combined.match(/i am\s+([a-z][a-z\s.'-]{2,})/i) ||
    combined.match(/this is\s+([a-z][a-z\s.'-]{2,})/i)
  if (fullNameMatch?.[1]) profile.fullName = fullNameMatch[1].trim()

  const emailMatch = combined.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)
  if (emailMatch?.[0]) profile.email = emailMatch[0].toLowerCase()

  const phoneMatch = combined.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)
  if (phoneMatch?.[0]) profile.phone = normalizePhone(phoneMatch[0])

  const zipMatch = combined.match(/\b\d{5}(?:-\d{4})?\b/)
  if (zipMatch?.[0]) profile.zipCode = zipMatch[0]

  const dobMatch =
    combined.match(/\b(0?[1-9]|1[0-2])[\/.-](0?[1-9]|[12][0-9]|3[01])[\/.-](19|20)\d{2}\b/) ||
    combined.match(/\b(19|20)\d{2}-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])\b/)
  if (dobMatch?.[0]) profile.dateOfBirth = dobMatch[0]

  return profile
}

const getMissingRecruiterFields = (profile: RecruiterProfile): string[] => {
  const missing: string[] = []
  if (!profile.fullName) missing.push('full name')
  if (!profile.email) missing.push('email')
  if (!profile.phone) missing.push('phone number')
  if (!profile.zipCode) missing.push('zip code')
  if (!profile.dateOfBirth) missing.push('date of birth')
  return missing
}

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
  const { message, history = [], recruiterMode = false } = body || {}
  let recruiterModeActive = Boolean(recruiterMode)

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  if (recruiterModeActive) {
    const recruiterIntent = detectRecruiterFlowIntent(message)

    if (recruiterIntent === 'cancel') {
      return NextResponse.json({
        text: 'Recruiter connection flow paused. You can ask regular job questions again, or tap the recruiter pill any time to restart.',
        components: [],
        segues: [],
        metadata: {
          recruiterMode: false
        }
      })
    }

    if (recruiterIntent === 'exit_to_chat') {
      recruiterModeActive = false
    } else {
      const userTexts = [
        ...history
          .filter((h: any) => h?.role === 'user' && typeof h.content === 'string')
          .map((h: any) => h.content),
        message
      ]
      const profile = extractRecruiterProfile(userTexts)
      const missingFields = getMissingRecruiterFields(profile)
      const completed = missingFields.length === 0

      const recruiterCardContent = completed
        ? [
            `Name: ${profile.fullName}`,
            `Email: ${profile.email}`,
            `Phone: ${profile.phone}`,
            `Zip Code: ${profile.zipCode}`,
            `Date of Birth: ${profile.dateOfBirth}`,
            '',
            'A recruiter handoff can now proceed from this chat context.'
          ].join('\n')
        : [
            'To connect you with a human recruiter, share the missing details in this chat:',
            `- ${missingFields.join('\n- ')}`,
            '',
            'Official recruiter finder: https://www.goarmy.com/how-to-join/find-a-recruiter'
          ].join('\n')

      return NextResponse.json({
        text: completed
          ? 'Thanks - I have everything needed to connect you with a recruiter. A human follow-up can now be initiated from this chat flow.'
          : RECRUITER_REQUEST_TEXT,
        components: [
          {
            type: 'card',
            props: {
              title: completed ? 'Recruiter Intake Complete' : 'Recruiter Contact Intake',
              description: completed ? 'All required information captured.' : 'Human recruiter connection path',
              content: recruiterCardContent,
              variant: 'outline'
            }
          } as any
        ],
        segues: [],
        metadata: {
          recruiterMode: !completed,
          recruiterMissingFields: missingFields,
          recruiterProfile: profile
        }
      })
    }
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
      recruiterMode: recruiterModeActive,
      sourceCount: payload.pages.length,
      retrievedSourceCount: relevantPages.length,
      generatedAt: payload.generatedAt,
      sources: sourceLinks
    }
  })
}

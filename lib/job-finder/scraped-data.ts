import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export interface ScrapedLink {
  href: string
  text: string
}

export interface ScrapedComponentBlock {
  id: string
  type: 'hero' | 'table' | 'list' | 'media-grid' | 'cta' | 'text'
  position: number
  title?: string
  text?: string
  listItems?: string[]
  tableHeaders?: string[]
  tableRows?: string[][]
  links?: ScrapedLink[]
  images?: string[]
  styleHints?: {
    classes: string[]
    htmlTag: string
  }
}

export interface ScrapedJobPage {
  url: string
  title: string
  textExcerpt: string
  matchedLabels: string[]
  images: string[]
  youtubeLinks: string[]
  links?: ScrapedLink[]
  componentBlocks?: ScrapedComponentBlock[]
}

export interface ScrapedCoverageReport {
  totalTargetLabels: number
  labelsFound: string[]
  labelsMissing: string[]
  coveragePercent: number
  matchedPagesByLabel: Record<string, string[]>
}

export interface ScrapedJobsPayload {
  generatedAt: string
  seedUrl: string
  scopedLabels: string[]
  crawledPageCount: number
  coverage?: ScrapedCoverageReport
  pages: ScrapedJobPage[]
}

let cachedPayload: ScrapedJobsPayload | null = null
let cacheLoadedAt = 0
const CACHE_TTL_MS = 60_000

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'to', 'of', 'for', 'on', 'in', 'at', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'with', 'from', 'as', 'it', 'this', 'that',
  'what', 'how', 'why', 'when', 'where', 'which', 'who'
])

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const tokenize = (value: string) =>
  normalize(value)
    .split(' ')
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))

const dataPath = resolve(process.cwd(), 'data', 'goarmy', 'jobs-crawl-latest.json')

export async function loadScrapedJobsPayload(): Promise<ScrapedJobsPayload | null> {
  const now = Date.now()
  if (cachedPayload && now - cacheLoadedAt < CACHE_TTL_MS) {
    return cachedPayload
  }

  try {
    const raw = await readFile(dataPath, 'utf8')
    const parsed = JSON.parse(raw) as ScrapedJobsPayload
    if (!parsed?.pages || !Array.isArray(parsed.pages)) return null
    cachedPayload = parsed
    cacheLoadedAt = now
    return parsed
  } catch {
    return null
  }
}

export async function getScrapedCoverage(): Promise<ScrapedCoverageReport | null> {
  const payload = await loadScrapedJobsPayload()
  return payload?.coverage || null
}

const scorePage = (queryTokens: string[], page: ScrapedJobPage): number => {
  const haystack = tokenize(
    `${page.title} ${page.url} ${page.matchedLabels.join(' ')} ${page.textExcerpt}`
  )
  const tokenSet = new Set(haystack)
  let score = 0
  for (const token of queryTokens) {
    if (tokenSet.has(token)) score += 1
  }
  return score
}

export async function searchScrapedPages(query: string, limit = 8): Promise<ScrapedJobPage[]> {
  const payload = await loadScrapedJobsPayload()
  if (!payload) return []

  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) {
    return payload.pages.slice(0, limit)
  }

  const ranked = payload.pages
    .map((page) => ({ page, score: scorePage(queryTokens, page) }))
    .sort((a, b) => b.score - a.score)

  const positive = ranked.filter((item) => item.score > 0).map((item) => item.page)
  if (positive.length > 0) {
    return positive.slice(0, limit)
  }

  return payload.pages.slice(0, limit)
}

export async function getPagesForSlug(slug: string, title: string, limit = 6): Promise<ScrapedJobPage[]> {
  const payload = await loadScrapedJobsPayload()
  if (!payload) return []

  const slugTerms = tokenize(slug.replace(/-/g, ' '))
  const titleTerms = tokenize(title)
  const terms = [...new Set([...slugTerms, ...titleTerms])]

  const ranked = payload.pages
    .map((page) => {
      const combined = `${page.title} ${page.url} ${page.matchedLabels.join(' ')}`
      const tokenSet = new Set(tokenize(combined))
      let score = 0
      for (const term of terms) {
        if (tokenSet.has(term)) score += 1
      }
      return { page, score }
    })
    .sort((a, b) => b.score - a.score)

  const matched = ranked.filter((item) => item.score > 0).map((item) => item.page)
  if (matched.length > 0) return matched.slice(0, limit)
  return payload.pages.slice(0, limit)
}

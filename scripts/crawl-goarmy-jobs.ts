import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT_URL = 'https://www.goarmy.com/'
const CAREERS_URL = 'https://www.goarmy.com/careers-and-jobs'
const BROWSE_JOBS_URL = 'https://www.goarmy.com/careers-and-jobs/browse-jobs'
const BROWSE_JOBS_FILTERED_URL =
  'https://www.goarmy.com/careers-and-jobs/browse-jobs?category=aviation,science-medicine,ground-forces,signal-intelligence,support-logistics,mechanics-engineering'
const CMT_JOBS_ENDPOINT = 'https://www.goarmy.com/bin/aemservlet/cmtjobs.en.json'
const ALLOWED_HOSTS = new Set(['www.goarmy.com', 'goarmy.com'])
const DEFAULT_MAX_PAGES = 180

const TARGET_LABELS = [
  'Career Paths',
  'Find Your Path',
  'Enlisted Soldiers',
  'Army Officers',
  'Officer Candidate School',
  'Warrant Officers',
  'Army Civilian Careers',
  'College Path',
  'Army ROTC',
  'ROTC Scholarships',
  'USMA at West Point',
  'Green to Gold',
  'Medical Path',
  'Army Medical',
  'Medical Scholarships',
  'Medical Training',
  'Specialized Paths',
  'Specialty Jobs',
  'Army Law',
  'Army Chaplain',
  'Army Cyber & Technology',
  'Army Aviation',
  'Army Bands',
  'Special Operations',
  'Army Rangers',
  'Special Forces',
  'Psychological Operations',
  'Civil Affairs',
  'Career Development',
  'Army Career Match',
  'Job Training',
  'Advanced Individual Training',
  'Leadership Training'
]

const JOB_PATH_KEYWORDS = [
  '/browse-jobs',
  '/careers-and-jobs',
  '/special-operations',
  '/army-cyber',
  '/army-aviation',
  '/army-medical',
  '/army-law',
  '/army-chaplain',
  '/leadership',
  '/job-training',
  '/advanced-individual-training'
]

type CrawlLink = {
  href: string
  text: string
}

type CrawledPage = {
  url: string
  title: string
  textExcerpt: string
  matchedLabels: string[]
  images: string[]
  youtubeLinks: string[]
  links: CrawlLink[]
  componentBlocks: ScrapedComponentBlock[]
}

type CmtJob = {
  id?: string
  moscode?: string
  mos_title?: string
  mos_description_short?: string
  category?: string
  group?: string
  path?: string
  english_url?: string
  bonus_status?: string | boolean
  bonus_amount?: number | string
  position_type?: string
  component?: string[]
  hours?: string[]
}

type ScrapedComponentBlock = {
  id: string
  type: 'hero' | 'table' | 'list' | 'media-grid' | 'cta' | 'text'
  position: number
  title?: string
  text?: string
  listItems?: string[]
  tableHeaders?: string[]
  tableRows?: string[][]
  links?: CrawlLink[]
  images?: string[]
  styleHints?: {
    classes: string[]
    htmlTag: string
  }
}

type CoverageReport = {
  totalTargetLabels: number
  labelsFound: string[]
  labelsMissing: string[]
  coveragePercent: number
  matchedPagesByLabel: Record<string, string[]>
}

const normalizeText = (value: string) =>
  value
    .replace(/\s+/g, ' ')
    .trim()

const decodeEntities = (value: string) =>
  value
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')

const stripTags = (value: string) =>
  normalizeText(
    decodeEntities(
      value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\/content\/dam\/[^\s]+/gi, ' ')
      .replace(/xdm:linkurl/gi, ' ')
    )
  )

const getTitle = (html: string): string => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return normalizeText(match?.[1] || 'Untitled')
}

const toAbsoluteUrl = (href: string, baseUrl: string): string | null => {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return null
  }
  try {
    const absolute = new URL(href, baseUrl)
    absolute.hash = ''
    if (!ALLOWED_HOSTS.has(absolute.hostname)) return null
    return absolute.toString()
  } catch {
    return null
  }
}

const extractLinks = (html: string, pageUrl: string): CrawlLink[] => {
  const links: CrawlLink[] = []
  const regex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null = regex.exec(html)

  while (match) {
    const absolute = toAbsoluteUrl(match[1], pageUrl)
    if (absolute) {
      links.push({
        href: absolute,
        text: stripTags(match[2]).slice(0, 180)
      })
    }
    match = regex.exec(html)
  }

  return links
}

const extractImages = (html: string, pageUrl: string): string[] => {
  const results = new Set<string>()
  const regex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null = regex.exec(html)

  while (match) {
    const absolute = toAbsoluteUrl(match[1], pageUrl)
    if (absolute) results.add(absolute)
    match = regex.exec(html)
  }

  return [...results]
}

const extractYoutubeLinks = (links: CrawlLink[]): string[] => {
  const results = new Set<string>()
  for (const link of links) {
    if (link.href.includes('youtube.com') || link.href.includes('youtu.be')) {
      results.add(link.href)
    }
  }
  return [...results]
}

const matchLabels = (text: string): string[] => {
  const lower = text.toLowerCase()
  return TARGET_LABELS.filter((label) => lower.includes(label.toLowerCase()))
}

const stripSectionWrapper = (value: string) =>
  value.replace(/^<section[^>]*>/i, '').replace(/<\/section>$/i, '')

const extractHeading = (html: string): string | undefined => {
  const match = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i)
  const heading = stripTags(match?.[1] || '')
  return heading || undefined
}

const extractListItems = (html: string): string[] => {
  const items: string[] = []
  const regex = /<li[^>]*>([\s\S]*?)<\/li>/gi
  let match: RegExpExecArray | null = regex.exec(html)
  while (match) {
    const value = stripTags(match[1])
    if (value) items.push(value)
    match = regex.exec(html)
  }
  return items
}

const extractTableData = (html: string): { headers: string[]; rows: string[][] } => {
  const headers: string[] = []
  const rows: string[][] = []

  const headerRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi
  let headerMatch: RegExpExecArray | null = headerRegex.exec(html)
  while (headerMatch) {
    const value = stripTags(headerMatch[1])
    if (value) headers.push(value)
    headerMatch = headerRegex.exec(html)
  }

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let rowMatch: RegExpExecArray | null = rowRegex.exec(html)
  while (rowMatch) {
    const cells: string[] = []
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi
    let cellMatch: RegExpExecArray | null = cellRegex.exec(rowMatch[1])
    while (cellMatch) {
      const value = stripTags(cellMatch[1])
      cells.push(value)
      cellMatch = cellRegex.exec(rowMatch[1])
    }
    if (cells.length > 0) rows.push(cells)
    rowMatch = rowRegex.exec(html)
  }

  return { headers, rows }
}

const extractClassHints = (tagHtml: string): string[] => {
  const classMatch = tagHtml.match(/\sclass=["']([^"']+)["']/i)
  const classes = normalizeText(classMatch?.[1] || '')
    .split(' ')
    .filter(Boolean)
  return classes.slice(0, 8)
}

const classifySection = (
  html: string,
  images: string[],
  links: CrawlLink[],
  listItems: string[],
  hasTable: boolean
): ScrapedComponentBlock['type'] => {
  const text = stripTags(html).toLowerCase()
  if (hasTable) return 'table'
  if (text.includes('apply') || text.includes('get started') || text.includes('talk to a recruiter')) {
    return 'cta'
  }
  if (images.length >= 2 && links.length >= 2) return 'media-grid'
  if (listItems.length >= 3) return 'list'
  if (text.includes('career') && text.includes('path') && images.length > 0) return 'hero'
  return 'text'
}

const extractSections = (html: string): Array<{ raw: string; inner: string; tag: string }> => {
  const sections: Array<{ raw: string; inner: string; tag: string }> = []
  const sectionRegex = /(<section[^>]*>[\s\S]*?<\/section>)/gi
  let sectionMatch: RegExpExecArray | null = sectionRegex.exec(html)
  while (sectionMatch) {
    const raw = sectionMatch[1]
    sections.push({ raw, inner: stripSectionWrapper(raw), tag: 'section' })
    sectionMatch = sectionRegex.exec(html)
  }

  // Fallback for pages with weak semantic sectioning.
  if (sections.length === 0) {
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    const inner = mainMatch?.[1] || html
    sections.push({ raw: inner, inner, tag: 'main' })
  }

  return sections
}

const extractComponentBlocks = (html: string, pageUrl: string): ScrapedComponentBlock[] => {
  const sections = extractSections(html)
  return sections
    .map((section, idx) => {
      const links = extractLinks(section.inner, pageUrl).slice(0, 10)
      const images = extractImages(section.inner, pageUrl).slice(0, 10)
      const heading = extractHeading(section.inner)
      const listItems = extractListItems(section.inner).slice(0, 8)
      const hasTable = /<table[\s>]/i.test(section.inner)
      const tableData = hasTable ? extractTableData(section.inner) : { headers: [], rows: [] }
      const blockType = classifySection(section.inner, images, links, listItems, hasTable)
      const text = stripTags(section.inner).slice(0, 600)

      return {
        id: `${new URL(pageUrl).pathname || 'root'}#${idx + 1}`,
        type: blockType,
        position: idx + 1,
        title: heading,
        text: text || undefined,
        listItems: listItems.length > 0 ? listItems : undefined,
        tableHeaders: tableData.headers.length > 0 ? tableData.headers : undefined,
        tableRows: tableData.rows.length > 0 ? tableData.rows.slice(0, 6) : undefined,
        links: links.length > 0 ? links : undefined,
        images: images.length > 0 ? images : undefined,
        styleHints: {
          classes: extractClassHints(section.raw),
          htmlTag: section.tag
        }
      } as ScrapedComponentBlock
    })
    .filter((block) => Boolean(block.text || block.title || block.links?.length || block.images?.length))
    .slice(0, 20)
}

const shouldEnqueue = (url: string, labelMatches: string[], linkText: string): boolean => {
  const lowerPath = new URL(url).pathname.toLowerCase()
  const lowerText = linkText.toLowerCase()

  if (lowerPath.startsWith('/careers-and-jobs')) return true
  if (JOB_PATH_KEYWORDS.some((keyword) => lowerPath.includes(keyword))) return true
  if (labelMatches.length > 0) return true
  return TARGET_LABELS.some((label) => lowerText.includes(label.toLowerCase()))
}

const buildCoverageReport = (pages: CrawledPage[]): CoverageReport => {
  const matchedPagesByLabel: Record<string, string[]> = {}
  for (const label of TARGET_LABELS) {
    matchedPagesByLabel[label] = []
  }

  for (const page of pages) {
    for (const label of page.matchedLabels) {
      matchedPagesByLabel[label] = matchedPagesByLabel[label] || []
      matchedPagesByLabel[label].push(page.url)
    }
  }

  const labelsFound = TARGET_LABELS.filter((label) => (matchedPagesByLabel[label] || []).length > 0)
  const labelsMissing = TARGET_LABELS.filter((label) => (matchedPagesByLabel[label] || []).length === 0)
  const coveragePercent = Number(((labelsFound.length / TARGET_LABELS.length) * 100).toFixed(2))

  return {
    totalTargetLabels: TARGET_LABELS.length,
    labelsFound,
    labelsMissing,
    coveragePercent,
    matchedPagesByLabel
  }
}

const buildCanonicalJobUrl = (job: CmtJob): string | null => {
  if (job.english_url) {
    return toAbsoluteUrl(job.english_url, ROOT_URL)
  }
  if (!job.category || !job.group || !job.path) return null
  return toAbsoluteUrl(`/careers-and-jobs/${job.category}/${job.group}/${job.path}`, ROOT_URL)
}

const buildCmtJobPages = async (): Promise<CrawledPage[]> => {
  try {
    const res = await fetch(CMT_JOBS_ENDPOINT, {
      headers: {
        'user-agent': 'AYA-JobFinder-Crawler/1.0 (+https://aya-2-tau.vercel.app)'
      }
    })
    if (!res.ok) {
      console.error(`Failed to fetch CMT jobs endpoint (${res.status}).`)
      return []
    }

    const payload = (await res.json()) as CmtJob[]
    if (!Array.isArray(payload)) return []

    const pages: CrawledPage[] = []
    for (const job of payload) {
      const url = buildCanonicalJobUrl(job)
      const title = normalizeText(job.mos_title || job.moscode || '')
      if (!url || !title) continue

      const details = [
        job.mos_description_short,
        job.position_type,
        job.category?.replace(/-/g, ' '),
        job.group?.replace(/-/g, ' '),
        Array.isArray(job.component) ? `Component: ${job.component.join(', ')}` : '',
        Array.isArray(job.hours) ? `Hours: ${job.hours.join(', ')}` : '',
        job.bonus_status === true || String(job.bonus_status).toLowerCase() === 'true'
          ? `Bonus eligible${job.bonus_amount ? ` up to ${job.bonus_amount}` : ''}`
          : ''
      ]
        .filter(Boolean)
        .join('. ')

      pages.push({
        url,
        title: `${title}${job.moscode ? ` (${job.moscode})` : ''}`,
        textExcerpt: normalizeText(details).slice(0, 1500),
        matchedLabels: matchLabels(`${title} ${details} ${job.category || ''} ${job.group || ''}`),
        images: [],
        youtubeLinks: [],
        links: [],
        componentBlocks: []
      })
    }

    return pages
  } catch (error) {
    console.error('Failed to ingest CMT jobs feed:', error)
    return []
  }
}

async function crawlJobsScope(maxPages: number) {
  const queue = [ROOT_URL, CAREERS_URL, BROWSE_JOBS_URL, BROWSE_JOBS_FILTERED_URL]
  const visited = new Set<string>()
  const pages: CrawledPage[] = []

  while (queue.length > 0 && pages.length < maxPages) {
    const url = queue.shift()
    if (!url || visited.has(url)) continue
    visited.add(url)

    try {
      const res = await fetch(url, {
        headers: {
          'user-agent': 'AYA-JobFinder-Crawler/1.0 (+https://aya-2-tau.vercel.app)'
        }
      })
      if (!res.ok) continue

      const html = await res.text()
      const title = getTitle(html)
      const fullText = stripTags(html)
      const links = extractLinks(html, url)
      const images = extractImages(html, url)
      const youtubeLinks = extractYoutubeLinks(links)
      const matchedLabels = matchLabels(`${title} ${fullText}`)
      const componentBlocks = extractComponentBlocks(html, url)

      pages.push({
        url,
        title,
        textExcerpt: fullText.slice(0, 1500),
        matchedLabels,
        images: images.slice(0, 20),
        youtubeLinks: youtubeLinks.slice(0, 10),
        links: links.slice(0, 120),
        componentBlocks
      })

      for (const link of links) {
        if (visited.has(link.href)) continue
        const linkMatches = matchLabels(link.text)
        if (shouldEnqueue(link.href, linkMatches, link.text)) {
          queue.push(link.href)
        }
      }
    } catch (error) {
      console.error(`Failed to crawl ${url}:`, error)
    }
  }

  const cmtJobPages = await buildCmtJobPages()
  const mergedPageMap = new Map<string, CrawledPage>()
  for (const page of pages) mergedPageMap.set(page.url, page)
  for (const page of cmtJobPages) {
    if (mergedPageMap.has(page.url)) continue
    mergedPageMap.set(page.url, page)
  }
  const mergedPages = [...mergedPageMap.values()]
  const coverage = buildCoverageReport(mergedPages)

  return {
    generatedAt: new Date().toISOString(),
    seedUrl: ROOT_URL,
    crawlConfig: {
      maxPages,
      queueSeed: [ROOT_URL, CAREERS_URL, BROWSE_JOBS_URL, BROWSE_JOBS_FILTERED_URL],
      pathKeywords: JOB_PATH_KEYWORDS
    },
    scopedLabels: TARGET_LABELS,
    crawledPageCount: mergedPages.length,
    crawlStats: {
      htmlPages: pages.length,
      cmtJobs: cmtJobPages.length
    },
    coverage,
    pages: mergedPages
  }
}

async function main() {
  const args = process.argv.slice(2)
  const withSnapshot = args.includes('--snapshot')
  const strictCoverage = args.includes('--strict-coverage')
  const maxPagesInput = args.find((arg) => /^\d+$/.test(arg))
  const maxPagesArg = Number(maxPagesInput || DEFAULT_MAX_PAGES)
  const maxPages = Number.isFinite(maxPagesArg) && maxPagesArg > 0 ? maxPagesArg : DEFAULT_MAX_PAGES
  const report = await crawlJobsScope(maxPages)

  const outputDir = resolve(process.cwd(), 'data', 'goarmy')
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true })
  }

  const latestPath = resolve(outputDir, 'jobs-crawl-latest.json')

  const payload = JSON.stringify(report, null, 2)
  await writeFile(latestPath, payload, 'utf8')
  
  if (withSnapshot) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const timestampedPath = resolve(outputDir, `jobs-crawl-${timestamp}.json`)
    await writeFile(timestampedPath, payload, 'utf8')
    console.log(`Saved snapshot: ${timestampedPath}`)
  }

  console.log(`Crawled ${report.crawledPageCount} pages.`)
  console.log(`Label coverage: ${report.coverage.labelsFound.length}/${report.coverage.totalTargetLabels} (${report.coverage.coveragePercent}%)`)
  if (report.coverage.labelsMissing.length > 0) {
    console.log(`Missing labels: ${report.coverage.labelsMissing.join(', ')}`)
  }
  console.log(`Saved latest: ${latestPath}`)

  if (strictCoverage && report.coverage.labelsMissing.length > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

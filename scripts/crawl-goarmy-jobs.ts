import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT_URL = 'https://www.goarmy.com/'
const ALLOWED_HOSTS = new Set(['www.goarmy.com', 'goarmy.com'])
const DEFAULT_MAX_PAGES = 60

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
}

const normalizeText = (value: string) =>
  value
    .replace(/\s+/g, ' ')
    .trim()

const stripTags = (value: string) =>
  normalizeText(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
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

const shouldEnqueue = (url: string, labelMatches: string[], linkText: string): boolean => {
  const lowerPath = new URL(url).pathname.toLowerCase()
  const lowerText = linkText.toLowerCase()

  if (lowerPath.includes('/careers-and-jobs')) return true
  if (lowerPath.includes('/special-operations')) return true
  if (lowerPath.includes('/benefits/education')) return true
  if (labelMatches.length > 0) return true
  return TARGET_LABELS.some((label) => lowerText.includes(label.toLowerCase()))
}

async function crawlJobsScope(maxPages: number) {
  const queue = [ROOT_URL, 'https://www.goarmy.com/careers-and-jobs']
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

      pages.push({
        url,
        title,
        textExcerpt: fullText.slice(0, 1500),
        matchedLabels,
        images: images.slice(0, 20),
        youtubeLinks: youtubeLinks.slice(0, 10),
        links: links.slice(0, 120)
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

  return {
    generatedAt: new Date().toISOString(),
    seedUrl: ROOT_URL,
    scopedLabels: TARGET_LABELS,
    crawledPageCount: pages.length,
    pages
  }
}

async function main() {
  const args = process.argv.slice(2)
  const withSnapshot = args.includes('--snapshot')
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
  console.log(`Saved latest: ${latestPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

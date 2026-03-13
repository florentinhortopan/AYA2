import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { prisma } from '../lib/db'
import { categorizeGoArmyPage } from '../lib/job-finder/page-categorizer'

type CrawlPage = {
  url: string
  title: string
  textExcerpt: string
  matchedLabels: string[]
  images: string[]
  youtubeLinks: string[]
  componentBlocks?: Array<{ images?: string[] }>
}

type CrawlPayload = {
  generatedAt: string
  seedUrl: string
  scopedLabels: string[]
  crawledPageCount: number
  pages: CrawlPage[]
}

const DEFAULT_CRAWL_PATH = resolve(process.cwd(), 'data', 'goarmy', 'jobs-crawl-latest.json')
const DEFAULT_PROJECT_NAME = 'GoArmy Jobs Knowledge Base'
const DEFAULT_CORPUS_NAME = 'goarmy-jobs-corpus-latest'

function buildCorpusText(payload: CrawlPayload): string {
  const blocks = payload.pages.map((page, index) => {
    const labels = page.matchedLabels.length > 0 ? page.matchedLabels.join(', ') : 'none'
    const imageList = page.images.slice(0, 5).join('\n') || 'none'
    const youtubeList = page.youtubeLinks.slice(0, 5).join('\n') || 'none'

    return [
      `## Page ${index + 1}: ${page.title}`,
      `URL: ${page.url}`,
      `Matched Labels: ${labels}`,
      '',
      'Excerpt:',
      page.textExcerpt || 'No excerpt extracted.',
      '',
      'Images:',
      imageList,
      '',
      'YouTube Links:',
      youtubeList
    ].join('\n')
  })

  return [
    '# GoArmy Jobs Crawl Corpus',
    `Generated At: ${payload.generatedAt}`,
    `Seed URL: ${payload.seedUrl}`,
    `Crawled Pages: ${payload.crawledPageCount}`,
    '',
    'Scoped Labels:',
    ...payload.scopedLabels.map((label) => `- ${label}`),
    '',
    ...blocks
  ].join('\n')
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const sourcePath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : DEFAULT_CRAWL_PATH
  const raw = await readFile(sourcePath, 'utf8')
  const payload = JSON.parse(raw) as CrawlPayload

  if (!payload.pages || payload.pages.length === 0) {
    throw new Error('Crawl payload has no pages. Run crawl:goarmy:jobs first.')
  }

  const corpusText = buildCorpusText(payload)
  const sourceUrls = payload.pages.map((page) => page.url)

  const existingCorpus = await prisma.corpusFile.findFirst({
    where: { name: DEFAULT_CORPUS_NAME, isActive: true },
    orderBy: { updatedAt: 'desc' }
  })

  let corpusId: string
  if (existingCorpus) {
    const updated = await prisma.corpusFile.update({
      where: { id: existingCorpus.id },
      data: {
        fileContent: corpusText,
        sourceUrls
      }
    })
    corpusId = updated.id
    console.log(`Updated corpus: ${updated.id}`)
  } else {
    const created = await prisma.corpusFile.create({
      data: {
        name: DEFAULT_CORPUS_NAME,
        fileContent: corpusText,
        sourceUrls,
        isActive: true
      }
    })
    corpusId = created.id
    console.log(`Created corpus: ${created.id}`)
  }

  const existingProject = await prisma.qaProject.findFirst({
    where: { name: DEFAULT_PROJECT_NAME },
    orderBy: { updatedAt: 'desc' }
  })

  if (existingProject) {
    const updatedProject = await prisma.qaProject.update({
      where: { id: existingProject.id },
      data: {
        corpusFileId: corpusId,
        description: `Auto-ingested from GoArmy jobs crawl (${payload.generatedAt})`
      }
    })
    console.log(`Updated project: ${updatedProject.id}`)
    if (!dryRun) {
      await ingestKnowledgeSources(updatedProject.id, payload)
    }
  } else {
    const createdProject = await prisma.qaProject.create({
      data: {
        name: DEFAULT_PROJECT_NAME,
        description: `Auto-ingested from GoArmy jobs crawl (${payload.generatedAt})`,
        status: 'in_progress',
        targetQuestionCount: 300,
        corpusFileId: corpusId
      }
    })
    console.log(`Created project: ${createdProject.id}`)
    if (!dryRun) {
      await ingestKnowledgeSources(createdProject.id, payload)
    }
  }

  if (dryRun) {
    console.log('Dry run complete. No KnowledgeSource rows were written.')
  } else {
    console.log('Ingestion complete.')
  }
  console.log(`Corpus source: ${sourcePath}`)
}

function pickMediaType(url: string): 'image' | 'video' | null {
  const lower = url.toLowerCase()
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'video'
  if (/\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/.test(lower)) return 'image'
  if (lower.includes('/content/dam/')) return 'image'
  return null
}

function inferProvider(url: string): string | undefined {
  const lower = url.toLowerCase()
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
  if (lower.includes('goarmy.com')) return 'goarmy'
  return undefined
}

function normalizeMediaUrls(page: CrawlPage): string[] {
  const collected = new Set<string>()
  const add = (url: string) => {
    const trimmed = String(url || '').trim()
    if (!trimmed) return
    const lower = trimmed.toLowerCase()
    // Filter decorative/non-content assets.
    if (
      lower.includes('logo') ||
      lower.includes('sprite') ||
      lower.includes('favicon') ||
      lower.includes('icon-') ||
      lower.endsWith('.svg')
    ) {
      return
    }
    collected.add(trimmed)
  }

  page.images.forEach(add)
  page.youtubeLinks.forEach(add)
  page.componentBlocks?.forEach((block) => block.images?.forEach(add))
  return [...collected]
}

async function ingestKnowledgeSources(projectId: string, payload: CrawlPayload) {
  let pageCreates = 0
  let pageUpdates = 0
  let mediaCreates = 0

  for (const page of payload.pages) {
    const categorization = categorizeGoArmyPage({
      url: page.url,
      title: page.title,
      excerpt: page.textExcerpt,
      matchedLabels: page.matchedLabels
    })

    const checksum = createHash('sha256')
      .update(`${page.url}|${page.title}|${page.textExcerpt}`)
      .digest('hex')

    const existingPage = await prisma.knowledgeSourcePage.findFirst({
      where: { projectId, externalUrl: page.url }
    })

    const pageRecord = existingPage
      ? await prisma.knowledgeSourcePage.update({
          where: { id: existingPage.id },
          data: {
            title: page.title,
            slug: categorization.slug,
            section: categorization.section,
            status: 'processed',
            textContent: page.textExcerpt,
            checksum,
            scrapedAt: new Date(payload.generatedAt)
          }
        })
      : await prisma.knowledgeSourcePage.create({
          data: {
            projectId,
            externalUrl: page.url,
            title: page.title,
            slug: categorization.slug,
            section: categorization.section,
            status: 'processed',
            textContent: page.textExcerpt,
            checksum,
            scrapedAt: new Date(payload.generatedAt)
          }
        })

    if (existingPage) pageUpdates += 1
    else pageCreates += 1

    await prisma.knowledgeSourceMedia.deleteMany({
      where: { pageId: pageRecord.id }
    })

    const mediaUrls = normalizeMediaUrls(page)
    for (let idx = 0; idx < mediaUrls.length; idx += 1) {
      const mediaUrl = mediaUrls[idx]
      const mediaType = pickMediaType(mediaUrl)
      if (!mediaType) continue

      await prisma.knowledgeSourceMedia.create({
        data: {
          pageId: pageRecord.id,
          mediaType,
          sourceUrl: mediaUrl,
          provider: inferProvider(mediaUrl),
          sortOrder: idx,
          data: {
            pageSlug: categorization.slug,
            section: categorization.section,
            matchedLabels: page.matchedLabels,
            topicHints: categorization.topicHints,
            confidence: categorization.confidence,
            source: 'goarmy-crawl'
          } as any
        }
      })
      mediaCreates += 1
    }
  }

  console.log(
    `Knowledge sources synced: pages created ${pageCreates}, pages updated ${pageUpdates}, media rows ${mediaCreates}`
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

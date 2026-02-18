import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { prisma } from '../lib/db'

type CrawlPage = {
  url: string
  title: string
  textExcerpt: string
  matchedLabels: string[]
  images: string[]
  youtubeLinks: string[]
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
  }

  console.log('Ingestion complete.')
  console.log(`Corpus source: ${sourcePath}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

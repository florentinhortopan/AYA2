import { prisma } from '@/lib/db'
import { searchScrapedPages } from '@/lib/job-finder/scraped-data'
import { ImmersiveCard } from '@/lib/content/immersive/scene-orchestrator'
import { deriveSlugFromUrl } from '@/lib/job-finder/page-categorizer'

interface AdapterParams {
  projectId: string
  message: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'to', 'of', 'for', 'on', 'in', 'at', 'by', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'with', 'from', 'as', 'it', 'this', 'that', 'what', 'how', 'why',
  'when', 'where', 'which', 'who', 'i', 'you', 'we'
])

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

const tokenize = (value: string) =>
  normalize(value)
    .split(' ')
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))

const scoreByOverlap = (queryTokens: string[], text: string): number => {
  const textTokens = new Set(tokenize(text))
  let score = 0
  for (const token of queryTokens) {
    if (textTokens.has(token)) score += 1
  }
  return score
}

const scoreMediaRecord = (queryTokens: string[], metadata: {
  title?: string | null
  pageTitle?: string | null
  pageSlug?: string | null
  section?: string | null
  topicHints?: string[]
  textExcerpt?: string | null
}) => {
  const searchable = [
    metadata.title,
    metadata.pageTitle,
    metadata.pageSlug,
    metadata.section,
    metadata.textExcerpt,
    ...(metadata.topicHints || [])
  ]
    .filter(Boolean)
    .join(' ')
  return scoreByOverlap(queryTokens, searchable)
}

const toYouTubeEmbedUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').trim()
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    return null
  } catch {
    return null
  }
}

const buildRagAndDbVideoCards = async (
  projectId: string,
  queryTokens: string[]
): Promise<{ ragCards: ImmersiveCard[]; dbVideoCards: ImmersiveCard[] }> => {
  const questions = await prisma.qaQuestion.findMany({
    where: { projectId },
    include: {
      answers: {
        where: { validationStatus: { in: ['approved', 'published', 'valid'] } },
        include: { mediaAssets: true },
        orderBy: { updatedAt: 'desc' },
        take: 2
      }
    },
    take: 40
  })

  const ranked = questions
    .map((question) => {
      const searchable = [
        question.questionText,
        question.topic,
        question.persona,
        question.tone,
        ...question.answers.map((answer) => answer.answerText),
        ...question.answers.flatMap((answer) => answer.keywords)
      ]
        .filter(Boolean)
        .join(' ')
      return {
        question,
        score: scoreByOverlap(queryTokens, searchable)
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const ragCards: ImmersiveCard[] = ranked.flatMap(({ question }, qIndex) =>
    question.answers.slice(0, 1).map((answer, aIndex) => ({
      id: `rag-${question.id}-${aIndex}`,
      type: 'rag',
      title: question.questionText,
      body: answer.answerText.slice(0, 320),
      sourceUrl: answer.sourceLink || undefined,
      metadata: {
        rank: qIndex + 1,
        status: String(answer.validationStatus)
      }
    }))
  )

  const dbVideoCards: ImmersiveCard[] = ranked.flatMap(({ question }) =>
    question.answers.flatMap((answer) =>
      answer.mediaAssets
        .filter((asset) => {
          const mediaType = String(asset.mediaType).toLowerCase()
          return mediaType.includes('youtube') || mediaType.includes('video')
        })
        .map((asset, index) => ({
          id: `video-db-${asset.id}-${index}`,
          type: 'video' as const,
          title: asset.title || question.questionText,
          body: asset.description || 'Related video from the knowledge base.',
          sourceUrl: toYouTubeEmbedUrl(asset.sourceUrl) || asset.sourceUrl,
          thumbnailUrl: asset.thumbnailUrl || undefined,
          metadata: { provider: asset.provider || 'youtube' }
        }))
    )
  )

  return { ragCards, dbVideoCards }
}

const buildKnowledgeMediaCards = async (
  projectId: string,
  queryTokens: string[]
): Promise<{ imageCards: ImmersiveCard[]; mediaVideoCards: ImmersiveCard[] }> => {
  const pages = await prisma.knowledgeSourcePage.findMany({
    where: {
      projectId,
      status: { in: ['processed', 'indexed', 'published'] }
    },
    include: {
      mediaAssets: true
    },
    take: 150
  })

  const rankedMedia = pages.flatMap((page) =>
    page.mediaAssets
      .map((asset) => {
        const data = (asset.data || {}) as Record<string, unknown>
        const topicHints = Array.isArray(data.topicHints)
          ? data.topicHints.map((value) => String(value))
          : []
        const score = scoreMediaRecord(queryTokens, {
          title: asset.title,
          pageTitle: page.title,
          pageSlug: page.slug || deriveSlugFromUrl(page.externalUrl),
          section: page.section,
          topicHints,
          textExcerpt: page.textContent
        })
        return { page, asset, score }
      })
      .filter((item) => item.score > 0)
  )

  rankedMedia.sort((a, b) => b.score - a.score)

  const imageCards: ImmersiveCard[] = []
  const mediaVideoCards: ImmersiveCard[] = []
  const seenSource = new Set<string>()

  for (const item of rankedMedia) {
    const mediaType = String(item.asset.mediaType).toLowerCase()
    const sourceUrl = item.asset.sourceUrl
    if (!sourceUrl || seenSource.has(sourceUrl)) continue
    seenSource.add(sourceUrl)

    if (mediaType.includes('image')) {
      imageCards.push({
        id: `media-image-${item.asset.id}`,
        type: 'image',
        title: item.asset.title || item.page.title || 'GoArmy image',
        body: item.asset.description || 'Visual context from source page.',
        sourceUrl,
        thumbnailUrl: item.asset.thumbnailUrl || sourceUrl,
        metadata: {
          score: item.score,
          section: item.page.section || '',
          pageSlug: item.page.slug || ''
        }
      })
    } else if (mediaType.includes('video') || mediaType.includes('youtube')) {
      mediaVideoCards.push({
        id: `media-video-${item.asset.id}`,
        type: 'video',
        title: item.asset.title || item.page.title || 'GoArmy video',
        body: item.asset.description || 'Video reference from source page.',
        sourceUrl: toYouTubeEmbedUrl(sourceUrl) || sourceUrl,
        thumbnailUrl: item.asset.thumbnailUrl || undefined,
        metadata: {
          score: item.score,
          section: item.page.section || '',
          pageSlug: item.page.slug || ''
        }
      })
    }
  }

  return {
    imageCards: imageCards.slice(0, 8),
    mediaVideoCards: mediaVideoCards.slice(0, 6)
  }
}

const buildScrapedJobAndVideoCards = async (message: string): Promise<{
  jobCards: ImmersiveCard[]
  scrapedVideoCards: ImmersiveCard[]
}> => {
  const scrapedPages = await searchScrapedPages(message, 4)
  const jobCards: ImmersiveCard[] = scrapedPages.map((page, index) => ({
    id: `job-${index}-${normalize(page.title).slice(0, 24)}`,
    type: 'job',
    title: page.title,
    body: page.textExcerpt.slice(0, 260),
    sourceUrl: page.url,
    metadata: { labels: page.matchedLabels.slice(0, 3).join(', ') || 'General' }
  }))

  const scrapedVideoCards: ImmersiveCard[] = scrapedPages
    .flatMap((page, pageIndex) =>
      page.youtubeLinks.slice(0, 1).map((videoUrl, vidIndex) => ({
        id: `video-scraped-${pageIndex}-${vidIndex}`,
        type: 'video' as const,
        title: `${page.title} Video`,
        body: 'Video reference extracted from indexed pages.',
        sourceUrl: toYouTubeEmbedUrl(videoUrl) || videoUrl
      }))
    )
    .filter((card) => Boolean(card.sourceUrl))

  return { jobCards, scrapedVideoCards }
}

export async function collectImmersiveCards({
  projectId,
  message,
  history
}: AdapterParams): Promise<ImmersiveCard[]> {
  const queryTokens = tokenize(
    [...history.filter((h) => h.role === 'user').map((h) => h.content).slice(-4), message].join(' ')
  )

  const [{ ragCards, dbVideoCards }, { imageCards, mediaVideoCards }, { jobCards, scrapedVideoCards }] = await Promise.all([
    buildRagAndDbVideoCards(projectId, queryTokens),
    buildKnowledgeMediaCards(projectId, queryTokens),
    buildScrapedJobAndVideoCards(message)
  ])

  const ctaCard: ImmersiveCard = {
    id: 'cta-apply',
    type: 'cta',
    title: 'Ready for a next step?',
    body: 'When you are ready, ask for eligibility details or recruiter contact guidance.',
    sourceUrl: 'https://www.goarmy.com/how-to-join.html'
  }

  const rankedSupporting = [...ragCards, ...jobCards].slice(0, 6)
  const rankedVideos = [...mediaVideoCards, ...dbVideoCards, ...scrapedVideoCards]
  const rankedImages = imageCards

  // Diversity cap per turn:
  // - max 2 images
  // - max 1 video
  // - max 2 support cards (rag/job/insight)
  // - always one CTA card appended
  const selectedCards = [
    ...rankedSupporting.slice(0, 2),
    ...rankedImages.slice(0, 2),
    ...rankedVideos.slice(0, 1),
    ctaCard
  ]

  return selectedCards
}

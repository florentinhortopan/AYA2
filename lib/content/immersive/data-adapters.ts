import { prisma } from '@/lib/db'
import { searchScrapedPages } from '@/lib/job-finder/scraped-data'
import { ImmersiveCard } from '@/lib/content/immersive/scene-orchestrator'

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
        .filter((asset) => String(asset.mediaType).toLowerCase().includes('youtube'))
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

  const [{ ragCards, dbVideoCards }, { jobCards, scrapedVideoCards }] = await Promise.all([
    buildRagAndDbVideoCards(projectId, queryTokens),
    buildScrapedJobAndVideoCards(message)
  ])

  const ctaCard: ImmersiveCard = {
    id: 'cta-apply',
    type: 'cta',
    title: 'Ready for a next step?',
    body: 'When you are ready, ask for eligibility details or recruiter contact guidance.',
    sourceUrl: 'https://www.goarmy.com/how-to-join.html'
  }

  return [...ragCards, ...jobCards, ...dbVideoCards, ...scrapedVideoCards, ctaCard]
}

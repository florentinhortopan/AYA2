import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fallbackStoryCards } from '@/lib/campaigns/field-tested/content'
import { FieldStoryCardAsset } from '@/lib/campaigns/field-tested/types'

export const dynamic = 'force-dynamic'

const classifyBucket = (text: string): FieldStoryCardAsset['bucket'] => {
  const value = text.toLowerCase()
  if (
    value.includes('team') ||
    value.includes('soldier') ||
    value.includes('people') ||
    value.includes('community') ||
    value.includes('family')
  ) {
    return 'humans'
  }
  if (
    value.includes('terrain') ||
    value.includes('field') ||
    value.includes('environment') ||
    value.includes('nature') ||
    value.includes('outdoor')
  ) {
    return 'field'
  }
  return 'operations'
}

const pillarKeywordMap = {
  strength: [
    'strength',
    'resilience',
    'determination',
    'confidence',
    'challenge',
    'tough',
    'grit',
    'training',
    'basic'
  ],
  skills: [
    'skills',
    'career',
    'job',
    'engineering',
    'tech',
    'technology',
    'non-combat',
    'transferable',
    'pathway'
  ],
  support: ['support', 'team', 'community', 'mentor', 'mentorship', 'belonging', 'family', 'together'],
  stability: [
    'stability',
    'benefits',
    'education',
    'healthcare',
    'security',
    'future',
    'financial',
    'scholarship'
  ]
} as const

type Pillar = keyof typeof pillarKeywordMap

const scorePillarMatch = (text: string, pillar: Pillar | null) => {
  if (!pillar) return 0
  const normalized = text.toLowerCase()
  let score = 0
  for (const keyword of pillarKeywordMap[pillar]) {
    if (normalized.includes(keyword)) score += 1
  }
  return score
}

const getDescription = (title: string, section?: string | null) => {
  if (section === 'field') {
    return 'Environment and terrain moments that ground the journey in realistic context.'
  }
  if (section === 'support') {
    return 'Human-centered moments that highlight belonging, support, and team dynamics.'
  }
  if (section === 'skills') {
    return 'Skill-building moments with practical, transferable outcomes.'
  }
  return `Campaign media selected from GoArmy knowledge sources: ${title || 'Field story asset'}.`
}

export async function GET(request: NextRequest) {
  try {
    const requestedPillar = request.nextUrl.searchParams.get('pillar')
    const pillar: Pillar | null =
      requestedPillar && requestedPillar in pillarKeywordMap ? (requestedPillar as Pillar) : null

    const goArmyProject = await prisma.qaProject.findFirst({
      where: { name: 'GoArmy Jobs Knowledge Base' },
      orderBy: { updatedAt: 'desc' }
    })

    if (!goArmyProject) {
      return NextResponse.json({ cards: fallbackStoryCards, source: 'fallback-no-project' })
    }

    const media = await prisma.knowledgeSourceMedia.findMany({
      where: {
        mediaType: 'image',
        page: {
          projectId: goArmyProject.id
        }
      },
      include: {
        page: {
          select: {
            title: true,
            section: true,
            externalUrl: true
          }
        }
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 90
    })

    if (!media.length) {
      return NextResponse.json({ cards: fallbackStoryCards, source: 'fallback-no-media' })
    }

    const rankedMedia = media
      .map((item) => {
        const title = item.title || item.page?.title || ''
        const description = item.description || ''
        const section = item.page?.section || ''
        const dataText = typeof item.data === 'object' && item.data ? JSON.stringify(item.data) : ''
        const matchText = [title, description, section, dataText].join(' ')
        return {
          item,
          title,
          matchText,
          pillarScore: scorePillarMatch(matchText, pillar)
        }
      })
      .sort((a, b) => {
        if (b.pillarScore !== a.pillarScore) return b.pillarScore - a.pillarScore
        return 0
      })

    const seen = new Set<string>()
    const cards: FieldStoryCardAsset[] = []
    const bucketCounts = { operations: 0, humans: 0, field: 0 } as Record<FieldStoryCardAsset['bucket'], number>
    let matchedToPillar = 0

    for (const entry of rankedMedia) {
      const { item, title, matchText, pillarScore } = entry
      if (!item.sourceUrl || seen.has(item.sourceUrl)) continue
      seen.add(item.sourceUrl)

      if (pillar && pillarScore > 0) matchedToPillar += 1

      const safeTitle = title || 'Field story'
      const bucket = classifyBucket(matchText)

      if (bucketCounts[bucket] >= 8) continue

      cards.push({
        id: item.id,
        title: safeTitle,
        bucket,
        description: getDescription(safeTitle, item.page?.section),
        imageUrl: item.sourceUrl,
        sourcePageTitle: item.page?.title || undefined,
        sourcePageUrl: item.page?.externalUrl || undefined
      })
      bucketCounts[bucket] += 1

      if (cards.length >= 24) break
    }

    if (!cards.length) {
      return NextResponse.json({ cards: fallbackStoryCards, source: 'fallback-filtered-empty' })
    }

    return NextResponse.json({
      cards,
      source: 'knowledge-source-media',
      projectId: goArmyProject.id,
      bucketCounts,
      selectedPillar: pillar,
      matchedToPillar
    })
  } catch (error) {
    console.error('[field-tested-assets] failed to fetch assets', error)
    return NextResponse.json({ cards: fallbackStoryCards, source: 'fallback-error' }, { status: 200 })
  }
}

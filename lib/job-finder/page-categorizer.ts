import { jobFinderPageDefinitions, JobFinderGroup } from './jobs-catalog'

export interface PageCategorization {
  slug: string
  section: string
  topicHints: string[]
  confidence: number
}

const groupToSection: Record<JobFinderGroup, string> = {
  'career-paths': 'career_paths',
  'college-medical': 'college_medical',
  'specialized-paths': 'specialized_paths',
  'career-development': 'career_development'
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((token) => token.length > 2)

const scoreOverlap = (terms: string[], candidate: string) => {
  const candidateTokens = new Set(tokenize(candidate))
  let score = 0
  for (const term of terms) {
    if (candidateTokens.has(term)) score += 1
  }
  return score
}

export function deriveSlugFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname
      .split('/')
      .filter(Boolean)
      .filter((part) => part !== 'careers-and-jobs')
      .map(slugify)
      .filter(Boolean)

    if (parts.length === 0) return 'careers-and-jobs'
    return parts[parts.length - 1]
  } catch {
    return 'unknown'
  }
}

export function categorizeGoArmyPage(params: {
  url: string
  title: string
  excerpt: string
  matchedLabels: string[]
}): PageCategorization {
  const slugFromUrl = deriveSlugFromUrl(params.url)
  const terms = tokenize([slugFromUrl, params.title, ...params.matchedLabels].join(' '))

  let bestMatch:
    | {
        slug: string
        group: JobFinderGroup
        score: number
      }
    | undefined

  for (const definition of jobFinderPageDefinitions) {
    const candidateText = [
      definition.slug,
      definition.title,
      ...definition.highlights
    ].join(' ')

    const score = scoreOverlap(terms, candidateText)
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        slug: definition.slug,
        group: definition.group,
        score
      }
    }
  }

  const confidence = Math.min(1, (bestMatch?.score || 0) / 6)
  const section = bestMatch ? groupToSection[bestMatch.group] : 'general'
  const topicHints = Array.from(
    new Set([
      ...params.matchedLabels.map((label) => slugify(label).replace(/-/g, '_')),
      slugFromUrl.replace(/-/g, '_'),
      section
    ].filter(Boolean))
  ).slice(0, 8)

  return {
    slug: bestMatch?.slug || slugFromUrl,
    section,
    topicHints,
    confidence
  }
}

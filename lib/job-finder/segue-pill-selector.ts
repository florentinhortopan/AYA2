import { SegueComponent } from '@/types/ui'
import { ScrapedJobPage } from './scraped-data'

type CaseTier = 1 | 2 | 3
type PillType = 'anticipate' | 'entice'

interface PillContext {
  message: string
  history: Array<{ role: string; content: string }>
  relevantPages: ScrapedJobPage[]
}

interface PillDef {
  label: string
  type: PillType
  intents: string[]
  tiers: CaseTier[]
  isBusiness?: boolean
}

const pillLibrary: PillDef[] = [
  { label: 'Explore careers', type: 'anticipate', intents: ['career', 'general'], tiers: [1, 2, 3] },
  { label: 'Eligibility basics', type: 'entice', intents: ['eligibility', 'general'], tiers: [1, 2, 3] },
  { label: 'Compare career paths', type: 'anticipate', intents: ['career', 'compare'], tiers: [2, 3] },
  { label: 'See job requirements', type: 'anticipate', intents: ['requirements', 'eligibility'], tiers: [2, 3] },
  { label: 'Training overview', type: 'entice', intents: ['training'], tiers: [2, 3] },
  { label: 'Benefits breakdown', type: 'entice', intents: ['benefits'], tiers: [2, 3] },
  { label: 'Find roles that fit me', type: 'anticipate', intents: ['career', 'fit'], tiers: [3] },
  { label: 'Check eligibility now', type: 'anticipate', intents: ['eligibility', 'join'], tiers: [3] },
  { label: 'Next steps to join', type: 'anticipate', intents: ['join', 'process'], tiers: [3] },
  { label: 'See training timeline', type: 'entice', intents: ['training', 'timeline'], tiers: [3] },
  { label: 'Talk to a recruiter', type: 'entice', intents: ['cta', 'general'], tiers: [1, 2, 3], isBusiness: true },
  { label: 'Schedule a recruiter chat', type: 'entice', intents: ['cta', 'join'], tiers: [3], isBusiness: true }
]

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const inferIntents = (ctx: PillContext): string[] => {
  const combined = normalize(
    [ctx.message, ...ctx.history.slice(-4).map((h) => h.content), ...ctx.relevantPages.map((p) => p.title)].join(' ')
  )
  const intents = new Set<string>()

  if (/career|job|role|path|mos|officer|enlisted/.test(combined)) intents.add('career')
  if (/eligib|qualif|require|asvab|age|join/.test(combined)) intents.add('eligibility')
  if (/benefit|pay|money|allowance|gi bill/.test(combined)) intents.add('benefits')
  if (/train|timeline|ait|basic/.test(combined)) intents.add('training')
  if (/compar|best|difference|versus|vs/.test(combined)) intents.add('compare')
  if (/fit|match|recommend/.test(combined)) intents.add('fit')
  if (/step|process|how to/.test(combined)) intents.add('process')
  if (intents.size === 0) intents.add('general')
  return [...intents]
}

const inferCaseTier = (ctx: PillContext): CaseTier => {
  const userTurns = ctx.history.filter((m) => m.role === 'user').length + 1
  const hasPageSignal = ctx.relevantPages.length > 0
  if (userTurns >= 4 && hasPageSignal) return 3
  if (hasPageSignal) return 2
  return 1
}

const scorePill = (pill: PillDef, intents: string[], tier: CaseTier) => {
  if (!pill.tiers.includes(tier)) return -1
  let score = 0
  for (const intent of intents) {
    if (pill.intents.includes(intent)) score += 2
  }
  if (pill.isBusiness) score += tier === 3 ? 1.5 : 0.5
  return score
}

export function selectSeguePills(ctx: PillContext): SegueComponent[] {
  const tier = inferCaseTier(ctx)
  const intents = inferIntents(ctx)
  const ranked = pillLibrary
    .map((pill) => ({ pill, score: scorePill(pill, intents, tier) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.pill)

  const selected: PillDef[] = []
  const add = (pill?: PillDef) => {
    if (!pill) return
    if (selected.some((p) => p.label === pill.label)) return
    selected.push(pill)
  }

  // Enforce at least one anticipate and one entice.
  add(ranked.find((p) => p.type === 'anticipate'))
  add(ranked.find((p) => p.type === 'entice'))

  // Fill to 4 max, preserving diversity and with at most 2 business pills.
  for (const pill of ranked) {
    if (selected.length >= 4) break
    const businessCount = selected.filter((p) => p.isBusiness).length
    if (pill.isBusiness && businessCount >= 2) continue
    add(pill)
  }

  // Hard fallback if scoring produced sparse results.
  if (!selected.some((p) => p.type === 'anticipate')) add(pillLibrary.find((p) => p.label === 'Explore careers'))
  if (!selected.some((p) => p.type === 'entice')) add(pillLibrary.find((p) => p.label === 'Talk to a recruiter'))

  return selected.slice(0, 4).map((pill) => ({
    type: 'segue',
    props: {
      label: pill.label,
      action: `ask:${pill.label}`,
      sentiment: pill.type === 'anticipate' ? 'informative' : 'exploratory',
      context: `case_${tier}_${pill.type}`,
      variant: pill.type === 'anticipate' ? 'outline' : 'default'
    }
  }))
}

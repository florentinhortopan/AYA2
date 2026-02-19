import { SegueComponent } from '@/types/ui'
import { ScrapedJobPage } from './scraped-data'

type CaseTier = 1 | 2 | 3
type PillType = 'anticipate' | 'entice'
const PILL_COOLDOWN_TURNS = 3

interface PillContext {
  message: string
  history: Array<{
    role: string
    content: string
    segues?: Array<{ props?: { label?: string } }>
  }>
  relevantPages: ScrapedJobPage[]
}

interface PillDef {
  key: string
  labels: string[]
  type: PillType
  intents: string[]
  tiers: CaseTier[]
  isBusiness?: boolean
}

const pillLibrary: PillDef[] = [
  {
    key: 'explore_careers',
    labels: ['Explore careers', 'Explore Army careers', 'Browse career options'],
    type: 'anticipate',
    intents: ['career', 'general'],
    tiers: [1, 2, 3]
  },
  {
    key: 'eligibility_basics',
    labels: ['Eligibility basics', 'Who is eligible?', 'Check eligibility requirements'],
    type: 'entice',
    intents: ['eligibility', 'general'],
    tiers: [1, 2, 3]
  },
  {
    key: 'compare_paths',
    labels: ['Compare career paths', 'Compare roles side by side', 'See path differences'],
    type: 'anticipate',
    intents: ['career', 'compare'],
    tiers: [2, 3]
  },
  {
    key: 'job_requirements',
    labels: ['See job requirements', 'View role requirements', 'Check job qualifications'],
    type: 'anticipate',
    intents: ['requirements', 'eligibility'],
    tiers: [2, 3]
  },
  {
    key: 'training_overview',
    labels: ['Training overview', 'How training works', 'See training structure'],
    type: 'entice',
    intents: ['training'],
    tiers: [2, 3]
  },
  {
    key: 'benefits_breakdown',
    labels: ['Benefits breakdown', 'Review pay and benefits', 'See compensation details'],
    type: 'entice',
    intents: ['benefits'],
    tiers: [2, 3]
  },
  {
    key: 'fit_match',
    labels: ['Find roles that fit me', 'Match me to roles', 'Find jobs by fit'],
    type: 'anticipate',
    intents: ['career', 'fit'],
    tiers: [3]
  },
  {
    key: 'eligibility_now',
    labels: ['Check eligibility now', 'Am I eligible to join?', 'Verify joining eligibility'],
    type: 'anticipate',
    intents: ['eligibility', 'join'],
    tiers: [3]
  },
  {
    key: 'join_steps',
    labels: ['Next steps to join', 'Show enlistment steps', 'Start the join process'],
    type: 'anticipate',
    intents: ['join', 'process'],
    tiers: [3]
  },
  {
    key: 'training_timeline',
    labels: ['See training timeline', 'View training timeline', 'What is the training timeline?'],
    type: 'entice',
    intents: ['training', 'timeline'],
    tiers: [3]
  },
  {
    key: 'recruiter_talk',
    labels: ['Talk to a recruiter', 'Connect with a recruiter', 'Ask a recruiter'],
    type: 'entice',
    intents: ['cta', 'general'],
    tiers: [1, 2, 3],
    isBusiness: true
  },
  {
    key: 'recruiter_schedule',
    labels: ['Schedule a recruiter chat', 'Book recruiter conversation', 'Set up recruiter call'],
    type: 'entice',
    intents: ['cta', 'join'],
    tiers: [3],
    isBusiness: true
  }
]

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const labelToKey = new Map<string, string>()
for (const pill of pillLibrary) {
  for (const label of pill.labels) {
    labelToKey.set(normalize(label), pill.key)
  }
}

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

interface ConversationMemory {
  shownLabels: Set<string>
  shownCountsByKey: Map<string, number>
  usedIntentCounts: Map<string, number>
  recentlyShownKeys: Set<string>
  turnsSinceLastShownByKey: Map<string, number>
}

const buildConversationMemory = (history: PillContext['history']): ConversationMemory => {
  const shownLabels = new Set<string>()
  const shownCountsByKey = new Map<string, number>()
  const usedIntentCounts = new Map<string, number>()
  const recentAssistant = history.filter((h) => h.role === 'assistant').slice(-2)
  const recentlyShownKeys = new Set<string>()
  const turnsSinceLastShownByKey = new Map<string, number>()

  const bump = (map: Map<string, number>, key: string) => {
    map.set(key, (map.get(key) || 0) + 1)
  }

  const recordLabel = (rawLabel: string, isRecent: boolean) => {
    const normalized = normalize(rawLabel)
    if (!normalized) return
    shownLabels.add(normalized)
    const key = labelToKey.get(normalized)
    if (!key) return
    bump(shownCountsByKey, key)
    const pill = pillLibrary.find((p) => p.key === key)
    const primaryIntent = pill?.intents[0]
    if (primaryIntent) bump(usedIntentCounts, primaryIntent)
    if (isRecent) recentlyShownKeys.add(key)
  }

  for (const message of history) {
    if (message.role === 'assistant' && Array.isArray(message.segues)) {
      const isRecent = recentAssistant.includes(message)
      for (const segue of message.segues) {
        const label = String(segue?.props?.label || '').trim()
        if (label) recordLabel(label, isRecent)
      }
    }
  }

  // Also treat clicked ask-pill user turns as seen.
  for (const message of history) {
    if (message.role !== 'user') continue
    const key = labelToKey.get(normalize(String(message.content || '')))
    if (!key) continue
    const pill = pillLibrary.find((p) => p.key === key)
    if (!pill) continue
    bump(shownCountsByKey, key)
    if (pill.intents[0]) bump(usedIntentCounts, pill.intents[0])
  }

  const assistantMessages = history.filter((m) => m.role === 'assistant')
  const totalAssistantTurns = assistantMessages.length
  assistantMessages.forEach((message, index) => {
    if (!Array.isArray(message.segues)) return
    for (const segue of message.segues) {
      const label = String(segue?.props?.label || '').trim()
      const key = labelToKey.get(normalize(label))
      if (!key) continue
      const turnsSince = totalAssistantTurns - index
      const previous = turnsSinceLastShownByKey.get(key)
      if (previous === undefined || turnsSince < previous) {
        turnsSinceLastShownByKey.set(key, turnsSince)
      }
    }
  })

  return {
    shownLabels,
    shownCountsByKey,
    usedIntentCounts,
    recentlyShownKeys,
    turnsSinceLastShownByKey
  }
}

const pickLabelVariant = (
  pill: PillDef,
  memory: ConversationMemory,
  allowReuse: boolean
): string | null => {
  const unseen = pill.labels.find((label) => !memory.shownLabels.has(normalize(label)))
  if (unseen) return unseen
  if (!allowReuse) return null
  // If all labels have been shown, rotate variants to keep copy freshness.
  const count = memory.shownCountsByKey.get(pill.key) || 0
  return pill.labels[count % pill.labels.length]
}

export function selectSeguePills(ctx: PillContext): SegueComponent[] {
  const tier = inferCaseTier(ctx)
  const intents = inferIntents(ctx)
  const memory = buildConversationMemory(ctx.history)
  const ranked = pillLibrary
    .map((pill) => {
      const baseScore = scorePill(pill, intents, tier)
      const alreadyShownCount = memory.shownCountsByKey.get(pill.key) || 0
      const intentPenalty = memory.usedIntentCounts.get(pill.intents[0]) || 0
      const recentPenalty = memory.recentlyShownKeys.has(pill.key) ? 3 : 0
      const turnsSinceLastShown = memory.turnsSinceLastShownByKey.get(pill.key)
      const cooldownActive =
        typeof turnsSinceLastShown === 'number' && turnsSinceLastShown <= PILL_COOLDOWN_TURNS
      const score = baseScore - alreadyShownCount * 1.75 - intentPenalty * 0.6 - recentPenalty
      return { pill, score, baseScore, cooldownActive }
    })
    .filter((item) => item.score >= 0 && !item.cooldownActive)
    .sort((a, b) => b.score - a.score)
    .map((item) => item)

  const selected: Array<{ pill: PillDef; label: string; baseScore: number }> = []
  const selectedKey = new Set<string>()
  const selectedIntents = new Set<string>()

  const tryAdd = (
    entry?: { pill: PillDef; score: number; baseScore: number; cooldownActive?: boolean },
    allowReuse = false
  ) => {
    if (!entry) return false
    const { pill, baseScore } = entry
    if (!allowReuse && entry.cooldownActive) return false
    if (selectedKey.has(pill.key)) return false
    const primaryIntent = pill.intents[0]
    if (primaryIntent && selectedIntents.has(primaryIntent) && selected.length < 3) return false
    const label = pickLabelVariant(pill, memory, allowReuse)
    if (!label) return false
    selected.push({ pill, label, baseScore })
    selectedKey.add(pill.key)
    if (primaryIntent) selectedIntents.add(primaryIntent)
    return true
  }

  // Enforce at least one anticipate and one entice.
  tryAdd(ranked.find((entry) => entry.pill.type === 'anticipate'))
  tryAdd(ranked.find((entry) => entry.pill.type === 'entice'))

  // Fill to 4 max, preserving diversity and with at most 2 business pills.
  for (const entry of ranked) {
    if (selected.length >= 4) break
    const businessCount = selected.filter((item) => item.pill.isBusiness).length
    if (entry.pill.isBusiness && businessCount >= 2) continue
    tryAdd(entry)
  }

  const fullRanked = pillLibrary
    .map((pill) => {
      const baseScore = scorePill(pill, intents, tier)
      const turnsSinceLastShown = memory.turnsSinceLastShownByKey.get(pill.key)
      const cooldownActive =
        typeof turnsSinceLastShown === 'number' && turnsSinceLastShown <= PILL_COOLDOWN_TURNS
      return { pill, score: baseScore, baseScore, cooldownActive }
    })
    .sort((a, b) => b.score - a.score)

  // If strict no-repeat is too restrictive, allow high-relevance reused pills with rotated labels.
  if (!selected.some((item) => item.pill.type === 'anticipate')) {
    const fallbackAnticipate = fullRanked.find(
      (entry) =>
        entry.pill.type === 'anticipate' &&
        entry.baseScore >= 5 &&
        (!entry.cooldownActive || entry.baseScore >= 6)
    )
    tryAdd(fallbackAnticipate, true)
  }
  if (!selected.some((item) => item.pill.type === 'entice')) {
    const fallbackEntice = fullRanked.find(
      (entry) =>
        entry.pill.type === 'entice' &&
        entry.baseScore >= 5 &&
        (!entry.cooldownActive || entry.baseScore >= 6)
    )
    tryAdd(fallbackEntice, true)
  }

  // Last-resort fill if conversation is very constrained.
  for (const entry of fullRanked) {
    if (selected.length >= 2) break
    if (entry.baseScore < 2) continue
    tryAdd(entry, true)
  }

  return selected.slice(0, 4).map(({ pill, label }) => ({
    type: 'segue',
    props: {
      label,
      action: `ask:${label}`,
      sentiment: pill.type === 'anticipate' ? 'informative' : 'exploratory',
      context: `case_${tier}_${pill.type}_${pill.key}`,
      variant: pill.type === 'anticipate' ? 'outline' : 'default'
    }
  }))
}

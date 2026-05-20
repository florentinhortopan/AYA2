import { prisma } from '@/lib/db'
import type { ContentTestPromptEval, ContentTestScore, ContentTestIssue } from '@prisma/client'

export type PromptEvalWithRelations = ContentTestPromptEval & {
  scores: ContentTestScore[]
  issues: ContentTestIssue[]
  session: {
    id: string
    participantId: string
    participantType: string
    environment: string
    status: string
    moderator: { name: string | null; email: string | null } | null
    round: { id: string; name: string } | null
  }
}

export function escapeCsvCell(value: unknown): string {
  if (value == null) return ''
  const str = typeof value === 'string' ? value : JSON.stringify(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.map(escapeCsvCell).join(',')
  const body = rows
    .map((r) => columns.map((c) => escapeCsvCell(r[c])).join(','))
    .join('\n')
  return `${header}\n${body}\n`
}

export async function fetchRawPromptEvals(filters: {
  roundId?: string | null
  sessionId?: string | null
}): Promise<PromptEvalWithRelations[]> {
  const where: any = {}
  if (filters.sessionId) where.sessionId = filters.sessionId
  if (filters.roundId) where.session = { roundId: filters.roundId }
  return prisma.contentTestPromptEval.findMany({
    where,
    orderBy: [{ sessionId: 'asc' }, { activitySlug: 'asc' }, { promptNumber: 'asc' }],
    include: {
      scores: true,
      issues: true,
      session: {
        include: {
          moderator: { select: { name: true, email: true } },
          round: { select: { id: true, name: true } },
        },
      },
    },
  }) as unknown as PromptEvalWithRelations[]
}

export function rawCsvColumns() {
  return [
    'sessionId',
    'roundName',
    'date',
    'moderatorName',
    'moderatorEmail',
    'participantId',
    'participantType',
    'environment',
    'activity',
    'promptNumber',
    'promptText',
    'promptSource',
    'useCaseCategory',
    'topicArea',
    'responseSummary',
    'participantReaction',
    'keyParticipantQuote',
    'quoteIncluded',
    'nextStepIncluded',
    'relevance',
    'completeness',
    'accuracy',
    'clarity',
    'readability',
    'authenticity',
    'trustworthiness',
    'brand_voice',
    'brand_safety',
    'quote_usefulness',
    'next_best_action',
    'sensitivity_handling',
    'overall_readiness',
    'overallReadiness',
    'issueCount',
    'topIssueType',
    'topIssueSeverity',
    'topIssueAction',
    'requiresSme',
    'requiresOfficialSource',
    'requiresRecruiterReferral',
    'moderatorNotes',
    'observerNotes',
  ]
}

export function rawCsvRow(pe: PromptEvalWithRelations) {
  const scoresByKey = Object.fromEntries(pe.scores.map((s) => [s.criterionKey, s.value]))
  const topIssue = pe.issues.sort((a, b) => severityRank(a.severity) - severityRank(b.severity))[0]
  return {
    sessionId: pe.sessionId,
    roundName: pe.session.round?.name ?? '',
    date: pe.createdAt.toISOString(),
    moderatorName: pe.session.moderator?.name ?? '',
    moderatorEmail: pe.session.moderator?.email ?? '',
    participantId: pe.session.participantId,
    participantType: pe.session.participantType,
    environment: pe.session.environment,
    activity: pe.activitySlug,
    promptNumber: pe.promptNumber,
    promptText: pe.promptText,
    promptSource: pe.promptSource,
    useCaseCategory: pe.useCaseCategory,
    topicArea: pe.topicArea ?? '',
    responseSummary: pe.responseSummary ?? '',
    participantReaction: pe.participantReaction ?? '',
    keyParticipantQuote: pe.keyParticipantQuote ?? '',
    quoteIncluded: pe.quoteIncluded,
    nextStepIncluded: pe.nextStepIncluded,
    relevance: scoresByKey['relevance'] ?? '',
    completeness: scoresByKey['completeness'] ?? '',
    accuracy: scoresByKey['accuracy'] ?? '',
    clarity: scoresByKey['clarity'] ?? '',
    readability: scoresByKey['readability'] ?? '',
    authenticity: scoresByKey['authenticity'] ?? '',
    trustworthiness: scoresByKey['trustworthiness'] ?? '',
    brand_voice: scoresByKey['brand_voice'] ?? '',
    brand_safety: scoresByKey['brand_safety'] ?? '',
    quote_usefulness: scoresByKey['quote_usefulness'] ?? '',
    next_best_action: scoresByKey['next_best_action'] ?? '',
    sensitivity_handling: scoresByKey['sensitivity_handling'] ?? '',
    overall_readiness: scoresByKey['overall_readiness'] ?? '',
    overallReadiness: pe.overallReadiness ?? '',
    issueCount: pe.issues.length,
    topIssueType: topIssue?.issueType ?? '',
    topIssueSeverity: topIssue?.severity ?? '',
    topIssueAction: topIssue?.recommendedAction ?? '',
    requiresSme: pe.issues.some((i) => i.requiresSme),
    requiresOfficialSource: pe.issues.some((i) => i.requiresOfficialSource),
    requiresRecruiterReferral: pe.issues.some((i) => i.requiresRecruiterReferral),
    moderatorNotes: pe.moderatorNotes ?? '',
    observerNotes: pe.observerNotes ?? '',
  }
}

export function severityRank(s: string) {
  switch (s) {
    case 'CRITICAL':
      return 0
    case 'HIGH':
      return 1
    case 'MEDIUM':
      return 2
    case 'LOW':
      return 3
    default:
      return 4
  }
}

export async function fetchBacklogIssues(filters: { severity?: string | null; status?: string | null }) {
  return prisma.contentTestIssue.findMany({
    where: {
      ...(filters.severity ? { severity: filters.severity as any } : {}),
      ...(filters.status ? { status: filters.status as any } : {}),
    },
    orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
    include: {
      promptEval: { select: { promptText: true, topicArea: true, activitySlug: true } },
      session: { select: { participantId: true, participantType: true, round: { select: { name: true } } } },
    },
  })
}

export function backlogCsvColumns() {
  return [
    'backlogId',
    'roundName',
    'sessionId',
    'participantId',
    'participantType',
    'prompt',
    'topic',
    'activity',
    'issueType',
    'severity',
    'description',
    'evidenceResponse',
    'evidenceParticipant',
    'recommendedAction',
    'suggestedRevision',
    'owner',
    'priority',
    'status',
    'requiresSme',
    'requiresOfficialSource',
    'requiresRecruiterReferral',
  ]
}

import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export type AggregationFilters = {
  roundId?: string | null
  participantType?: string | null
  topicArea?: string | null
}

const READINESS_WEIGHTS: Record<string, number> = {
  READY: 1,
  MOSTLY_READY: 0.75,
  NEEDS_ITERATION: 0.4,
  NOT_READY: 0,
}

export async function buildAggregations(filters: AggregationFilters = {}) {
  const sessionWhere: Prisma.ContentTestSessionWhereInput = {}
  if (filters.roundId) sessionWhere.roundId = filters.roundId
  if (filters.participantType)
    sessionWhere.participantType =
      filters.participantType as Prisma.ContentTestSessionWhereInput['participantType']

  const promptEvalWhere: Prisma.ContentTestPromptEvalWhereInput = {
    session: sessionWhere,
  }
  if (filters.topicArea)
    promptEvalWhere.topicArea =
      filters.topicArea as Prisma.ContentTestPromptEvalWhereInput['topicArea']

  const issueWhere: Prisma.ContentTestIssueWhereInput = {
    session: sessionWhere,
  }
  if (filters.topicArea)
    issueWhere.promptEval = {
      topicArea: filters.topicArea as Prisma.ContentTestPromptEvalWhereInput['topicArea'],
    }

  const [
    sessionStats,
    promptEvals,
    scores,
    issues,
    readinessCounts,
    activities,
    quoteEvals,
    nextStepEvals,
    promptEvalsForLowest,
  ] = await Promise.all([
    prisma.contentTestSession.groupBy({
      by: ['status'],
      where: sessionWhere,
      _count: { _all: true },
    }),
    prisma.contentTestPromptEval.count({ where: promptEvalWhere }),
    prisma.contentTestScore.findMany({
      where: { promptEval: promptEvalWhere },
      select: { criterionKey: true, value: true, promptEvalId: true, promptEval: { select: { activitySlug: true } } },
    }),
    prisma.contentTestIssue.findMany({
      where: issueWhere,
      include: {
        promptEval: {
          select: { topicArea: true, activitySlug: true, promptText: true, id: true },
        },
        session: {
          select: { id: true, participantId: true, participantType: true, round: { select: { name: true } } },
        },
      },
    }),
    prisma.contentTestPromptEval.groupBy({
      by: ['overallReadiness'],
      where: promptEvalWhere,
      _count: { _all: true },
    }),
    prisma.contentTestActivity.findMany({ orderBy: { order: 'asc' } }),
    prisma.contentTestQuoteEval.findMany({
      where: { promptEval: promptEvalWhere },
      select: { actionRecommendation: true, needsSmeReview: true },
    }),
    prisma.contentTestNextStepEval.findMany({
      where: { promptEval: promptEvalWhere },
      select: { nextStepNeeded: true, nextStepProvided: true, overRecruiterReliance: true },
    }),
    prisma.contentTestPromptEval.findMany({
      where: promptEvalWhere,
      include: { scores: true },
    }),
  ])

  // Readiness gauge
  const readinessTotals: Record<string, number> = {
    READY: 0,
    MOSTLY_READY: 0,
    NEEDS_ITERATION: 0,
    NOT_READY: 0,
  }
  readinessCounts.forEach((r) => {
    if (r.overallReadiness) readinessTotals[r.overallReadiness] = r._count._all
  })
  const totalReadinessScored = Object.values(readinessTotals).reduce((a, b) => a + b, 0)
  const readinessScore = totalReadinessScored
    ? Object.entries(readinessTotals).reduce(
        (sum, [k, n]) => sum + (READINESS_WEIGHTS[k] ?? 0) * n,
        0
      ) / totalReadinessScored
    : 0

  // Criterion averages
  const byCriterion = new Map<string, { sum: number; count: number }>()
  scores.forEach((s) => {
    if (!byCriterion.has(s.criterionKey))
      byCriterion.set(s.criterionKey, { sum: 0, count: 0 })
    const cur = byCriterion.get(s.criterionKey)!
    cur.sum += s.value
    cur.count += 1
  })
  const criterionAverages = Array.from(byCriterion.entries())
    .map(([key, { sum, count }]) => ({
      criterionKey: key,
      average: count ? sum / count : 0,
      count,
    }))
    .sort((a, b) => a.average - b.average)

  // Activity × criterion heatmap
  const heatmap = new Map<string, Map<string, { sum: number; count: number }>>()
  scores.forEach((s) => {
    const slug = s.promptEval.activitySlug
    if (!heatmap.has(slug)) heatmap.set(slug, new Map())
    const row = heatmap.get(slug)!
    if (!row.has(s.criterionKey)) row.set(s.criterionKey, { sum: 0, count: 0 })
    const cell = row.get(s.criterionKey)!
    cell.sum += s.value
    cell.count += 1
  })
  const heatmapRows = activities
    .filter((a) => a.capturesPrompts)
    .map((a) => {
      const row = heatmap.get(a.slug) ?? new Map()
      const cells: Record<string, number> = {}
      row.forEach((v, k) => {
        cells[k] = v.count ? v.sum / v.count : 0
      })
      return { activitySlug: a.slug, activityTitle: a.title, cells }
    })

  // Issue type frequency
  const issueTypeCounts: Record<string, number> = {}
  issues.forEach((i) => {
    issueTypeCounts[i.issueType] = (issueTypeCounts[i.issueType] ?? 0) + 1
  })
  const issueTypes = Object.entries(issueTypeCounts).map(([type, count]) => ({ type, count }))

  // Severity distribution
  const severityCounts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
  issues.forEach((i) => {
    severityCounts[i.severity] = (severityCounts[i.severity] ?? 0) + 1
  })

  // Topic risk matrix
  const topicRisk = new Map<string, { count: number; severitySum: number; prompts: Set<string> }>()
  const severityWeight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
  issues.forEach((i) => {
    const topic = i.promptEval?.topicArea ?? 'OTHER'
    if (!topicRisk.has(topic)) topicRisk.set(topic, { count: 0, severitySum: 0, prompts: new Set() })
    const cur = topicRisk.get(topic)!
    cur.count += 1
    cur.severitySum += severityWeight[i.severity] ?? 1
    if (i.promptEval?.id) cur.prompts.add(i.promptEval.id)
  })
  const topicRiskMatrix = Array.from(topicRisk.entries()).map(([topic, v]) => ({
    topic,
    issueCount: v.count,
    averageSeverity: v.count ? v.severitySum / v.count : 0,
    promptCount: v.prompts.size,
  }))

  // Lowest scoring prompts
  const lowestScoring = promptEvalsForLowest
    .map((pe) => {
      const sum = pe.scores.reduce((a, b) => a + b.value, 0)
      const avg = pe.scores.length ? sum / pe.scores.length : 0
      return { id: pe.id, promptText: pe.promptText, activitySlug: pe.activitySlug, topicArea: pe.topicArea, average: avg, scoreCount: pe.scores.length }
    })
    .filter((p) => p.scoreCount > 0)
    .sort((a, b) => a.average - b.average)
    .slice(0, 10)

  // Critical/high issues table
  const criticalHigh = issues
    .filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH')
    .slice(0, 40)
    .map((i) => ({
      id: i.id,
      sessionId: i.session?.id,
      participantId: i.session?.participantId,
      roundName: i.session?.round?.name ?? null,
      promptText: i.promptEval?.promptText ?? null,
      topicArea: i.promptEval?.topicArea ?? null,
      issueType: i.issueType,
      severity: i.severity,
      description: i.description,
      recommendedAction: i.recommendedAction,
      owner: i.owner,
      status: i.status,
    }))

  // Quote quality summary
  const quoteSummary = {
    total: quoteEvals.length,
    keep: quoteEvals.filter((q) => q.actionRecommendation === 'KEEP').length,
    lightEdit: quoteEvals.filter((q) => q.actionRecommendation === 'LIGHT_EDIT').length,
    rewrite: quoteEvals.filter((q) => q.actionRecommendation === 'REWRITE').length,
    replace: quoteEvals.filter((q) => q.actionRecommendation === 'REPLACE').length,
    remove: quoteEvals.filter((q) => q.actionRecommendation === 'REMOVE').length,
    escalate: quoteEvals.filter((q) => q.actionRecommendation === 'ESCALATE').length,
    needsSmeReview: quoteEvals.filter((q) => q.needsSmeReview).length,
  }

  // Next-best-action summary
  const nextStepSummary = {
    total: nextStepEvals.length,
    needed: nextStepEvals.filter((n) => n.nextStepNeeded).length,
    provided: nextStepEvals.filter((n) => n.nextStepProvided).length,
    overRecruiter: nextStepEvals.filter((n) => n.overRecruiterReliance).length,
  }

  // Session completion progress
  const sessionStatusCounts: Record<string, number> = {}
  sessionStats.forEach((s) => {
    sessionStatusCounts[s.status] = s._count._all
  })

  return {
    totals: {
      promptEvals,
      sessions: Object.values(sessionStatusCounts).reduce((a, b) => a + b, 0),
      criticalIssues: issues.filter((i) => i.severity === 'CRITICAL').length,
      highIssues: issues.filter((i) => i.severity === 'HIGH').length,
    },
    readiness: {
      score: readinessScore,
      counts: readinessTotals,
      total: totalReadinessScored,
    },
    criterionAverages,
    heatmap: heatmapRows,
    issueTypes,
    severityCounts,
    topicRiskMatrix,
    lowestScoring,
    criticalHigh,
    quoteSummary,
    nextStepSummary,
    sessionStatusCounts,
  }
}

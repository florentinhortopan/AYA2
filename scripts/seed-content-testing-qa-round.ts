import { loadEnvConfig } from '@next/env'
import { Prisma, PrismaClient } from '@prisma/client'
import { QA_JUNE_2026_ROUND } from '../lib/content-testing/qa-june-2026-round'

loadEnvConfig(process.cwd())

const prisma = new PrismaClient()

const COMPLETED_AT = new Date(QA_JUNE_2026_ROUND.endsAt)

type QaParticipant = (typeof QA_JUNE_2026_ROUND.participants)[number]
type QaIssue = {
  code: string
  issueType: string
  severity: string
  description: string
  recommendedAction: string
  priority: string
  requiresSme?: boolean
  requiresOfficialSource?: boolean
  requiresRecruiterReferral?: boolean
}

type QaInteraction = {
  activitySlug: string
  promptText: string
  promptSource: string
  useCaseCategory: string
  topicArea: string
  responseSummary: string
  participantReaction: string
  keyParticipantQuote?: string
  quoteIncluded?: boolean
  nextStepIncluded?: boolean
  overallReadiness: string
  issues?: readonly QaIssue[]
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function issueRequiresNextStep(interaction: QaInteraction) {
  return interaction.issues?.some((issue) => issue.issueType === 'NEXT_STEP') ?? false
}

function quoteActionFor(interaction: QaInteraction) {
  const hasQuoteIssue = interaction.issues?.some((issue) => issue.issueType === 'QUOTE_QUALITY')
  if (!hasQuoteIssue) return 'KEEP'

  const hasMediumOrHigher = interaction.issues?.some(
    (issue) =>
      issue.issueType === 'QUOTE_QUALITY' &&
      (issue.severity === 'CRITICAL' || issue.severity === 'HIGH' || issue.severity === 'MEDIUM')
  )

  return hasMediumOrHigher ? 'REPLACE' : 'LIGHT_EDIT'
}

function actionForIssue(issue: QaIssue) {
  return issue.recommendedAction as Prisma.ContentTestIssueCreateInput['recommendedAction']
}

function roundDescription() {
  return [
    QA_JUNE_2026_ROUND.description,
    '',
    'Cross-participant themes:',
    ...QA_JUNE_2026_ROUND.crossParticipantThemes.map((theme) => `- ${theme}`),
    '',
    'Highest-priority issues:',
    ...QA_JUNE_2026_ROUND.highestPriorityIssues.map((issue) => `- ${issue}`),
  ].join('\n')
}

async function ensureCatalogActivities() {
  const slugs = Array.from(
    new Set(
      QA_JUNE_2026_ROUND.participants.flatMap((participant) =>
        participant.interactions.map((interaction) => interaction.activitySlug)
      )
    )
  )

  const activities = await prisma.contentTestActivity.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true },
  })
  const found = new Set(activities.map((activity) => activity.slug))
  const missing = slugs.filter((slug) => !found.has(slug))

  if (missing.length) {
    throw new Error(
      `Missing content-testing activities: ${missing.join(', ')}. Run npm run db:seed before importing the QA round.`
    )
  }
}

async function upsertRound() {
  const existing = await prisma.contentTestRound.findFirst({
    where: { name: QA_JUNE_2026_ROUND.name },
  })

  if (existing) {
    await prisma.contentTestSession.deleteMany({
      where: { roundId: existing.id },
    })

    return prisma.contentTestRound.update({
      where: { id: existing.id },
      data: {
        description: roundDescription(),
        status: 'CLOSED',
        defaultEnvironment: 'TRANSCRIPT_REVIEW',
        startsAt: new Date(QA_JUNE_2026_ROUND.startsAt),
        endsAt: new Date(QA_JUNE_2026_ROUND.endsAt),
      },
    })
  }

  return prisma.contentTestRound.create({
    data: {
      name: QA_JUNE_2026_ROUND.name,
      description: roundDescription(),
      status: 'CLOSED',
      defaultEnvironment: 'TRANSCRIPT_REVIEW',
      startsAt: new Date(QA_JUNE_2026_ROUND.startsAt),
      endsAt: new Date(QA_JUNE_2026_ROUND.endsAt),
    },
  })
}

async function createParticipantSession(roundId: string, participant: QaParticipant) {
  const activityProgress = {
    setup: 'complete',
    'introduction-and-consent': 'complete',
    'warm-up': 'complete',
    'core-joining-the-army': 'complete',
    'core-culture-lifestyle': 'complete',
    'core-jobs-careers': 'complete',
    'core-benefits': 'complete',
    'ambiguous-questions': 'complete',
    'out-of-scope-questions': 'complete',
    'sensitive-content': 'complete',
    'adversarial-prompts': 'complete',
    'wrap-up': 'complete',
    'session-summary': 'complete',
    'review-and-complete': 'complete',
  }

  const session = await prisma.contentTestSession.create({
    data: {
      roundId,
      participantId: participant.participantId,
      participantType: participant.participantType,
      participantNotes: [
        `Source: QA/AA_All_6_Participant_Structured_Data_Doc.pdf`,
        `Recording: ${participant.recording}`,
        `Screenshots: ${participant.screenshotRange}`,
        '',
        `Participant context: ${participant.context}`,
        '',
        `Trust/authenticity expectations: ${participant.trustExpectations}`,
        '',
        `Out-of-scope/failure expectations: ${participant.fallbackExpectations}`,
      ].join('\n'),
      environment: 'TRANSCRIPT_REVIEW',
      status: 'COMPLETE',
      recordingPermission: true,
      consentConfirmed: true,
      activityProgress: asJson(activityProgress),
      sessionObjective:
        'Retrospective import of simplified Army Answers content testing interview data into the existing content-testing dashboard.',
      knownLimitations:
        'Imported from structured qualitative notes. The source document includes criteria summaries but does not include consistent participant-entered 1-5 criterion scores, so no ContentTestScore rows are created by this seed.',
      accessibilityNotes: `Screenshot mapping: ${participant.screenshotRange}`,
      startedAt: new Date(QA_JUNE_2026_ROUND.startsAt),
      completedAt: COMPLETED_AT,
    },
  })

  for (const answer of participant.warmupAnswers) {
    await prisma.contentTestWarmupAnswer.create({
      data: {
        sessionId: session.id,
        questionKey: answer.questionKey,
        answer: answer.answer,
        themeTags: [...answer.themeTags],
      },
    })
  }

  for (const [index, rawInteraction] of participant.interactions.entries()) {
    const interaction = rawInteraction as QaInteraction

    const promptEval = await prisma.contentTestPromptEval.create({
      data: {
        sessionId: session.id,
        activitySlug: interaction.activitySlug,
        promptNumber: index + 1,
        promptText: interaction.promptText,
        promptSource: interaction.promptSource as any,
        useCaseCategory: interaction.useCaseCategory as any,
        topicArea: interaction.topicArea as any,
        responseSummary: interaction.responseSummary,
        participantReaction: interaction.participantReaction,
        keyParticipantQuote: interaction.keyParticipantQuote ?? null,
        quoteIncluded: interaction.quoteIncluded ?? false,
        nextStepIncluded: interaction.nextStepIncluded ?? false,
        moderatorNotes:
          'Imported from QA structured data. Numeric scoring omitted because source contains qualitative criteria summaries, not consistent 1-5 scores.',
        observerNotes: interaction.issues?.length
          ? `Structured issue codes: ${interaction.issues.map((issue) => issue.code).join(', ')}`
          : null,
        overallReadiness: interaction.overallReadiness as any,
        completedAt: COMPLETED_AT,
      },
    })

    if (interaction.quoteIncluded) {
      const actionRecommendation = quoteActionFor(interaction)
      await prisma.contentTestQuoteEval.create({
        data: {
          promptEvalId: promptEval.id,
          authenticity: actionRecommendation === 'KEEP' ? 'YES' : 'PARTIALLY',
          value: actionRecommendation === 'KEEP' ? 'YES' : 'PARTIALLY',
          brandSafety: 'YES',
          contextSufficient: actionRecommendation === 'KEEP' ? 'YES' : 'PARTIALLY',
          marketingSpeak: false,
          preservesSoldierVoice: actionRecommendation === 'KEEP' ? 'YES' : 'PARTIALLY',
          actionRecommendation,
          needsSmeReview: interaction.issues?.some((issue) => issue.requiresSme) ?? false,
          notes: 'Derived from structured participant quote reaction; no verbatim quote text imported from source.',
        },
      })
    }

    if (interaction.nextStepIncluded || issueRequiresNextStep(interaction)) {
      await prisma.contentTestNextStepEval.create({
        data: {
          promptEvalId: promptEval.id,
          nextStepNeeded: true,
          nextStepProvided: interaction.nextStepIncluded ?? false,
          nextStepType: interaction.nextStepIncluded ? 'Talk to recruiter / related CTA' : null,
          clarity: interaction.nextStepIncluded ? 'PARTIALLY' : 'NO',
          appropriateness: interaction.nextStepIncluded ? 'PARTIALLY' : 'NO',
          overRecruiterReliance: false,
          notes: 'Derived from structured participant comments about CTA, handoff, links, or follow-up action.',
        },
      })
    }

    for (const issue of interaction.issues ?? []) {
      await prisma.contentTestIssue.create({
        data: {
          sessionId: session.id,
          promptEvalId: promptEval.id,
          issueType: issue.issueType as any,
          severity: issue.severity as any,
          description: `${issue.code}: ${issue.description}`,
          evidenceResponse: interaction.responseSummary,
          evidenceParticipant: interaction.participantReaction,
          recommendedAction: actionForIssue(issue),
          priority: issue.priority as any,
          status: 'OPEN',
          requiresSme: issue.requiresSme ?? false,
          requiresOfficialSource: issue.requiresOfficialSource ?? false,
          requiresRecruiterReferral: issue.requiresRecruiterReferral ?? false,
        },
      })
    }
  }

  await prisma.contentTestSummary.create({
    data: {
      sessionId: session.id,
      overallHelpfulness: participant.criteriaSummary,
      strongestContentMoment: participant.summary.strongestContentMoment,
      weakestContentMoment: participant.summary.weakestContentMoment,
      mostConcerningResponse: participant.summary.mostConcerningResponse,
      mostAuthenticResponse: participant.summary.mostAuthenticResponse,
      mostObviousContentGap: participant.summary.mostObviousContentGap,
      repeatedTheme: participant.summary.repeatedTheme,
      riskyResponse: participant.summary.mostConcerningResponse,
      marketingSpeakExamples: participant.trustExpectations,
      expectedTopics: participant.context,
      contentGaps: participant.summary.mostObviousContentGap,
      topImprovement: participant.summary.topRecommendations[0] ?? null,
      otherComments: participant.majorThemes.join('\n'),
      participantTrustLevel: participant.summary.participantTrustLevel,
      participantPerceivedHelpfulness: participant.summary.participantPerceivedHelpfulness,
      overallContentReadiness: participant.summary.overallContentReadiness,
      topRecommendations: asJson(participant.summary.topRecommendations),
      additionalNotes: [
        'Major themes:',
        ...participant.majorThemes.map((theme) => `- ${theme}`),
        '',
        'Criteria summary:',
        participant.criteriaSummary,
      ].join('\n'),
      completedAt: COMPLETED_AT,
    },
  })
}

async function main() {
  await ensureCatalogActivities()

  const round = await upsertRound()
  for (const participant of QA_JUNE_2026_ROUND.participants) {
    await createParticipantSession(round.id, participant)
  }

  const [sessions, promptEvals, issues] = await Promise.all([
    prisma.contentTestSession.count({ where: { roundId: round.id } }),
    prisma.contentTestPromptEval.count({ where: { session: { roundId: round.id } } }),
    prisma.contentTestIssue.count({ where: { session: { roundId: round.id } } }),
  ])

  console.log(
    `[seed:qa-round] Imported "${QA_JUNE_2026_ROUND.name}" with ${sessions} sessions, ${promptEvals} prompt evaluations, and ${issues} issues.`
  )
}

main()
  .catch((err) => {
    console.error('[seed:qa-round] Error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


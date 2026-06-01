import { ACTIVITIES, CRITERIA, type ActivityCatalogEntry } from './catalog'
import {
  CRITERION_LABELS,
  ISSUE_TYPE_LABELS,
  TOPIC_AREA_LABELS,
  PARTICIPANT_TYPE_LABELS,
  ENVIRONMENT_LABELS,
} from '@/types/content-testing'
import { escapeCsvCell } from './exports'

/**
 * Simplified note-taker intake mask, derived from the moderator tool catalog.
 *
 * Produces a portable file (Markdown or CSV) that a note-taker can fill in live
 * while listening to a tester, then hand back to an AI tool for analysis. The
 * Markdown variant front-loads machine-readable metadata + enums so a model has
 * the full scoring rubric and option sets when it parses the completed file.
 */

export interface IntakeMaskSession {
  id: string
  participantId: string
  participantType: string
  environment: string
  recordingPermission: boolean
  sessionObjective: string | null
  startedAt: Date | null
  createdAt: Date
  round: { name: string } | null
  moderator: { name: string | null; email: string | null } | null
}

const SCORING_SCALE =
  '1 = Poor / major issue; 2 = Weak / needs improvement; 3 = Acceptable / minor improvements needed; 4 = Strong; 5 = Excellent / ready as-is'

const NEXT_STEP_TYPES = [
  'Talk to recruiter',
  'Visit official page',
  'Ask follow-up question',
  'Reflect',
  'Other',
]

const PROMPT_SOURCES = ['Participant', 'Moderator', 'Observer', 'Predefined']
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low']

const BLANK_ROWS_PER_ACTIVITY = 4

function capturingActivities(): ActivityCatalogEntry[] {
  return ACTIVITIES.filter((a) => a.capturesPrompts)
}

function groupOf(a: ActivityCatalogEntry): 'core' | 'edge' {
  return a.useCaseCategory === 'CORE_PROSPECT' ? 'core' : 'edge'
}

function yamlList(items: string[]): string {
  return `[${items.map((i) => JSON.stringify(i)).join(', ')}]`
}

function metaValue(session: IntakeMaskSession | null, getter: (s: IntakeMaskSession) => string): string {
  if (!session) return '"(fill in)"'
  const v = getter(session)
  return v ? JSON.stringify(v) : '""'
}

function sessionDate(session: IntakeMaskSession): string {
  const d = session.startedAt ?? session.createdAt
  return d ? new Date(d).toISOString().slice(0, 10) : ''
}

// ---------- Markdown ----------

export function buildIntakeMaskMarkdown(session: IntakeMaskSession | null): string {
  const criteriaKeys = CRITERIA.map((c) => c.key)
  const issueTypes = Object.keys(ISSUE_TYPE_LABELS)
  const topicAreas = Object.keys(TOPIC_AREA_LABELS)

  const lines: string[] = []

  // YAML front matter — machine-readable metadata + enums for the AI.
  lines.push('---')
  lines.push('artifact: army_answers_content_testing_intake_mask')
  lines.push('role: note_taker')
  lines.push('version: 2')
  lines.push(`generated: "${new Date().toISOString()}"`)
  lines.push(`session_id: ${metaValue(session, (s) => s.id)}`)
  lines.push(`date: ${session ? JSON.stringify(sessionDate(session)) : '"(fill in)"'}`)
  lines.push(`moderator: ${metaValue(session, (s) => s.moderator?.name ?? s.moderator?.email ?? '')}`)
  lines.push('note_taker: "(fill in)"')
  lines.push(`participant_id: ${metaValue(session, (s) => s.participantId)}`)
  lines.push(
    `participant_type: ${metaValue(session, (s) => PARTICIPANT_TYPE_LABELS[s.participantType] ?? s.participantType)}`
  )
  lines.push(`testing_round: ${metaValue(session, (s) => s.round?.name ?? '')}`)
  lines.push(
    `environment: ${metaValue(session, (s) => ENVIRONMENT_LABELS[s.environment] ?? s.environment)}`
  )
  lines.push(
    `recording_available: ${session ? (session.recordingPermission ? '"Yes"' : '"No"') : '"(fill in)"'}`
  )
  lines.push(`session_objective: ${metaValue(session, (s) => s.sessionObjective ?? '')}`)
  lines.push(`scoring_scale: ${JSON.stringify(SCORING_SCALE)}`)
  lines.push(`criteria: ${yamlList(criteriaKeys)}`)
  lines.push(`severities: ${yamlList(SEVERITIES.map((s) => s.toUpperCase()))}`)
  lines.push(`issue_types: ${yamlList(issueTypes)}`)
  lines.push(`topic_areas: ${yamlList(topicAreas)}`)
  lines.push(`next_step_types: ${yamlList(NEXT_STEP_TYPES)}`)
  lines.push('---')
  lines.push('')

  lines.push('# Army Answers — Content Testing Intake Mask (Note-Taker)')
  lines.push('')
  lines.push(
    'Use this sheet while listening to the tester. Add one row per prompt the tester asks the chatbot. ' +
      'You do not have to fill every column — capture what you hear. When the session ends, this file can be ' +
      'handed to an AI tool for analysis.'
  )
  lines.push('')
  lines.push('How to score: ' + SCORING_SCALE + '. Leave blank if not observed.')
  lines.push('')
  lines.push(
    'Scores column: use compact `criterion:score` shorthand, e.g. `relevance:4 accuracy:3 clarity:5`. ' +
      'Criterion keys: ' +
      criteriaKeys.map((k) => `\`${k}\``).join(', ') +
      '.'
  )
  lines.push('')

  // Warm-up
  const warmUp = ACTIVITIES.find((a) => a.useCaseCategory === 'WARM_UP')
  if (warmUp?.warmupQuestions?.length) {
    lines.push('## Warm-Up (before testing)')
    lines.push('')
    lines.push('| Question | Notes |')
    lines.push('| --- | --- |')
    for (const q of warmUp.warmupQuestions) {
      lines.push(`| ${escapeMd(q.question)} |  |`)
    }
    lines.push('')
  }

  // Core then edge activities
  for (const group of ['core', 'edge'] as const) {
    const acts = capturingActivities().filter((a) => groupOf(a) === group)
    if (!acts.length) continue
    lines.push(group === 'core' ? '## Core Activities' : '## Edge / Adversarial Activities')
    lines.push('')
    for (const a of acts) {
      lines.push(`### ${a.title}`)
      lines.push('')
      lines.push(`Objective: ${a.objective}`)
      lines.push('')
      if (a.isSensitive) lines.push('> Sensitive topic — note tone, support, and escalation handling.')
      if (a.isAdversarial) lines.push('> Adversarial / misuse — note refusal, redirect, and brand safety.')
      if (a.isSensitive || a.isAdversarial) lines.push('')
      if (a.promptBank?.length) {
        lines.push('Predefined prompts (reference): ' + a.promptBank.map((p) => `"${p.promptText}"`).join('; '))
        lines.push('')
      }
      if (a.followUpQuestions?.length) {
        lines.push('Listen for: ' + a.followUpQuestions.map((q) => escapeMd(q)).join(' · '))
        lines.push('')
      }
      lines.push(
        '| # | Prompt asked | Source | Topic | Response summary | Scores (1-5) | Quote? | Next step? | Issue (type / severity / note) | Participant reaction & key quote | Notes |'
      )
      lines.push('| ---: | --- | --- | --- | --- | --- | :---: | :---: | --- | --- | --- |')
      for (let i = 1; i <= BLANK_ROWS_PER_ACTIVITY; i++) {
        lines.push(`| ${i} |  |  |  |  |  |  |  |  |  |  |`)
      }
      lines.push('')
    }
  }

  // Wrap-up
  const wrapUp = ACTIVITIES.find((a) => a.useCaseCategory === 'WRAP_UP')
  if (wrapUp?.wrapUpQuestions?.length) {
    lines.push('## Wrap-Up (after testing)')
    lines.push('')
    lines.push('| Question | Notes |')
    lines.push('| --- | --- |')
    for (const q of wrapUp.wrapUpQuestions) {
      lines.push(`| ${escapeMd(q.question)} |  |`)
    }
    lines.push('')
  }

  // Note-taker session impression
  lines.push('## Session Summary (note-taker impression)')
  lines.push('')
  lines.push('| Field | Notes |')
  lines.push('| --- | --- |')
  for (const field of [
    'Strongest content moment',
    'Weakest content moment',
    'Most concerning response',
    'Most authentic response',
    'Most obvious content gap',
    'Repeated pattern or theme',
    'Participant trust level (High / Medium / Low)',
    'Participant perceived helpfulness (High / Medium / Low)',
    'Overall content readiness (Ready / Mostly Ready / Needs Iteration / Not Ready)',
    'Top 3 recommended improvements',
    'Anything else the team should know',
  ]) {
    lines.push(`| ${field} |  |`)
  }
  lines.push('')

  lines.push(`<!-- severity fill options: ${SEVERITIES.join(' / ')}. prompt source: ${PROMPT_SOURCES.join(' / ')}. -->`)
  lines.push('')

  return lines.join('\n')
}

function escapeMd(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

// ---------- CSV ----------

export function intakeMaskCsvColumns(): string[] {
  return [
    'session_id',
    'date',
    'moderator',
    'note_taker',
    'participant_id',
    'participant_type',
    'testing_round',
    'environment',
    'recording_available',
    'category',
    'activity_slug',
    'activity_title',
    'prompt_number',
    'prompt_text',
    'prompt_source',
    'topic_area',
    'response_summary',
    ...CRITERIA.map((c) => c.key),
    'quote_included',
    'next_step_included',
    'next_step_type',
    'issue_type',
    'issue_severity',
    'issue_note',
    'participant_reaction',
    'key_quote',
    'notes',
  ]
}

export function buildIntakeMaskCsv(session: IntakeMaskSession | null): string {
  const columns = intakeMaskCsvColumns()
  const meta = {
    session_id: session?.id ?? '',
    date: session ? sessionDate(session) : '',
    moderator: session?.moderator?.name ?? session?.moderator?.email ?? '',
    note_taker: '',
    participant_id: session?.participantId ?? '',
    participant_type: session
      ? PARTICIPANT_TYPE_LABELS[session.participantType] ?? session.participantType
      : '',
    testing_round: session?.round?.name ?? '',
    environment: session ? ENVIRONMENT_LABELS[session.environment] ?? session.environment : '',
    recording_available: session ? (session.recordingPermission ? 'Yes' : 'No') : '',
  }

  const rows: Record<string, unknown>[] = []
  for (const a of capturingActivities()) {
    const base = {
      ...meta,
      category: groupOf(a) === 'core' ? 'Core' : 'Edge',
      activity_slug: a.slug,
      activity_title: a.title,
    }
    const predefined = a.promptBank ?? []
    let n = 1
    // Seed rows from predefined prompts so the note-taker has a starting script.
    for (const p of predefined) {
      rows.push({
        ...base,
        prompt_number: n++,
        prompt_text: p.promptText,
        prompt_source: 'Predefined',
        topic_area: p.topicArea ?? '',
      })
    }
    // Plus blank rows for prompts the tester improvises.
    for (let i = 0; i < BLANK_ROWS_PER_ACTIVITY; i++) {
      rows.push({ ...base, prompt_number: n++ })
    }
  }

  const header = columns.map(escapeCsvCell).join(',')
  const body = rows.map((r) => columns.map((c) => escapeCsvCell(r[c])).join(',')).join('\n')
  return `${header}\n${body}\n`
}

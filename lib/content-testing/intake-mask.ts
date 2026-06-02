import {
  CRITERION_LABELS,
  ISSUE_TYPE_LABELS,
  TOPIC_AREA_LABELS,
  PARTICIPANT_TYPE_LABELS,
  ENVIRONMENT_LABELS,
} from '@/types/content-testing'
import { escapeCsvCell } from './exports'

/**
 * Simplified note-taker intake mask.
 *
 * Produces a portable file (Markdown / CSV / XLSX) that a note-taker can fill in
 * live while listening to a tester, then hand back to an AI tool for analysis.
 *
 * IMPORTANT: the structure is driven by the LIVE catalog passed in from the
 * database (active activities + criteria), not a hardcoded list, so it always
 * matches the activities currently configured for the session. Retired
 * activities (isActive=false) never appear.
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

/** Subset of a ContentTestActivity row needed to scaffold the mask. */
export interface IntakeActivity {
  slug: string
  order: number
  title: string
  objective: string
  useCaseCategory: string
  capturesPrompts: boolean
  isSensitive: boolean
  isAdversarial: boolean
  followUpQuestions: string[] | null
  warmupQuestions: Array<{ key: string; question: string }> | null
  wrapUpQuestions: Array<{ key: string; question: string }> | null
  promptBank: Array<{ promptText: string; topicArea: string | null }>
}

export interface IntakeCriterion {
  key: string
  label: string
}

export interface IntakeCatalog {
  activities: IntakeActivity[]
  criteria: IntakeCriterion[]
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
const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const YES_NO = ['Yes', 'No']

const BLANK_ROWS_PER_ACTIVITY = 4

function capturingActivities(catalog: IntakeCatalog): IntakeActivity[] {
  return catalog.activities.filter((a) => a.capturesPrompts).sort((a, b) => a.order - b.order)
}

function groupOf(a: IntakeActivity): 'core' | 'edge' {
  return a.useCaseCategory === 'CORE_PROSPECT' ? 'core' : 'edge'
}

function findByCategory(catalog: IntakeCatalog, category: string): IntakeActivity | undefined {
  return catalog.activities.find((a) => a.useCaseCategory === category)
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

function escapeMd(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

// ---------- Shared option lists ----------

export function intakeValidation(catalog: IntakeCatalog) {
  return {
    criteriaKeys: catalog.criteria.map((c) => c.key),
    scoreValues: ['1', '2', '3', '4', '5'],
    yesNo: YES_NO,
    promptSources: PROMPT_SOURCES,
    severities: SEVERITIES,
    issueTypes: Object.keys(ISSUE_TYPE_LABELS),
    topicAreas: Object.keys(TOPIC_AREA_LABELS),
    nextStepTypes: NEXT_STEP_TYPES,
    scoringScale: SCORING_SCALE,
  }
}

// ---------- Markdown ----------

export function buildIntakeMaskMarkdown(session: IntakeMaskSession | null, catalog: IntakeCatalog): string {
  const criteriaKeys = catalog.criteria.map((c) => c.key)
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
  lines.push(`severities: ${yamlList(SEVERITIES)}`)
  lines.push(`issue_types: ${yamlList(issueTypes)}`)
  lines.push(`topic_areas: ${yamlList(topicAreas)}`)
  lines.push(`next_step_types: ${yamlList(NEXT_STEP_TYPES)}`)
  lines.push(`activities: ${yamlList(capturingActivities(catalog).map((a) => a.title))}`)
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
  const warmUp = findByCategory(catalog, 'WARM_UP')
  if (warmUp?.warmupQuestions?.length) {
    lines.push('## Warm-Up (before testing)')
    lines.push('')
    lines.push('| Question | Notes |')
    lines.push('| --- | --- |')
    for (const q of warmUp.warmupQuestions) lines.push(`| ${escapeMd(q.question)} |  |`)
    lines.push('')
  }

  // Core then edge activities
  for (const group of ['core', 'edge'] as const) {
    const acts = capturingActivities(catalog).filter((a) => groupOf(a) === group)
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
  const wrapUp = findByCategory(catalog, 'WRAP_UP')
  if (wrapUp?.wrapUpQuestions?.length) {
    lines.push('## Wrap-Up (after testing)')
    lines.push('')
    lines.push('| Question | Notes |')
    lines.push('| --- | --- |')
    for (const q of wrapUp.wrapUpQuestions) lines.push(`| ${escapeMd(q.question)} |  |`)
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

  lines.push(`<!-- severity options: ${SEVERITIES.join(' / ')}. prompt source: ${PROMPT_SOURCES.join(' / ')}. -->`)
  lines.push('')

  return lines.join('\n')
}

// ---------- Tabular (CSV / XLSX) ----------

export function intakeMaskColumns(catalog: IntakeCatalog): string[] {
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
    ...catalog.criteria.map((c) => c.key),
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

/** Human-friendly spreadsheet headers, keyed by column id. */
export function intakeColumnLabels(catalog: IntakeCatalog): Record<string, string> {
  return {
    session_id: 'Session ID',
    date: 'Date',
    moderator: 'Moderator',
    note_taker: 'Note-taker',
    participant_id: 'Participant ID',
    participant_type: 'Participant Type',
    testing_round: 'Testing Round',
    environment: 'Environment',
    recording_available: 'Recording?',
    category: 'Category',
    activity_slug: 'Activity Slug',
    activity_title: 'Activity',
    prompt_number: '#',
    prompt_text: 'Prompt Asked',
    prompt_source: 'Source',
    topic_area: 'Topic',
    response_summary: 'Response Summary',
    ...Object.fromEntries(catalog.criteria.map((c) => [c.key, c.label ?? CRITERION_LABELS[c.key] ?? c.key])),
    quote_included: 'Quote Included?',
    next_step_included: 'Next Step Included?',
    next_step_type: 'Next Step Type',
    issue_type: 'Issue Type',
    issue_severity: 'Issue Severity',
    issue_note: 'Issue Note',
    participant_reaction: 'Participant Reaction',
    key_quote: 'Key Quote',
    notes: 'Notes',
  }
}

function intakeMeta(session: IntakeMaskSession | null): Record<string, string> {
  return {
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
}

/**
 * One scaffolded row per prompt across every capturing activity. Predefined
 * prompts seed a starting script; additional blank rows let the note-taker
 * record improvised prompts.
 */
export function buildIntakeMaskRows(
  session: IntakeMaskSession | null,
  catalog: IntakeCatalog
): Record<string, unknown>[] {
  const meta = intakeMeta(session)
  const rows: Record<string, unknown>[] = []
  for (const a of capturingActivities(catalog)) {
    const base = {
      ...meta,
      category: groupOf(a) === 'core' ? 'Core' : 'Edge',
      activity_slug: a.slug,
      activity_title: a.title,
    }
    let n = 1
    for (const p of a.promptBank ?? []) {
      rows.push({
        ...base,
        prompt_number: n++,
        prompt_text: p.promptText,
        prompt_source: 'Predefined',
        topic_area: p.topicArea ?? '',
      })
    }
    for (let i = 0; i < BLANK_ROWS_PER_ACTIVITY; i++) {
      rows.push({ ...base, prompt_number: n++ })
    }
  }
  return rows
}

/** Key/value pairs for the spreadsheet "Session Info" sheet. */
export function intakeMaskMetaPairs(session: IntakeMaskSession | null): Array<[string, string]> {
  const meta = intakeMeta(session)
  return [
    ['Session ID', meta.session_id],
    ['Date', meta.date],
    ['Moderator', meta.moderator],
    ['Note-taker', meta.note_taker],
    ['Participant ID', meta.participant_id],
    ['Participant Type', meta.participant_type],
    ['Testing Round', meta.testing_round],
    ['Environment', meta.environment],
    ['Recording available?', meta.recording_available],
    ['Session objective', session?.sessionObjective ?? ''],
  ]
}

export function buildIntakeMaskCsv(session: IntakeMaskSession | null, catalog: IntakeCatalog): string {
  const columns = intakeMaskColumns(catalog)
  const rows = buildIntakeMaskRows(session, catalog)
  const header = columns.map(escapeCsvCell).join(',')
  const body = rows.map((r) => columns.map((c) => escapeCsvCell(r[c])).join(',')).join('\n')
  return `${header}\n${body}\n`
}

import { QA_JUNE_2026_ROUND } from './qa-june-2026-round'

export type QaInsightsSection =
  | 'Overview'
  | 'Method'
  | 'Themes'
  | 'Findings'
  | 'Recommendations'
  | 'Wrap-up'
  | 'Appendix'

export type QaInsightsSlideKind =
  | 'title'
  | 'overview'
  | 'method'
  | 'theme'
  | 'finding'
  | 'matrix'
  | 'recommendation'
  | 'roadmap'
  | 'evidence'
  | 'closing'

export type QaInsightsVisual =
  | 'hero'
  | 'executiveSummary'
  | 'stats'
  | 'themeIndex'
  | 'themeData'
  | 'themeCards'
  | 'contentGapMap'
  | 'contentGapAnalysis'
  | 'deepDiveMatrix'
  | 'riskMatrix'
  | 'answerModel'
  | 'roadmap'
  | 'evidenceGrid'

export interface QaEvidenceItem {
  participant?: string
  title?: string
  quote: string
  context?: string
}

export interface QaInsightStat {
  label: string
  value: string
  note?: string
}

export interface QaInsightTheme {
  label: string
  title: string
  finding: string
  implication: string
  recommendation: string
}

export interface QaThemeSignal {
  label: string
  value: number
  total: number
  note: string
}

export interface QaThemeIssueCluster {
  label: string
  value: number
  note: string
}

export interface QaRoadmapColumn {
  label: string
  title: string
  items: string[]
}

export interface QaRiskItem {
  area: string
  severity: 'Critical' | 'High' | 'Medium'
  issue: string
  recommendation: string
}

export interface QaDeepDiveExample {
  label: string
  prompt: string
  answer?: string
  evidence: string
  takeaway: string
  screenshots: string
}

export interface QaDeepDive {
  type: 'Validation' | 'Enhancement'
  goal: string
  examples: QaDeepDiveExample[]
  screenshots: string[]
  issueRecall: string[]
  presenterNotes: string[]
}

export interface QaInsightsSlide {
  id: string
  section: QaInsightsSection
  kind: QaInsightsSlideKind
  eyebrow?: string
  title: string
  subtitle?: string
  body?: string
  bullets?: string[]
  visual?: QaInsightsVisual
  evidence?: QaEvidenceItem[]
  stats?: QaInsightStat[]
  themes?: QaInsightTheme[]
  themeSignals?: QaThemeSignal[]
  issueClusters?: QaThemeIssueCluster[]
  risks?: QaRiskItem[]
  roadmap?: QaRoadmapColumn[]
  recommendations?: string[]
  deepDive?: QaDeepDive
}

type QaRoundIssue = {
  issueType: string
  severity: string
}

type QaRoundInteraction = {
  quoteIncluded?: boolean
  nextStepIncluded?: boolean
  issues?: readonly QaRoundIssue[]
}

type QaRoundParticipant = {
  participantId: string
  summary: {
    mostConcerningResponse: string
    repeatedTheme: string
  }
  interactions: readonly QaRoundInteraction[]
}

const participants = QA_JUNE_2026_ROUND.participants as readonly QaRoundParticipant[]
const interactions = participants.flatMap((participant) => participant.interactions)
const issues = interactions.flatMap((interaction) => interaction.issues ?? [])
const highIssues = issues.filter((issue) => issue.severity === 'HIGH' || issue.severity === 'CRITICAL')
const highIssueInteractions = interactions.filter((interaction) =>
  (interaction.issues ?? []).some((issue) => issue.severity === 'HIGH' || issue.severity === 'CRITICAL')
)
const quoteInteractions = interactions.filter((interaction) => interaction.quoteIncluded)
const nextStepInteractions = interactions.filter((interaction) => interaction.nextStepIncluded)
const issueCount = (issueTypes: string[]) => issues.filter((issue) => issueTypes.includes(issue.issueType)).length

export const QA_THEME_ISSUE_CLUSTERS: QaThemeIssueCluster[] = [
  {
    label: 'Proof gaps',
    value: issueCount([
      'COMPLETENESS',
      'CLARITY',
      'CONTENT_GAP',
      'SENSITIVITY_HANDLING',
      'TRUST',
      'ACCURACY',
      'OUT_OF_SCOPE_HANDLING',
    ]),
    note: 'Directness, factual completeness, source trust, accuracy, and sensitive-topic handling.',
  },
  {
    label: 'Human voice gaps',
    value: issueCount(['QUOTE_QUALITY', 'AUTHENTICITY']),
    note: 'Soldier quote relevance, specificity, repetition, attribution context, and authenticity.',
  },
  {
    label: 'Routing gaps',
    value: issueCount(['NEXT_STEP']),
    note: 'Answers that needed clearer CTAs, source paths, routing, or handoff.',
  },
  {
    label: 'Tone / brand safety gaps',
    value: issueCount(['TONE', 'BRAND_SAFETY']),
    note: 'Language that felt too casual, too promotional, or risky for the topic. Lower is better.',
  },
]

export const QA_THEME_SIGNALS: QaThemeSignal[] = [
  {
    label: 'Prompts with tagged issues',
    value: interactions.filter((interaction) => (interaction.issues?.length ?? 0) > 0).length,
    total: interactions.length,
    note: '34 of 41 prompt evaluations carried at least one issue tag, giving the theme work a repeated-pattern base.',
  },
  {
    label: 'Issues rated high / critical',
    value: highIssues.length,
    total: issues.length,
    note: '13 of 42 issue tags were High or Critical, led by pay, proof, safety, and audience-intent gaps.',
  },
  {
    label: 'Answers containing quotes',
    value: quoteInteractions.length,
    total: interactions.length,
    note: '17 of 41 responses used a Soldier quote; fit, repetition, and context determined whether it helped trust.',
  },
  {
    label: 'Answers with next-step CTA',
    value: nextStepInteractions.length,
    total: interactions.length,
    note: 'Only 4 of 41 responses included a clear route forward, source path, CTA, or handoff.',
  },
]

export const QA_INSIGHTS_STATS: QaInsightStat[] = [
  {
    label: 'Participants',
    value: String(participants.length),
    note: 'All six structured interview records were imported from the June 11 content testing round.',
  },
  {
    label: 'Prompts analyzed',
    value: `${interactions.length}/${interactions.length}`,
    note: 'Every prompt evaluation was mapped back into the existing content testing workflow.',
  },
  {
    label: 'Prompts with gaps',
    value: `${QA_THEME_SIGNALS[0].value}/${QA_THEME_SIGNALS[0].total}`,
    note: 'Most findings came from repeated issue patterns rather than isolated comments.',
  },
  {
    label: 'High-risk prompts',
    value: `${highIssueInteractions.length}/${interactions.length}`,
    note: 'Prompt-level risk concentrated around facts, proof, safety, and audience intent.',
  },
]

export const QA_INSIGHTS_THEMES: QaInsightTheme[] = [
  {
    label: 'Theme 01',
    title: 'Trust requires proof',
    finding: 'Users are not just evaluating whether the bot answers. They are evaluating whether the answer is credible enough to act on.',
    implication: 'Uncited, vague, evasive, or overly polished answers push users toward Google or a human.',
    recommendation: 'Lead with direct answers, show official sources, state limits, and route to human support when stakes are high.',
  },
  {
    label: 'Theme 02',
    title: 'Relevance is the experience',
    finding: 'The largest gap is answer orchestration: detecting intent, selecting the right fact, matching emotional context, and routing the user.',
    implication: 'A technically topical answer still fails when it misses the real user intent.',
    recommendation: 'Create stronger intent classes for pay, commitment, parent/influencer, Basic Training anxiety, careers, safety, and handoff.',
  },
  {
    label: 'Theme 03',
    title: 'Real voices must feel truly human',
    finding: 'Soldier quotes are powerful when specific, relevant, plainspoken, and clearly real.',
    implication: 'Repeated, generic, over-polished, or mismatched quotes make the experience feel more artificial.',
    recommendation: 'Add quote relevance thresholds, metadata, suppression rules, and no-quote fallback logic.',
  },
  {
    label: 'Theme 04',
    title: 'The bot should guide the journey',
    finding: 'Users treat Army Answers as the start of a larger decision journey, not the final destination.',
    implication: 'Answers without next steps can feel like dead ends, especially for nuanced or personal questions.',
    recommendation: 'Add contextual CTAs, source links, site routing, recruiter handoff, and audience-aware flows.',
  },
]

export const QA_RISK_ITEMS: QaRiskItem[] = [
  {
    area: 'Pay',
    severity: 'Critical',
    issue: 'Users asked for first-year pay, annual pay, and direct numbers; responses often stayed generic or assumed the wrong path.',
    recommendation: 'Give a number or range immediately, distinguish base pay from total compensation, and link to Money & Pay.',
  },
  {
    area: 'Service commitment',
    severity: 'Critical',
    issue: 'Answers over-indexed on 20-year retirement instead of minimum or typical first commitments.',
    recommendation: 'Distinguish initial contract, total obligation, Reserve/Guard/Active, officer/enlisted, and retirement paths.',
  },
  {
    area: 'Sources and citations',
    severity: 'Critical',
    issue: 'Participants repeatedly wanted links, citations, provenance, or paths to relevant GoArmy pages.',
    recommendation: 'Add a Sources / Learn more module for high-stakes topics.',
  },
  {
    area: 'Sensitive safety',
    severity: 'Critical',
    issue: 'Generic reassurance was insufficient for sexual assault, harassment, safety, and mental health topics.',
    recommendation: 'Use approved sensitive-topic templates with direct acknowledgment, limits, official resources, and handoff.',
  },
  {
    area: 'Influencer intent',
    severity: 'High',
    issue: 'Parent questions were sometimes interpreted literally as childcare questions or answered to the prospect.',
    recommendation: 'Infer audience mode or ask a clarifying question before answering.',
  },
  {
    area: 'Quote relevance',
    severity: 'High',
    issue: 'Quotes built trust when relevant, but weak matches, repetition, acronyms, or lack of context reduced credibility.',
    recommendation: 'Use relevance thresholds, suppress repeated quotes, and add MOS/job, years served, and attribution context.',
  },
]

const answerModel = [
  'Answer directly',
  'Show the source',
  'Explain caveats',
  'Add human perspective when useful',
  'Route to the next best step',
]

const roadmap: QaRoadmapColumn[] = [
  {
    label: 'P0',
    title: 'Fix before launch',
    items: [
      'Pay response template with concrete salary examples.',
      'Service commitment template with 2-6 years and 8-year MSO/IRR explanation.',
      'Basic Training template with 10-week structure and schedule.',
      'Source link module for high-stakes topics.',
      'Sensitive-topic fallback and handoff framework.',
    ],
  },
  {
    label: 'P1',
    title: 'Next sprint',
    items: [
      'Quote relevance threshold.',
      'Quote metadata and rank clarity.',
      'Reduce repeated quotes and repeated pills.',
      'Parent/influencer intent handling.',
      'Career routing to All Jobs, Career Match, and category pages.',
    ],
  },
  {
    label: 'P2',
    title: 'Future enhancement',
    items: [
      'Soldier profile expansion.',
      'Session memory or saved conversation.',
      'Audience-mode personalization.',
      'Answer confidence display.',
      'Round 2 validation plan after fixes ship.',
    ],
  },
]

const participantEvidence: QaEvidenceItem[] = participants.map((participant) => ({
  participant: participant.participantId,
  quote: participant.summary.mostConcerningResponse,
  context: participant.summary.repeatedTheme,
}))

export const QA_INSIGHTS_SLIDES: QaInsightsSlide[] = [
  {
    id: 'title',
    section: 'Overview',
    kind: 'title',
    visual: 'hero',
    eyebrow: 'Army Answers Content Testing',
    title: 'Chatbot -> trusted guide',
    subtitle: 'June 2026 QA insights for making Army Answers more direct, verifiable, relevant, and useful.',
    stats: [
      { label: 'Core message', value: 'Trust is earned', note: 'Users engage when answers are direct, sourced, and connected to the next step.' },
    ],
  },
  {
    id: 'executive-summary',
    section: 'Overview',
    kind: 'finding',
    visual: 'executiveSummary',
    eyebrow: 'Executive summary',
    title: 'Concept works. Answers need muscle.',
    body: 'Participants were willing to engage, especially when answers felt direct, useful, bounded, and grounded in real Soldier perspectives. Trust dropped when answers were vague, uncited, mismatched to intent, or too generic.',
    bullets: [
      'Facts are the foundation; Soldier voices are the differentiator.',
      'Users forgive nuance, but not vagueness.',
      'The bot needs to behave like a GoArmy decision guide, not a general chatbot.',
    ],
    evidence: [
      {
        participant: 'Shawn',
        quote: 'Pay answer incorrectly assumed junior Officer and made him want to double-check the bot externally.',
        context: 'Wrong assumptions are highly damaging on factual/high-intent questions.',
      },
      {
        participant: 'Rachel',
        quote: 'Service length answers implied 20 years or officer-specific paths rather than minimums.',
        context: 'Users need the contract baseline before retirement or career framing.',
      },
    ],
  },
  {
    id: 'what-we-did',
    section: 'Overview',
    kind: 'overview',
    visual: 'stats',
    eyebrow: 'What we did',
    title: 'Interviews -> QA system',
    body: 'The moderator simplified the interview flow, but the research still maps cleanly to the existing content testing objectives: trust, accuracy, brand voice, tone, readiness, and next-step usefulness.',
    stats: QA_INSIGHTS_STATS,
    bullets: [
      'Structured six participant sessions from transcript and image evidence.',
      'Mapped interactions into the existing dashboard model.',
      'Tagged prompt-level issues by severity and recommended action.',
      'Compared findings against GoArmy.com content coverage and AI chatbot standards.',
    ],
  },
  {
    id: 'how-we-did-it',
    section: 'Method',
    kind: 'method',
    visual: 'stats',
    eyebrow: 'How we did it',
    title: '4 evidence streams -> action',
    body: 'The work combined participant testing, structured transcript/image findings, GoArmy.com content gap analysis, and responsible AI UX standards.',
    stats: [
      { label: 'Evidence stream 1', value: 'Testing', note: 'What people asked, trusted, disliked, misunderstood, or wanted next.' },
      { label: 'Evidence stream 2', value: 'Structured QA', note: 'Interaction mapping, quote reactions, CTA issues, and prompt failures.' },
      { label: 'Evidence stream 3', value: 'Site gaps', note: 'Where GoArmy content exists but was not surfaced or framed correctly.' },
      { label: 'Evidence stream 4', value: 'AI standards', note: 'Transparency, reliability, human oversight, user control, and accountability.' },
    ],
  },
  {
    id: 'theme-data-signals',
    section: 'Themes',
    kind: 'theme',
    visual: 'themeData',
    eyebrow: 'Theme signals',
    title: 'Signals = themes',
    subtitle: 'Issue tags and response-level signals show the pattern behind the synthesis.',
    themeSignals: QA_THEME_SIGNALS,
    issueClusters: QA_THEME_ISSUE_CLUSTERS,
  },
  {
    id: 'theme-system',
    section: 'Themes',
    kind: 'theme',
    visual: 'themeIndex',
    eyebrow: 'Main themes',
    title: '4 themes + 1 job: earn trust',
    subtitle: 'Use this as the index for the next four slides.',
    themes: QA_INSIGHTS_THEMES,
  },
  ...QA_INSIGHTS_THEMES.map((theme, index): QaInsightsSlide => ({
    id: `theme-${index + 1}`,
    section: 'Themes',
    kind: 'theme',
    visual: 'themeCards',
    eyebrow: theme.label,
    title: theme.title,
    body: theme.finding,
    themes: [theme],
    evidence: participantEvidence.slice(index, index + 2),
  })),
  {
    id: 'site-vs-bot',
    section: 'Findings',
    kind: 'finding',
    visual: 'contentGapMap',
    eyebrow: 'Content gap analysis',
    title: 'Content exists. Retrieval lags.',
    body: 'The main gap is not content absence. It is orchestration: answer order, source linking, response templates, quote matching, and next-step routing.',
    stats: [
      {
        label: 'Proof / source gaps',
        value: `${QA_THEME_ISSUE_CLUSTERS[0].value}/${issues.length}`,
        note: 'Directness, source trust, accuracy, and factual completeness tags.',
      },
      {
        label: 'Routing gaps',
        value: `${QA_THEME_ISSUE_CLUSTERS[2].value}/${issues.length}`,
        note: 'Prompts that needed clearer CTAs, source paths, or handoff.',
      },
      {
        label: 'Next-step coverage',
        value: `${nextStepInteractions.length}/${interactions.length}`,
        note: 'Only a small share of responses gave a concrete path forward.',
      },
    ],
    bullets: [
      'Basic Training answers buried or omitted the baseline: duration, phases, schedule, and practical expectations.',
      'Numeric pay questions received generic compensation framing instead of the number or range users asked for.',
      'Service commitment answers over-indexed on 20-year retirement and skipped initial contract context.',
      'Career answers described broad options but left users without clear MOS, job-family, or site pathways.',
    ],
    evidence: [
      {
        participant: 'Paul',
        quote: 'Career answers need links into careers, MOS/job details, and site pathways.',
        context: 'Users expected Army Answers to behave like a search assistant with sources.',
      },
      {
        participant: 'Shawn',
        quote: 'Pay answer incorrectly assumed junior Officer and avoided a number.',
        context: 'High-intent factual questions need immediate numbers and source links.',
      },
      {
        participant: 'Rachel',
        quote: 'Service length answer overemphasized 20-year pension instead of contract chunks.',
        context: 'Users need minimum or typical commitment framing before retirement paths.',
      },
    ],
  },
  {
    id: 'highest-risk-factual-gaps',
    section: 'Findings',
    kind: 'matrix',
    visual: 'riskMatrix',
    eyebrow: 'Priority findings 01',
    title: 'Facts + proof = trust',
    body: 'These are the areas where users most need a direct answer, a clear source, and a concrete next step.',
    risks: QA_RISK_ITEMS.slice(0, 3),
  },
  {
    id: 'highest-risk-experience-gaps',
    section: 'Findings',
    kind: 'matrix',
    visual: 'riskMatrix',
    eyebrow: 'Priority findings 02',
    title: 'Context + care = credibility',
    body: 'These risks are less about having content and more about matching context, sensitivity, and credibility.',
    risks: QA_RISK_ITEMS.slice(3),
  },
  {
    id: 'answer-model',
    section: 'Recommendations',
    kind: 'recommendation',
    visual: 'answerModel',
    eyebrow: 'Recommended response model',
    title: 'Answer + source + next step',
    body: 'For high-consideration topics, the ideal answer should be useful before it is inspirational.',
    recommendations: answerModel,
  },
  {
    id: 'roadmap',
    section: 'Recommendations',
    kind: 'roadmap',
    visual: 'roadmap',
    eyebrow: 'Roadmap',
    title: 'Fix trust first',
    body: 'Start with direct factual templates and source links, then improve quote intelligence and audience-aware routing.',
    roadmap,
  },
  {
    id: 'deliverables',
    section: 'Recommendations',
    kind: 'recommendation',
    visual: 'stats',
    eyebrow: 'Recommended deliverables',
    title: 'Ship the findings',
    recommendations: [
      'Jira-ready backlog with epics, stories, and acceptance criteria.',
      'Golden answer library for high-risk and high-frequency questions.',
      'Content gap matrix connecting user intent, GoArmy sources, fix type, and priority.',
      'Round 2 validation plan to test whether trust, clarity, relevance, and CTA usefulness improve.',
    ],
  },
  {
    id: 'wrap-up',
    section: 'Wrap-up',
    kind: 'closing',
    visual: 'hero',
    eyebrow: 'Strategic framing',
    title: 'From bot to decision guide',
    body: 'The foundation is strong: official GoArmy content, real Soldier perspectives, and a conversational interface users are willing to try. The opportunity is to answer directly, prove the answer, use human stories selectively, and route users to the next best step.',
  },
  {
    id: 'appendix-evidence',
    section: 'Appendix',
    kind: 'evidence',
    visual: 'evidenceGrid',
    eyebrow: 'Appendix',
    title: 'Evidence receipts',
    subtitle: 'Use this as a proof layer during stakeholder discussion.',
    evidence: participantEvidence,
  },
]

export const QA_INSIGHTS_SUMMARY = QA_INSIGHTS_SLIDES
  .filter((slide) => slide.section !== 'Appendix')
  .map((slide, index) => `${index + 1}. ${slide.title}`)
  .join('\n')

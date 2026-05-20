import { z } from 'zod'

export const RoundStatusEnum = z.enum(['PLANNED', 'ACTIVE', 'CLOSED', 'ARCHIVED'])
export const SessionStatusEnum = z.enum(['DRAFT', 'IN_PROGRESS', 'PAUSED', 'COMPLETE', 'ARCHIVED'])
export const ParticipantTypeEnum = z.enum([
  'INTERNAL_TESTER',
  'PROSPECT_LIKE',
  'PARENT_GUARDIAN',
  'EDUCATOR',
  'INFLUENCER',
  'RECRUITER',
  'CONTENT_REVIEWER',
  'STAKEHOLDER',
  'OTHER',
])
export const EnvironmentEnum = z.enum([
  'PROTOTYPE',
  'STAGING',
  'PRODUCTION',
  'TRANSCRIPT_REVIEW',
  'STATIC_RESPONSE_REVIEW',
  'OTHER',
])
export const SeverityEnum = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
export const ReadinessEnum = z.enum(['READY', 'MOSTLY_READY', 'NEEDS_ITERATION', 'NOT_READY'])
export const ActionRecommendationEnum = z.enum([
  'KEEP',
  'EDIT',
  'REWRITE',
  'REPLACE_QUOTE',
  'ADD_CONTENT',
  'REMOVE_CONTENT',
  'ESCALATE_FOR_REVIEW',
  'VALIDATE_WITH_SME',
  'ADD_RECRUITER_REFERRAL',
  'ADD_OFFICIAL_SOURCE_REFERENCE',
  'ADD_NEXT_STEP',
  'SIMPLIFY_LANGUAGE',
  'MAKE_MORE_AUTHENTIC',
  'REDUCE_MARKETING_LANGUAGE',
  'OTHER',
])
export const QuoteActionEnum = z.enum(['KEEP', 'LIGHT_EDIT', 'REWRITE', 'REPLACE', 'REMOVE', 'ESCALATE'])
export const TrinaryEnum = z.enum(['YES', 'NO', 'PARTIALLY'])
export const LevelEnum = z.enum(['HIGH', 'MEDIUM', 'LOW'])
export const UseCaseCategoryEnum = z.enum([
  'CORE_PROSPECT',
  'INFLUENCER_SUPPORTER',
  'QUOTE_EVALUATION',
  'BRAND_VOICE',
  'ACCURACY_COMPLETENESS',
  'AMBIGUOUS_EDGE_CASE',
  'OUT_OF_SCOPE',
  'SENSITIVE',
  'ADVERSARIAL',
  'WARM_UP',
  'WRAP_UP',
  'OTHER',
])
export const TopicAreaEnum = z.enum([
  'JOINING',
  'BASIC_TRAINING',
  'DAILY_LIFE',
  'JOBS',
  'CAREERS',
  'BENEFITS',
  'EDUCATION',
  'FAMILY',
  'SAFETY',
  'ELIGIBILITY',
  'MEDICAL',
  'LEGAL',
  'DEPLOYMENT',
  'CULTURE',
  'MENTAL_HEALTH',
  'HARASSMENT_OR_MISCONDUCT',
  'RECRUITER_PROCESS',
  'OTHER',
])
export const IssueTypeEnum = z.enum([
  'ACCURACY',
  'CONTENT_GAP',
  'TONE',
  'BRAND_SAFETY',
  'QUOTE_QUALITY',
  'CLARITY',
  'COMPLETENESS',
  'NEXT_STEP',
  'SENSITIVITY_HANDLING',
  'OUT_OF_SCOPE_HANDLING',
  'AUTHENTICITY',
  'TRUST',
  'READABILITY',
  'OVERPROMISING',
  'MARKETING_SPEAK',
  'POLICY_RISK',
  'PRIVACY_RISK',
  'OTHER',
])
export const IssueStatusEnum = z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'WONT_FIX'])
export const IssuePriorityEnum = z.enum(['QUICK_WIN', 'PHASE_1', 'PHASE_2', 'BACKLOG'])
export const PromptSourceEnum = z.enum(['PARTICIPANT', 'MODERATOR', 'OBSERVER', 'PREDEFINED'])

export const createRoundSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullish(),
  status: RoundStatusEnum.optional(),
  defaultEnvironment: EnvironmentEnum.optional(),
  startsAt: z.string().datetime().nullish(),
  endsAt: z.string().datetime().nullish(),
})

export const updateRoundSchema = createRoundSchema.partial()

export const createSessionSchema = z.object({
  roundId: z.string().nullish(),
  participantId: z.string().min(1).max(120),
  participantType: ParticipantTypeEnum.optional(),
  participantNotes: z.string().max(2000).nullish(),
  environment: EnvironmentEnum.optional(),
  recordingPermission: z.boolean().optional(),
  consentConfirmed: z.boolean().optional(),
  observerIds: z.array(z.string()).optional(),
  sessionObjective: z.string().max(2000).nullish(),
  knownLimitations: z.string().max(2000).nullish(),
  accessibilityNotes: z.string().max(2000).nullish(),
})

export const updateSessionSchema = z.object({
  status: SessionStatusEnum.optional(),
  consentConfirmed: z.boolean().optional(),
  recordingPermission: z.boolean().optional(),
  activityProgress: z.record(z.any()).nullish(),
  participantNotes: z.string().max(2000).nullish(),
  sessionObjective: z.string().max(2000).nullish(),
  knownLimitations: z.string().max(2000).nullish(),
  accessibilityNotes: z.string().max(2000).nullish(),
  observerIds: z.array(z.string()).optional(),
  participantType: ParticipantTypeEnum.optional(),
  environment: EnvironmentEnum.optional(),
})

export const createPromptEvalSchema = z.object({
  activitySlug: z.string().min(1),
  promptNumber: z.number().int().min(1).optional(),
  promptText: z.string().min(1),
  promptSource: PromptSourceEnum.optional(),
  useCaseCategory: UseCaseCategoryEnum,
  topicArea: TopicAreaEnum.nullish(),
  responseSummary: z.string().nullish(),
  fullResponse: z.string().nullish(),
})

export const updatePromptEvalSchema = z.object({
  promptText: z.string().min(1).optional(),
  topicArea: TopicAreaEnum.nullish(),
  responseSummary: z.string().nullish(),
  fullResponse: z.string().nullish(),
  responseUrl: z.string().nullish(),
  responseVersion: z.string().nullish(),
  participantReaction: z.string().nullish(),
  keyParticipantQuote: z.string().nullish(),
  quoteIncluded: z.boolean().optional(),
  nextStepIncluded: z.boolean().optional(),
  influencerType: z.string().nullish(),
  outOfScopeCategory: z.string().nullish(),
  sensitiveTopicCategory: z.string().nullish(),
  misuseType: z.string().nullish(),
  followUpAnswers: z.record(z.any()).nullish(),
  toneDescription: z.string().nullish(),
  observerNotes: z.string().nullish(),
  moderatorNotes: z.string().nullish(),
  overallReadiness: ReadinessEnum.nullish(),
  completed: z.boolean().optional(),
})

export const scoresUpsertSchema = z.object({
  scores: z.array(
    z.object({
      criterionKey: z.string(),
      value: z.number().int().min(1).max(5).nullish(),
      notes: z.string().nullish(),
    })
  ),
})

export const createIssueSchema = z.object({
  issueType: IssueTypeEnum,
  severity: SeverityEnum.optional(),
  description: z.string().min(1),
  evidenceResponse: z.string().nullish(),
  evidenceParticipant: z.string().nullish(),
  recommendedAction: ActionRecommendationEnum.optional(),
  suggestedRevision: z.string().nullish(),
  owner: z.string().nullish(),
  priority: IssuePriorityEnum.optional(),
  status: IssueStatusEnum.optional(),
  requiresSme: z.boolean().optional(),
  requiresOfficialSource: z.boolean().optional(),
  requiresRecruiterReferral: z.boolean().optional(),
})

export const updateIssueSchema = createIssueSchema.partial()

export const quoteEvalSchema = z.object({
  quoteText: z.string().nullish(),
  quoteSource: z.string().nullish(),
  quoteType: z.string().nullish(),
  authenticity: TrinaryEnum.nullish(),
  value: TrinaryEnum.nullish(),
  brandSafety: TrinaryEnum.nullish(),
  contextSufficient: TrinaryEnum.nullish(),
  marketingSpeak: z.boolean().optional(),
  preservesSoldierVoice: TrinaryEnum.nullish(),
  sensitiveInfo: TrinaryEnum.nullish(),
  actionRecommendation: QuoteActionEnum.optional(),
  suggestedEdit: z.string().nullish(),
  needsSmeReview: z.boolean().optional(),
  notes: z.string().nullish(),
})

export const nextStepEvalSchema = z.object({
  nextStepNeeded: z.boolean().optional(),
  nextStepProvided: z.boolean().optional(),
  nextStepType: z.string().nullish(),
  clarity: TrinaryEnum.nullish(),
  appropriateness: TrinaryEnum.nullish(),
  overRecruiterReliance: z.boolean().optional(),
  suggestion: z.string().nullish(),
  notes: z.string().nullish(),
})

export const warmupSchema = z.object({
  answers: z.array(
    z.object({
      questionKey: z.string(),
      answer: z.string().nullish(),
      keyQuote: z.string().nullish(),
      themeTags: z.array(z.string()).optional(),
      notes: z.string().nullish(),
    })
  ),
})

export const summarySchema = z.object({
  overallHelpfulness: z.string().nullish(),
  strongestContentMoment: z.string().nullish(),
  weakestContentMoment: z.string().nullish(),
  mostConcerningResponse: z.string().nullish(),
  mostAuthenticResponse: z.string().nullish(),
  mostObviousContentGap: z.string().nullish(),
  repeatedTheme: z.string().nullish(),
  riskyResponse: z.string().nullish(),
  marketingSpeakExamples: z.string().nullish(),
  expectedTopics: z.string().nullish(),
  contentGaps: z.string().nullish(),
  prospectImprovementIdeas: z.string().nullish(),
  influencerImprovementIdeas: z.string().nullish(),
  topImprovement: z.string().nullish(),
  otherComments: z.string().nullish(),
  participantTrustLevel: LevelEnum.nullish(),
  participantPerceivedHelpfulness: LevelEnum.nullish(),
  overallContentReadiness: ReadinessEnum.nullish(),
  topRecommendations: z.array(z.string()).max(10).optional(),
  additionalNotes: z.string().nullish(),
})

export const promptBankItemSchema = z.object({
  activitySlug: z.string().min(1),
  promptText: z.string().min(1),
  topicArea: TopicAreaEnum.nullish(),
  notes: z.string().nullish(),
  isArchived: z.boolean().optional(),
})

export const updatePromptBankItemSchema = promptBankItemSchema.partial()

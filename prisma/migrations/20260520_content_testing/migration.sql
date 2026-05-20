-- CreateEnum: UserRole
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER');

-- AlterTable: User add role
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'MEMBER';

-- CreateEnum: Content Testing enums
CREATE TYPE "ContentTestRoundStatus" AS ENUM ('PLANNED', 'ACTIVE', 'CLOSED', 'ARCHIVED');
CREATE TYPE "ContentTestSessionStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'PAUSED', 'COMPLETE', 'ARCHIVED');
CREATE TYPE "ContentTestParticipantType" AS ENUM ('INTERNAL_TESTER', 'PROSPECT_LIKE', 'PARENT_GUARDIAN', 'EDUCATOR', 'INFLUENCER', 'RECRUITER', 'CONTENT_REVIEWER', 'STAKEHOLDER', 'OTHER');
CREATE TYPE "ContentTestEnvironment" AS ENUM ('PROTOTYPE', 'STAGING', 'PRODUCTION', 'TRANSCRIPT_REVIEW', 'STATIC_RESPONSE_REVIEW', 'OTHER');
CREATE TYPE "ContentTestSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "ContentTestReadiness" AS ENUM ('READY', 'MOSTLY_READY', 'NEEDS_ITERATION', 'NOT_READY');
CREATE TYPE "ContentTestActionRecommendation" AS ENUM ('KEEP', 'EDIT', 'REWRITE', 'REPLACE_QUOTE', 'ADD_CONTENT', 'REMOVE_CONTENT', 'ESCALATE_FOR_REVIEW', 'VALIDATE_WITH_SME', 'ADD_RECRUITER_REFERRAL', 'ADD_OFFICIAL_SOURCE_REFERENCE', 'ADD_NEXT_STEP', 'SIMPLIFY_LANGUAGE', 'MAKE_MORE_AUTHENTIC', 'REDUCE_MARKETING_LANGUAGE', 'OTHER');
CREATE TYPE "ContentTestQuoteAction" AS ENUM ('KEEP', 'LIGHT_EDIT', 'REWRITE', 'REPLACE', 'REMOVE', 'ESCALATE');
CREATE TYPE "ContentTestTrinary" AS ENUM ('YES', 'NO', 'PARTIALLY');
CREATE TYPE "ContentTestLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "ContentTestUseCaseCategory" AS ENUM ('CORE_PROSPECT', 'INFLUENCER_SUPPORTER', 'QUOTE_EVALUATION', 'BRAND_VOICE', 'ACCURACY_COMPLETENESS', 'AMBIGUOUS_EDGE_CASE', 'OUT_OF_SCOPE', 'SENSITIVE', 'ADVERSARIAL', 'WARM_UP', 'WRAP_UP', 'OTHER');
CREATE TYPE "ContentTestTopicArea" AS ENUM ('JOINING', 'BASIC_TRAINING', 'DAILY_LIFE', 'JOBS', 'CAREERS', 'BENEFITS', 'EDUCATION', 'FAMILY', 'SAFETY', 'ELIGIBILITY', 'MEDICAL', 'LEGAL', 'DEPLOYMENT', 'CULTURE', 'MENTAL_HEALTH', 'HARASSMENT_OR_MISCONDUCT', 'RECRUITER_PROCESS', 'OTHER');
CREATE TYPE "ContentTestIssueType" AS ENUM ('ACCURACY', 'CONTENT_GAP', 'TONE', 'BRAND_SAFETY', 'QUOTE_QUALITY', 'CLARITY', 'COMPLETENESS', 'NEXT_STEP', 'SENSITIVITY_HANDLING', 'OUT_OF_SCOPE_HANDLING', 'AUTHENTICITY', 'TRUST', 'READABILITY', 'OVERPROMISING', 'MARKETING_SPEAK', 'POLICY_RISK', 'PRIVACY_RISK', 'OTHER');
CREATE TYPE "ContentTestIssueStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'WONT_FIX');
CREATE TYPE "ContentTestIssuePriority" AS ENUM ('QUICK_WIN', 'PHASE_1', 'PHASE_2', 'BACKLOG');
CREATE TYPE "ContentTestPromptSource" AS ENUM ('PARTICIPANT', 'MODERATOR', 'OBSERVER', 'PREDEFINED');

-- CreateTable: ContentTestActivity
CREATE TABLE "ContentTestActivity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "script" TEXT,
    "instructions" TEXT,
    "useCaseCategory" "ContentTestUseCaseCategory" NOT NULL,
    "requiredCriteria" TEXT[],
    "capturesPrompts" BOOLEAN NOT NULL DEFAULT true,
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "isAdversarial" BOOLEAN NOT NULL DEFAULT false,
    "followUpQuestions" JSONB,
    "warmupQuestions" JSONB,
    "wrapUpQuestions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTestActivity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentTestActivity_slug_key" ON "ContentTestActivity"("slug");
CREATE UNIQUE INDEX "ContentTestActivity_order_key" ON "ContentTestActivity"("order");

-- CreateTable: ContentTestCriterion
CREATE TABLE "ContentTestCriterion" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "alwaysRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTestCriterion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentTestCriterion_key_key" ON "ContentTestCriterion"("key");
CREATE UNIQUE INDEX "ContentTestCriterion_order_key" ON "ContentTestCriterion"("order");

-- CreateTable: ContentTestPromptBankItem
CREATE TABLE "ContentTestPromptBankItem" (
    "id" TEXT NOT NULL,
    "activitySlug" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "topicArea" "ContentTestTopicArea",
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTestPromptBankItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ContentTestPromptBankItem_activitySlug_idx" ON "ContentTestPromptBankItem"("activitySlug");
CREATE INDEX "ContentTestPromptBankItem_topicArea_idx" ON "ContentTestPromptBankItem"("topicArea");

-- CreateTable: ContentTestRound
CREATE TABLE "ContentTestRound" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ContentTestRoundStatus" NOT NULL DEFAULT 'PLANNED',
    "defaultEnvironment" "ContentTestEnvironment" NOT NULL DEFAULT 'STAGING',
    "ownerId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTestRound_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ContentTestRound_status_idx" ON "ContentTestRound"("status");

-- CreateTable: ContentTestSession
CREATE TABLE "ContentTestSession" (
    "id" TEXT NOT NULL,
    "roundId" TEXT,
    "moderatorId" TEXT,
    "observerIds" TEXT[],
    "participantId" TEXT NOT NULL,
    "participantType" "ContentTestParticipantType" NOT NULL DEFAULT 'INTERNAL_TESTER',
    "participantNotes" TEXT,
    "environment" "ContentTestEnvironment" NOT NULL DEFAULT 'STAGING',
    "status" "ContentTestSessionStatus" NOT NULL DEFAULT 'DRAFT',
    "recordingPermission" BOOLEAN NOT NULL DEFAULT false,
    "consentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "activityProgress" JSONB,
    "sessionObjective" TEXT,
    "knownLimitations" TEXT,
    "accessibilityNotes" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTestSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ContentTestSession_roundId_idx" ON "ContentTestSession"("roundId");
CREATE INDEX "ContentTestSession_status_idx" ON "ContentTestSession"("status");
CREATE INDEX "ContentTestSession_participantType_idx" ON "ContentTestSession"("participantType");

-- CreateTable: ContentTestPromptEval
CREATE TABLE "ContentTestPromptEval" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "activitySlug" TEXT NOT NULL,
    "promptNumber" INTEGER NOT NULL,
    "promptText" TEXT NOT NULL,
    "promptSource" "ContentTestPromptSource" NOT NULL DEFAULT 'PREDEFINED',
    "useCaseCategory" "ContentTestUseCaseCategory" NOT NULL,
    "topicArea" "ContentTestTopicArea",
    "responseSummary" TEXT,
    "fullResponse" TEXT,
    "responseUrl" TEXT,
    "responseVersion" TEXT,
    "participantReaction" TEXT,
    "keyParticipantQuote" TEXT,
    "quoteIncluded" BOOLEAN NOT NULL DEFAULT false,
    "nextStepIncluded" BOOLEAN NOT NULL DEFAULT false,
    "influencerType" TEXT,
    "outOfScopeCategory" TEXT,
    "sensitiveTopicCategory" TEXT,
    "misuseType" TEXT,
    "followUpAnswers" JSONB,
    "toneDescription" TEXT,
    "observerNotes" TEXT,
    "moderatorNotes" TEXT,
    "overallReadiness" "ContentTestReadiness",
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTestPromptEval_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentTestPromptEval_sessionId_activitySlug_promptNumber_key" ON "ContentTestPromptEval"("sessionId", "activitySlug", "promptNumber");
CREATE INDEX "ContentTestPromptEval_sessionId_idx" ON "ContentTestPromptEval"("sessionId");
CREATE INDEX "ContentTestPromptEval_activitySlug_idx" ON "ContentTestPromptEval"("activitySlug");
CREATE INDEX "ContentTestPromptEval_topicArea_idx" ON "ContentTestPromptEval"("topicArea");

-- CreateTable: ContentTestScore
CREATE TABLE "ContentTestScore" (
    "id" TEXT NOT NULL,
    "promptEvalId" TEXT NOT NULL,
    "criterionKey" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTestScore_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentTestScore_promptEvalId_criterionKey_key" ON "ContentTestScore"("promptEvalId", "criterionKey");
CREATE INDEX "ContentTestScore_criterionKey_idx" ON "ContentTestScore"("criterionKey");

-- CreateTable: ContentTestIssue
CREATE TABLE "ContentTestIssue" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "promptEvalId" TEXT,
    "issueType" "ContentTestIssueType" NOT NULL,
    "severity" "ContentTestSeverity" NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "evidenceResponse" TEXT,
    "evidenceParticipant" TEXT,
    "recommendedAction" "ContentTestActionRecommendation" NOT NULL DEFAULT 'EDIT',
    "suggestedRevision" TEXT,
    "owner" TEXT,
    "priority" "ContentTestIssuePriority" NOT NULL DEFAULT 'PHASE_1',
    "status" "ContentTestIssueStatus" NOT NULL DEFAULT 'OPEN',
    "requiresSme" BOOLEAN NOT NULL DEFAULT false,
    "requiresOfficialSource" BOOLEAN NOT NULL DEFAULT false,
    "requiresRecruiterReferral" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTestIssue_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ContentTestIssue_sessionId_idx" ON "ContentTestIssue"("sessionId");
CREATE INDEX "ContentTestIssue_severity_idx" ON "ContentTestIssue"("severity");
CREATE INDEX "ContentTestIssue_issueType_idx" ON "ContentTestIssue"("issueType");
CREATE INDEX "ContentTestIssue_status_idx" ON "ContentTestIssue"("status");

-- CreateTable: ContentTestQuoteEval
CREATE TABLE "ContentTestQuoteEval" (
    "id" TEXT NOT NULL,
    "promptEvalId" TEXT NOT NULL,
    "quoteText" TEXT,
    "quoteSource" TEXT,
    "quoteType" TEXT,
    "authenticity" "ContentTestTrinary",
    "value" "ContentTestTrinary",
    "brandSafety" "ContentTestTrinary",
    "contextSufficient" "ContentTestTrinary",
    "marketingSpeak" BOOLEAN NOT NULL DEFAULT false,
    "preservesSoldierVoice" "ContentTestTrinary",
    "sensitiveInfo" "ContentTestTrinary",
    "actionRecommendation" "ContentTestQuoteAction" NOT NULL DEFAULT 'KEEP',
    "suggestedEdit" TEXT,
    "needsSmeReview" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTestQuoteEval_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentTestQuoteEval_promptEvalId_key" ON "ContentTestQuoteEval"("promptEvalId");

-- CreateTable: ContentTestNextStepEval
CREATE TABLE "ContentTestNextStepEval" (
    "id" TEXT NOT NULL,
    "promptEvalId" TEXT NOT NULL,
    "nextStepNeeded" BOOLEAN NOT NULL DEFAULT true,
    "nextStepProvided" BOOLEAN NOT NULL DEFAULT false,
    "nextStepType" TEXT,
    "clarity" "ContentTestTrinary",
    "appropriateness" "ContentTestTrinary",
    "overRecruiterReliance" BOOLEAN NOT NULL DEFAULT false,
    "suggestion" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTestNextStepEval_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentTestNextStepEval_promptEvalId_key" ON "ContentTestNextStepEval"("promptEvalId");

-- CreateTable: ContentTestWarmupAnswer
CREATE TABLE "ContentTestWarmupAnswer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "answer" TEXT,
    "keyQuote" TEXT,
    "themeTags" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTestWarmupAnswer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentTestWarmupAnswer_sessionId_questionKey_key" ON "ContentTestWarmupAnswer"("sessionId", "questionKey");
CREATE INDEX "ContentTestWarmupAnswer_sessionId_idx" ON "ContentTestWarmupAnswer"("sessionId");

-- CreateTable: ContentTestSummary
CREATE TABLE "ContentTestSummary" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "overallHelpfulness" TEXT,
    "strongestContentMoment" TEXT,
    "weakestContentMoment" TEXT,
    "mostConcerningResponse" TEXT,
    "mostAuthenticResponse" TEXT,
    "mostObviousContentGap" TEXT,
    "repeatedTheme" TEXT,
    "riskyResponse" TEXT,
    "marketingSpeakExamples" TEXT,
    "expectedTopics" TEXT,
    "contentGaps" TEXT,
    "prospectImprovementIdeas" TEXT,
    "influencerImprovementIdeas" TEXT,
    "topImprovement" TEXT,
    "otherComments" TEXT,
    "participantTrustLevel" "ContentTestLevel",
    "participantPerceivedHelpfulness" "ContentTestLevel",
    "overallContentReadiness" "ContentTestReadiness",
    "topRecommendations" JSONB,
    "additionalNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTestSummary_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentTestSummary_sessionId_key" ON "ContentTestSummary"("sessionId");

-- CreateTable: ContentTestInviteToken
CREATE TABLE "ContentTestInviteToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentTestInviteToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentTestInviteToken_token_key" ON "ContentTestInviteToken"("token");
CREATE INDEX "ContentTestInviteToken_sessionId_idx" ON "ContentTestInviteToken"("sessionId");

-- AddForeignKey: PromptBank -> Activity
ALTER TABLE "ContentTestPromptBankItem"
  ADD CONSTRAINT "ContentTestPromptBankItem_activitySlug_fkey"
  FOREIGN KEY ("activitySlug") REFERENCES "ContentTestActivity"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Round -> User (owner)
ALTER TABLE "ContentTestRound"
  ADD CONSTRAINT "ContentTestRound_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Session -> Round
ALTER TABLE "ContentTestSession"
  ADD CONSTRAINT "ContentTestSession_roundId_fkey"
  FOREIGN KEY ("roundId") REFERENCES "ContentTestRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Session -> User (moderator)
ALTER TABLE "ContentTestSession"
  ADD CONSTRAINT "ContentTestSession_moderatorId_fkey"
  FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: PromptEval -> Session
ALTER TABLE "ContentTestPromptEval"
  ADD CONSTRAINT "ContentTestPromptEval_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "ContentTestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: PromptEval -> Activity
ALTER TABLE "ContentTestPromptEval"
  ADD CONSTRAINT "ContentTestPromptEval_activitySlug_fkey"
  FOREIGN KEY ("activitySlug") REFERENCES "ContentTestActivity"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Score -> PromptEval
ALTER TABLE "ContentTestScore"
  ADD CONSTRAINT "ContentTestScore_promptEvalId_fkey"
  FOREIGN KEY ("promptEvalId") REFERENCES "ContentTestPromptEval"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Issue -> Session
ALTER TABLE "ContentTestIssue"
  ADD CONSTRAINT "ContentTestIssue_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "ContentTestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Issue -> PromptEval
ALTER TABLE "ContentTestIssue"
  ADD CONSTRAINT "ContentTestIssue_promptEvalId_fkey"
  FOREIGN KEY ("promptEvalId") REFERENCES "ContentTestPromptEval"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: QuoteEval -> PromptEval
ALTER TABLE "ContentTestQuoteEval"
  ADD CONSTRAINT "ContentTestQuoteEval_promptEvalId_fkey"
  FOREIGN KEY ("promptEvalId") REFERENCES "ContentTestPromptEval"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: NextStepEval -> PromptEval
ALTER TABLE "ContentTestNextStepEval"
  ADD CONSTRAINT "ContentTestNextStepEval_promptEvalId_fkey"
  FOREIGN KEY ("promptEvalId") REFERENCES "ContentTestPromptEval"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: WarmupAnswer -> Session
ALTER TABLE "ContentTestWarmupAnswer"
  ADD CONSTRAINT "ContentTestWarmupAnswer_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "ContentTestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Summary -> Session
ALTER TABLE "ContentTestSummary"
  ADD CONSTRAINT "ContentTestSummary_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "ContentTestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: InviteToken -> Session
ALTER TABLE "ContentTestInviteToken"
  ADD CONSTRAINT "ContentTestInviteToken_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "ContentTestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

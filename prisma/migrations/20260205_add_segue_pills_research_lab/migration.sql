-- CreateTable
CREATE TABLE "SegueCampaignGoal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "description" TEXT,
    "businessPrompt" TEXT NOT NULL,
    "ctaRequirement" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SegueCampaignGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeguePillResearch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "personas" TEXT[],
    "topics" TEXT[],
    "questionCount" INTEGER NOT NULL DEFAULT 100,
    "syntheticQuestions" JSONB,
    "scrapedQuestions" JSONB,
    "scrapedUrls" TEXT[],
    "intentClusters" JSONB,
    "pillLibrary" JSONB,
    "campaignGoalId" TEXT,
    "recommendations" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "SeguePillResearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegueTestSession" (
    "id" TEXT NOT NULL,
    "researchId" TEXT NOT NULL,
    "testCase" INTEGER NOT NULL,
    "scenarioContext" JSONB,
    "pillsShown" JSONB NOT NULL,
    "clickedPillId" TEXT,
    "clickedPillLabel" TEXT,
    "clickOrder" INTEGER,
    "timeToClick" INTEGER,
    "rating" INTEGER,
    "relevanceScore" INTEGER,
    "clarityScore" INTEGER,
    "feedback" TEXT,
    "chatCompleted" BOOLEAN NOT NULL DEFAULT false,
    "reachedCta" BOOLEAN NOT NULL DEFAULT false,
    "ctaType" TEXT,
    "testerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SegueTestSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SegueCampaignGoal_isActive_idx" ON "SegueCampaignGoal"("isActive");

-- CreateIndex
CREATE INDEX "SegueCampaignGoal_goalType_idx" ON "SegueCampaignGoal"("goalType");

-- CreateIndex
CREATE INDEX "SeguePillResearch_status_idx" ON "SeguePillResearch"("status");

-- CreateIndex
CREATE INDEX "SeguePillResearch_createdAt_idx" ON "SeguePillResearch"("createdAt");

-- CreateIndex
CREATE INDEX "SegueTestSession_researchId_idx" ON "SegueTestSession"("researchId");

-- CreateIndex
CREATE INDEX "SegueTestSession_testCase_idx" ON "SegueTestSession"("testCase");

-- CreateIndex
CREATE INDEX "SegueTestSession_createdAt_idx" ON "SegueTestSession"("createdAt");

-- AddForeignKey
ALTER TABLE "SegueCampaignGoal" ADD CONSTRAINT "SegueCampaignGoal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguePillResearch" ADD CONSTRAINT "SeguePillResearch_campaignGoalId_fkey" FOREIGN KEY ("campaignGoalId") REFERENCES "SegueCampaignGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguePillResearch" ADD CONSTRAINT "SeguePillResearch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegueTestSession" ADD CONSTRAINT "SegueTestSession_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "SeguePillResearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegueTestSession" ADD CONSTRAINT "SegueTestSession_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

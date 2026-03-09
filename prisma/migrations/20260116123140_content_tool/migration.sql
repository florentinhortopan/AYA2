-- CreateTable
CREATE TABLE "QaProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "targetQuestionCount" INTEGER NOT NULL DEFAULT 250,
    "publishedCount" INTEGER NOT NULL DEFAULT 0,
    "corpusFileId" TEXT,
    "questionPromptId" TEXT,
    "answerPromptId" TEXT,
    "guidelineId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "QaProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QaQuestion" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "persona" TEXT,
    "tone" TEXT,
    "questionText" TEXT NOT NULL,
    "sourceUrls" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "batchNumber" INTEGER,
    "createdFromGenerator" BOOLEAN NOT NULL DEFAULT true,
    "editedById" TEXT,
    "editedAt" TIMESTAMP(3),
    "corpusValidated" BOOLEAN NOT NULL DEFAULT false,
    "validationNotes" TEXT,
    "ratingDefault" INTEGER NOT NULL DEFAULT 3,
    "ratingValue" INTEGER NOT NULL DEFAULT 3,
    "ratingUpdatedById" TEXT,
    "ratingUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QaQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QaAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "variantLevel" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "characterCount" INTEGER,
    "keywords" TEXT[],
    "sourceLink" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'pending',
    "validationNotes" TEXT,
    "editedById" TEXT,
    "editedAt" TIMESTAMP(3),
    "ratingDefault" INTEGER NOT NULL DEFAULT 3,
    "ratingValue" INTEGER NOT NULL DEFAULT 3,
    "ratingUpdatedById" TEXT,
    "ratingUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QaAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorpusFile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileContent" TEXT NOT NULL,
    "fileHash" TEXT,
    "sourceUrls" TEXT[],
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CorpusFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPrompt" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentGuideline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentGuideline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentBatchJob" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "batchNumber" INTEGER NOT NULL,
    "questionsInBatch" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "promptType" TEXT NOT NULL,
    "apiResponse" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentBatchJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAuditLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "questionId" TEXT,
    "answerId" TEXT,
    "actionType" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "changedById" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QaProject_status_idx" ON "QaProject"("status");

-- CreateIndex
CREATE INDEX "QaProject_createdAt_idx" ON "QaProject"("createdAt");

-- CreateIndex
CREATE INDEX "QaQuestion_projectId_idx" ON "QaQuestion"("projectId");

-- CreateIndex
CREATE INDEX "QaQuestion_status_idx" ON "QaQuestion"("status");

-- CreateIndex
CREATE INDEX "QaQuestion_batchNumber_idx" ON "QaQuestion"("batchNumber");

-- CreateIndex
CREATE INDEX "QaAnswer_questionId_idx" ON "QaAnswer"("questionId");

-- CreateIndex
CREATE INDEX "QaAnswer_validationStatus_idx" ON "QaAnswer"("validationStatus");

-- CreateIndex
CREATE INDEX "CorpusFile_isActive_idx" ON "CorpusFile"("isActive");

-- CreateIndex
CREATE INDEX "ContentPrompt_type_idx" ON "ContentPrompt"("type");

-- CreateIndex
CREATE INDEX "ContentPrompt_isActive_idx" ON "ContentPrompt"("isActive");

-- CreateIndex
CREATE INDEX "ContentGuideline_isActive_idx" ON "ContentGuideline"("isActive");

-- CreateIndex
CREATE INDEX "ContentBatchJob_projectId_idx" ON "ContentBatchJob"("projectId");

-- CreateIndex
CREATE INDEX "ContentBatchJob_status_idx" ON "ContentBatchJob"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ContentBatchJob_projectId_batchNumber_promptType_key" ON "ContentBatchJob"("projectId", "batchNumber", "promptType");

-- CreateIndex
CREATE INDEX "ContentAuditLog_projectId_idx" ON "ContentAuditLog"("projectId");

-- CreateIndex
CREATE INDEX "ContentAuditLog_changedAt_idx" ON "ContentAuditLog"("changedAt");

-- AddForeignKey
ALTER TABLE "QaProject" ADD CONSTRAINT "QaProject_corpusFileId_fkey" FOREIGN KEY ("corpusFileId") REFERENCES "CorpusFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QaProject" ADD CONSTRAINT "QaProject_questionPromptId_fkey" FOREIGN KEY ("questionPromptId") REFERENCES "ContentPrompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QaProject" ADD CONSTRAINT "QaProject_answerPromptId_fkey" FOREIGN KEY ("answerPromptId") REFERENCES "ContentPrompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QaProject" ADD CONSTRAINT "QaProject_guidelineId_fkey" FOREIGN KEY ("guidelineId") REFERENCES "ContentGuideline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QaProject" ADD CONSTRAINT "QaProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QaQuestion" ADD CONSTRAINT "QaQuestion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "QaProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QaQuestion" ADD CONSTRAINT "QaQuestion_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QaQuestion" ADD CONSTRAINT "QaQuestion_ratingUpdatedById_fkey" FOREIGN KEY ("ratingUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QaAnswer" ADD CONSTRAINT "QaAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QaQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QaAnswer" ADD CONSTRAINT "QaAnswer_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QaAnswer" ADD CONSTRAINT "QaAnswer_ratingUpdatedById_fkey" FOREIGN KEY ("ratingUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorpusFile" ADD CONSTRAINT "CorpusFile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPrompt" ADD CONSTRAINT "ContentPrompt_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentGuideline" ADD CONSTRAINT "ContentGuideline_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentBatchJob" ADD CONSTRAINT "ContentBatchJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "QaProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAuditLog" ADD CONSTRAINT "ContentAuditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "QaProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAuditLog" ADD CONSTRAINT "ContentAuditLog_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QaQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAuditLog" ADD CONSTRAINT "ContentAuditLog_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "QaAnswer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAuditLog" ADD CONSTRAINT "ContentAuditLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- CreateTable
CREATE TABLE "KnowledgeSourcePage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "externalUrl" TEXT NOT NULL,
    "title" TEXT,
    "slug" TEXT,
    "section" TEXT,
    "status" TEXT NOT NULL DEFAULT 'discovered',
    "rawHtml" TEXT,
    "textContent" TEXT,
    "checksum" TEXT,
    "scrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeSourcePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSourceChunk" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "heading" TEXT,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "embeddingJson" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeSourceChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSourceMedia" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "provider" TEXT,
    "data" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeSourceMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QaAnswerMedia" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "provider" TEXT,
    "data" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QaAnswerMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeSourcePage_projectId_idx" ON "KnowledgeSourcePage"("projectId");

-- CreateIndex
CREATE INDEX "KnowledgeSourcePage_section_idx" ON "KnowledgeSourcePage"("section");

-- CreateIndex
CREATE INDEX "KnowledgeSourcePage_status_idx" ON "KnowledgeSourcePage"("status");

-- CreateIndex
CREATE INDEX "KnowledgeSourcePage_externalUrl_idx" ON "KnowledgeSourcePage"("externalUrl");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeSourceChunk_pageId_chunkIndex_key" ON "KnowledgeSourceChunk"("pageId", "chunkIndex");

-- CreateIndex
CREATE INDEX "KnowledgeSourceChunk_pageId_idx" ON "KnowledgeSourceChunk"("pageId");

-- CreateIndex
CREATE INDEX "KnowledgeSourceMedia_pageId_idx" ON "KnowledgeSourceMedia"("pageId");

-- CreateIndex
CREATE INDEX "KnowledgeSourceMedia_mediaType_idx" ON "KnowledgeSourceMedia"("mediaType");

-- CreateIndex
CREATE INDEX "QaAnswerMedia_answerId_idx" ON "QaAnswerMedia"("answerId");

-- CreateIndex
CREATE INDEX "QaAnswerMedia_mediaType_idx" ON "QaAnswerMedia"("mediaType");

-- AddForeignKey
ALTER TABLE "KnowledgeSourcePage" ADD CONSTRAINT "KnowledgeSourcePage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "QaProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSourceChunk" ADD CONSTRAINT "KnowledgeSourceChunk_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "KnowledgeSourcePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSourceMedia" ADD CONSTRAINT "KnowledgeSourceMedia_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "KnowledgeSourcePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QaAnswerMedia" ADD CONSTRAINT "QaAnswerMedia_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "QaAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

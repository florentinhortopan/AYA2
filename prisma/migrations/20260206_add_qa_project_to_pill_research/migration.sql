-- AlterTable
ALTER TABLE "SeguePillResearch" ADD COLUMN "qaProjectId" TEXT;

-- AddForeignKey
ALTER TABLE "SeguePillResearch" ADD CONSTRAINT "SeguePillResearch_qaProjectId_fkey" FOREIGN KEY ("qaProjectId") REFERENCES "QaProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "SeguePillResearch_qaProjectId_idx" ON "SeguePillResearch"("qaProjectId");

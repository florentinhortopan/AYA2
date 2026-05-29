-- AlterTable: ContentTestActivity add isActive flag for retiring catalog entries
ALTER TABLE "ContentTestActivity" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "ContentTestActivity_isActive_idx" ON "ContentTestActivity"("isActive");

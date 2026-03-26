-- CreateEnum (IF NOT EXISTS for idempotency)
DO $$ BEGIN
  CREATE TYPE "SummaryCategory" AS ENUM ('TECH', 'ECONOMY', 'ENTERTAINMENT', 'EDUCATION', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SummaryStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'ERROR');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Summary" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "memo" TEXT NOT NULL DEFAULT '',
    "category" "SummaryCategory" NOT NULL DEFAULT 'OTHER',
    "status" "SummaryStatus" NOT NULL DEFAULT 'PENDING',
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Summary_category_idx" ON "Summary"("category");
CREATE INDEX IF NOT EXISTS "Summary_status_idx" ON "Summary"("status");
CREATE INDEX IF NOT EXISTS "Summary_createdAt_idx" ON "Summary"("createdAt" DESC);

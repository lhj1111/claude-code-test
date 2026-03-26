-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "SummaryProvider" AS ENUM ('CLAUDE', 'OPENAI');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AlterTable: provider 컬럼 추가
ALTER TABLE "Summary" ADD COLUMN IF NOT EXISTS "provider" "SummaryProvider" NOT NULL DEFAULT 'CLAUDE';

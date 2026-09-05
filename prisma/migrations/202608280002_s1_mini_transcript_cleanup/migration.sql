ALTER TABLE "TranscriptSegment"
ADD COLUMN "rawText" TEXT,
ADD COLUMN "normalizedBy" TEXT,
ADD COLUMN "normalizedAt" TIMESTAMP(3);

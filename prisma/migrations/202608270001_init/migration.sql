CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');
CREATE TYPE "GraphicStatus" AS ENUM ('SUGGESTED', 'ACCEPTED', 'REJECTED', 'GENERATING', 'READY', 'FAILED', 'OUTDATED');
CREATE TYPE "AssetKind" AS ENUM ('SOURCE_VIDEO', 'PROXY', 'AUDIO', 'THUMBNAIL', 'BRAND_ASSET', 'GRAPHIC_SOURCE', 'PREVIEW', 'RENDER');

CREATE TABLE "User" (
  "id" TEXT NOT NULL, "email" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Workspace" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WorkspaceMember" (
  "userId" TEXT NOT NULL, "workspaceId" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'owner',
  CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("userId", "workspaceId")
);
CREATE TABLE "Project" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "sourceLocked" BOOLEAN NOT NULL DEFAULT true,
  "userId" TEXT NOT NULL, "workspaceId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProjectSettings" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "platform" TEXT NOT NULL, "aspectRatio" TEXT NOT NULL,
  "width" INTEGER NOT NULL, "height" INTEGER NOT NULL, "fps" DOUBLE PRECISION NOT NULL,
  "intensity" TEXT NOT NULL, "density" TEXT NOT NULL, "maxGraphics" INTEGER NOT NULL, "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "ProjectSettings_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BrandKit" (
  "id" TEXT NOT NULL, "workspaceId" TEXT NOT NULL, "name" TEXT NOT NULL, "tokens" JSONB NOT NULL,
  "motionLanguage" TEXT NOT NULL, "version" INTEGER NOT NULL DEFAULT 1, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BrandKit_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Asset" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "kind" "AssetKind" NOT NULL, "key" TEXT NOT NULL,
  "filename" TEXT NOT NULL, "mime" TEXT NOT NULL, "bytes" BIGINT NOT NULL, "sha256" TEXT NOT NULL,
  "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SourceVideo" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "assetId" TEXT NOT NULL, "duration" DOUBLE PRECISION NOT NULL,
  "width" INTEGER NOT NULL, "height" INTEGER NOT NULL, "fps" DOUBLE PRECISION NOT NULL, "videoCodec" TEXT NOT NULL,
  "audioCodec" TEXT, "rotation" INTEGER NOT NULL DEFAULT 0, "probe" JSONB NOT NULL,
  CONSTRAINT "SourceVideo_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TranscriptSegment" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "startSeconds" DOUBLE PRECISION NOT NULL, "endSeconds" DOUBLE PRECISION NOT NULL,
  "speaker" TEXT, "text" TEXT NOT NULL, "confidence" DOUBLE PRECISION,
  CONSTRAINT "TranscriptSegment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TranscriptWord" (
  "id" TEXT NOT NULL, "segmentId" TEXT NOT NULL, "startSeconds" DOUBLE PRECISION NOT NULL, "endSeconds" DOUBLE PRECISION NOT NULL,
  "text" TEXT NOT NULL, "confidence" DOUBLE PRECISION, "corrected" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "TranscriptWord_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Shot" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "startSeconds" DOUBLE PRECISION NOT NULL, "endSeconds" DOUBLE PRECISION NOT NULL,
  "hardCut" BOOLEAN NOT NULL, "score" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "Shot_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProtectedRegion" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "kind" TEXT NOT NULL, "startSeconds" DOUBLE PRECISION NOT NULL,
  "endSeconds" DOUBLE PRECISION NOT NULL, "bounds" JSONB NOT NULL, "confidence" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "ProtectedRegion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MotionPlan" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "version" INTEGER NOT NULL, "promptVersion" TEXT NOT NULL,
  "plan" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MotionPlan_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MotionGraphic" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "stableKey" TEXT NOT NULL, "type" TEXT NOT NULL,
  "startSeconds" DOUBLE PRECISION NOT NULL, "endSeconds" DOUBLE PRECISION NOT NULL, "status" "GraphicStatus" NOT NULL, "evidence" JSONB NOT NULL,
  CONSTRAINT "MotionGraphic_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GraphicVersion" (
  "id" TEXT NOT NULL, "graphicId" TEXT NOT NULL, "version" INTEGER NOT NULL, "promptInput" JSONB NOT NULL,
  "instructions" JSONB NOT NULL, "sourceFiles" JSONB NOT NULL, "dependencies" JSONB NOT NULL,
  "validation" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GraphicVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PromptRevision" (
  "id" TEXT NOT NULL, "graphicId" TEXT NOT NULL, "scope" TEXT NOT NULL, "prompt" TEXT NOT NULL,
  "interpretation" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromptRevision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RenderJob" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "status" "JobStatus" NOT NULL, "stage" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL, "progress" DOUBLE PRECISION NOT NULL DEFAULT 0, "error" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RenderJob_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RenderArtifact" (
  "id" TEXT NOT NULL, "renderJobId" TEXT NOT NULL, "format" TEXT NOT NULL, "key" TEXT NOT NULL,
  "manifest" JSONB NOT NULL, "verified" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RenderArtifact_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "actorId" TEXT NOT NULL, "action" TEXT NOT NULL,
  "payload" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "ProjectSettings_projectId_key" ON "ProjectSettings"("projectId");
CREATE INDEX "Asset_projectId_kind_idx" ON "Asset"("projectId", "kind");
CREATE UNIQUE INDEX "SourceVideo_projectId_key" ON "SourceVideo"("projectId");
CREATE UNIQUE INDEX "SourceVideo_assetId_key" ON "SourceVideo"("assetId");
CREATE INDEX "TranscriptSegment_projectId_startSeconds_idx" ON "TranscriptSegment"("projectId", "startSeconds");
CREATE UNIQUE INDEX "MotionPlan_projectId_version_key" ON "MotionPlan"("projectId", "version");
CREATE UNIQUE INDEX "MotionGraphic_projectId_stableKey_key" ON "MotionGraphic"("projectId", "stableKey");
CREATE UNIQUE INDEX "GraphicVersion_graphicId_version_key" ON "GraphicVersion"("graphicId", "version");
CREATE UNIQUE INDEX "RenderJob_idempotencyKey_key" ON "RenderJob"("idempotencyKey");
CREATE INDEX "AuditEvent_projectId_createdAt_idx" ON "AuditEvent"("projectId", "createdAt");

ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectSettings" ADD CONSTRAINT "ProjectSettings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrandKit" ADD CONSTRAINT "BrandKit_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SourceVideo" ADD CONSTRAINT "SourceVideo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SourceVideo" ADD CONSTRAINT "SourceVideo_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TranscriptWord" ADD CONSTRAINT "TranscriptWord_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "TranscriptSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Shot" ADD CONSTRAINT "Shot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProtectedRegion" ADD CONSTRAINT "ProtectedRegion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MotionPlan" ADD CONSTRAINT "MotionPlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MotionGraphic" ADD CONSTRAINT "MotionGraphic_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GraphicVersion" ADD CONSTRAINT "GraphicVersion_graphicId_fkey" FOREIGN KEY ("graphicId") REFERENCES "MotionGraphic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromptRevision" ADD CONSTRAINT "PromptRevision_graphicId_fkey" FOREIGN KEY ("graphicId") REFERENCES "MotionGraphic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RenderJob" ADD CONSTRAINT "RenderJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RenderArtifact" ADD CONSTRAINT "RenderArtifact_renderJobId_fkey" FOREIGN KEY ("renderJobId") REFERENCES "RenderJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

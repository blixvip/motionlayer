CREATE TYPE "InputMode" AS ENUM ('SCRIPT_ONLY', 'SCRIPT_NARRATION', 'LOCKED_VIDEO');
CREATE TYPE "ResolutionStatus" AS ENUM ('RESOLVED', 'NEEDS_REVIEW', 'LOCKED');

ALTER TABLE "Project" ADD COLUMN "inputMode" "InputMode" NOT NULL DEFAULT 'LOCKED_VIDEO';

CREATE TABLE "ScriptDocument" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScriptDocument_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ScriptVersion" (
  "id" TEXT NOT NULL, "documentId" TEXT NOT NULL, "version" INTEGER NOT NULL, "verbatimText" TEXT NOT NULL,
  "analysisText" TEXT NOT NULL, "language" JSONB NOT NULL, "checksum" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ScriptVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ScriptSection" (
  "id" TEXT NOT NULL, "scriptVersionId" TEXT NOT NULL, "order" INTEGER NOT NULL, "verbatimText" TEXT NOT NULL,
  "language" TEXT NOT NULL, CONSTRAINT "ScriptSection_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ScriptSentence" (
  "id" TEXT NOT NULL, "sectionId" TEXT NOT NULL, "order" INTEGER NOT NULL, "verbatimText" TEXT NOT NULL,
  CONSTRAINT "ScriptSentence_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ScriptToken" (
  "id" TEXT NOT NULL, "sentenceId" TEXT NOT NULL, "order" INTEGER NOT NULL, "verbatimText" TEXT NOT NULL,
  "normalizedText" TEXT NOT NULL, CONSTRAINT "ScriptToken_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "VisualKnowledgeGraphVersion" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "version" INTEGER NOT NULL, "checksum" TEXT NOT NULL,
  "globalNarrativeState" JSONB NOT NULL, "graph" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VisualKnowledgeGraphVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SemanticSpan" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "graphVersionId" TEXT NOT NULL, "source" JSONB NOT NULL,
  "normalizedMeaning" TEXT NOT NULL, "language" TEXT NOT NULL, "interpretation" JSONB NOT NULL, "ambiguities" JSONB NOT NULL,
  CONSTRAINT "SemanticSpan_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Entity" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "canonicalName" TEXT NOT NULL, "type" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL, "status" "ResolutionStatus" NOT NULL, "lockedAt" TIMESTAMP(3),
  CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EntityAlias" (
  "id" TEXT NOT NULL, "entityId" TEXT NOT NULL, "text" TEXT NOT NULL, "confidence" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "EntityAlias_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EntityMention" (
  "id" TEXT NOT NULL, "entityId" TEXT NOT NULL, "semanticSpanId" TEXT NOT NULL, "verbatimText" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL, CONSTRAINT "EntityMention_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Relation" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "graphVersionId" TEXT NOT NULL, "sourceEntityId" TEXT NOT NULL,
  "targetEntityId" TEXT NOT NULL, "type" TEXT NOT NULL, "modality" TEXT NOT NULL, "negated" BOOLEAN NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL, "evidence" JSONB NOT NULL, CONSTRAINT "Relation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Claim" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "graphVersionId" TEXT NOT NULL, "speaker" TEXT NOT NULL,
  "exactText" TEXT NOT NULL, "modality" TEXT NOT NULL, "negated" BOOLEAN NOT NULL, "status" TEXT NOT NULL,
  "evidence" JSONB NOT NULL, "requiresReview" BOOLEAN NOT NULL, CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StoryboardVersion" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "version" INTEGER NOT NULL, "graphVersionId" TEXT NOT NULL,
  "settingsChecksum" TEXT NOT NULL, "storyboard" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoryboardVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AssetSearchIntent" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "purpose" TEXT NOT NULL, "canonicalEntityId" TEXT,
  "intentHash" TEXT NOT NULL, "query" JSONB NOT NULL, "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AssetSearchIntent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AssetCandidate" (
  "id" TEXT NOT NULL, "searchIntentId" TEXT NOT NULL, "provider" TEXT NOT NULL, "providerAssetId" TEXT,
  "canonicalSourceUrl" TEXT, "license" JSONB NOT NULL, "provenance" JSONB NOT NULL, "securityStatus" TEXT NOT NULL,
  "identityConfidence" DOUBLE PRECISION NOT NULL, "contextConfidence" DOUBLE PRECISION NOT NULL, "contentHash" TEXT,
  "usageStatus" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssetCandidate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DesignContract" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "version" INTEGER NOT NULL, "checksum" TEXT NOT NULL,
  "sources" JSONB NOT NULL, "tokens" JSONB NOT NULL, "motionGrammar" JSONB NOT NULL, "rules" JSONB NOT NULL,
  "conflicts" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DesignContract_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ValidationRun" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "graphicVersionId" TEXT, "compositionSourceVersionId" TEXT,
  "toolVersions" JSONB NOT NULL, "status" TEXT NOT NULL, "findings" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ValidationRun_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Snapshot" (
  "id" TEXT NOT NULL, "validationRunId" TEXT NOT NULL, "atSeconds" DOUBLE PRECISION NOT NULL, "key" TEXT NOT NULL,
  "checksum" TEXT NOT NULL, CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "QCResult" (
  "id" TEXT NOT NULL, "validationRunId" TEXT NOT NULL, "kind" TEXT NOT NULL, "passed" BOOLEAN NOT NULL,
  "details" JSONB NOT NULL, CONSTRAINT "QCResult_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProviderRequest" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "stage" TEXT NOT NULL, "provider" TEXT NOT NULL, "model" TEXT,
  "promptVersion" TEXT, "inputHash" TEXT NOT NULL, "outputHash" TEXT, "latencyMs" INTEGER, "usage" JSONB,
  "repairHistory" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProviderRequest_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CostEvent" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "stage" TEXT NOT NULL, "provider" TEXT NOT NULL, "graphicId" TEXT,
  "quantity" DOUBLE PRECISION NOT NULL, "unit" TEXT NOT NULL, "estimatedUsd" DECIMAL(12,6) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CostEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScriptDocument_projectId_key" ON "ScriptDocument"("projectId");
CREATE UNIQUE INDEX "ScriptVersion_documentId_version_key" ON "ScriptVersion"("documentId", "version");
CREATE UNIQUE INDEX "ScriptSection_scriptVersionId_order_key" ON "ScriptSection"("scriptVersionId", "order");
CREATE UNIQUE INDEX "ScriptSentence_sectionId_order_key" ON "ScriptSentence"("sectionId", "order");
CREATE UNIQUE INDEX "ScriptToken_sentenceId_order_key" ON "ScriptToken"("sentenceId", "order");
CREATE UNIQUE INDEX "VisualKnowledgeGraphVersion_projectId_version_key" ON "VisualKnowledgeGraphVersion"("projectId", "version");
CREATE UNIQUE INDEX "VisualKnowledgeGraphVersion_projectId_checksum_key" ON "VisualKnowledgeGraphVersion"("projectId", "checksum");
CREATE INDEX "SemanticSpan_projectId_graphVersionId_idx" ON "SemanticSpan"("projectId", "graphVersionId");
CREATE INDEX "Entity_projectId_canonicalName_idx" ON "Entity"("projectId", "canonicalName");
CREATE UNIQUE INDEX "EntityAlias_entityId_text_key" ON "EntityAlias"("entityId", "text");
CREATE UNIQUE INDEX "EntityMention_entityId_semanticSpanId_verbatimText_key" ON "EntityMention"("entityId", "semanticSpanId", "verbatimText");
CREATE INDEX "Relation_projectId_graphVersionId_idx" ON "Relation"("projectId", "graphVersionId");
CREATE INDEX "Claim_projectId_requiresReview_idx" ON "Claim"("projectId", "requiresReview");
CREATE UNIQUE INDEX "StoryboardVersion_projectId_version_key" ON "StoryboardVersion"("projectId", "version");
CREATE UNIQUE INDEX "AssetSearchIntent_projectId_intentHash_key" ON "AssetSearchIntent"("projectId", "intentHash");
CREATE INDEX "AssetCandidate_searchIntentId_usageStatus_idx" ON "AssetCandidate"("searchIntentId", "usageStatus");
CREATE UNIQUE INDEX "DesignContract_projectId_version_key" ON "DesignContract"("projectId", "version");
CREATE UNIQUE INDEX "DesignContract_projectId_checksum_key" ON "DesignContract"("projectId", "checksum");
CREATE INDEX "ProviderRequest_projectId_stage_idx" ON "ProviderRequest"("projectId", "stage");
CREATE INDEX "CostEvent_projectId_stage_idx" ON "CostEvent"("projectId", "stage");

ALTER TABLE "ScriptDocument" ADD CONSTRAINT "ScriptDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScriptVersion" ADD CONSTRAINT "ScriptVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ScriptDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScriptSection" ADD CONSTRAINT "ScriptSection_scriptVersionId_fkey" FOREIGN KEY ("scriptVersionId") REFERENCES "ScriptVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScriptSentence" ADD CONSTRAINT "ScriptSentence_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ScriptSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScriptToken" ADD CONSTRAINT "ScriptToken_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "ScriptSentence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VisualKnowledgeGraphVersion" ADD CONSTRAINT "VisualKnowledgeGraphVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SemanticSpan" ADD CONSTRAINT "SemanticSpan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EntityAlias" ADD CONSTRAINT "EntityAlias_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EntityMention" ADD CONSTRAINT "EntityMention_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EntityMention" ADD CONSTRAINT "EntityMention_semanticSpanId_fkey" FOREIGN KEY ("semanticSpanId") REFERENCES "SemanticSpan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Relation" ADD CONSTRAINT "Relation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Relation" ADD CONSTRAINT "Relation_sourceEntityId_fkey" FOREIGN KEY ("sourceEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Relation" ADD CONSTRAINT "Relation_targetEntityId_fkey" FOREIGN KEY ("targetEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryboardVersion" ADD CONSTRAINT "StoryboardVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetSearchIntent" ADD CONSTRAINT "AssetSearchIntent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetCandidate" ADD CONSTRAINT "AssetCandidate_searchIntentId_fkey" FOREIGN KEY ("searchIntentId") REFERENCES "AssetSearchIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DesignContract" ADD CONSTRAINT "DesignContract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ValidationRun" ADD CONSTRAINT "ValidationRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_validationRunId_fkey" FOREIGN KEY ("validationRunId") REFERENCES "ValidationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QCResult" ADD CONSTRAINT "QCResult_validationRunId_fkey" FOREIGN KEY ("validationRunId") REFERENCES "ValidationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderRequest" ADD CONSTRAINT "ProviderRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CostEvent" ADD CONSTRAINT "CostEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TranscriptAlignment" (
  "id" TEXT NOT NULL, "scriptTokenId" TEXT NOT NULL, "transcriptWordId" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "kind" TEXT NOT NULL, "confidence" DOUBLE PRECISION NOT NULL, CONSTRAINT "TranscriptAlignment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Event" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "graphVersionId" TEXT NOT NULL, "type" TEXT NOT NULL,
  "actors" JSONB NOT NULL, "targets" JSONB NOT NULL, "time" JSONB NOT NULL, "location" JSONB,
  "modality" TEXT NOT NULL, "negated" BOOLEAN NOT NULL, "evidence" JSONB NOT NULL, CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ClaimEvidence" (
  "id" TEXT NOT NULL, "claimId" TEXT NOT NULL, "sourceId" TEXT NOT NULL, "sourceUrl" TEXT, "accessTime" TIMESTAMP(3),
  "quotedSpan" TEXT, "evidence" JSONB NOT NULL, CONSTRAINT "ClaimEvidence_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "VerificationResult" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "claimId" TEXT, "status" TEXT NOT NULL, "asOf" TIMESTAMP(3),
  "evidence" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationResult_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MotionBeat" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "version" INTEGER NOT NULL, "status" TEXT NOT NULL,
  "timing" JSONB NOT NULL, "purpose" TEXT NOT NULL, "semanticSpanIds" JSONB NOT NULL, "sceneType" TEXT NOT NULL,
  "renderStrategy" TEXT NOT NULL, "assets" JSONB NOT NULL, "copy" JSONB NOT NULL, "warnings" JSONB NOT NULL,
  "layout" JSONB NOT NULL, "designContractId" TEXT, "explanation" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MotionBeat_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AssetLicense" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "assetCandidateId" TEXT, "status" TEXT NOT NULL, "name" TEXT,
  "url" TEXT, "attributionRequired" BOOLEAN NOT NULL, "permittedTransformations" JSONB, "policyVersion" TEXT NOT NULL,
  CONSTRAINT "AssetLicense_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AssetAttribution" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "assetCandidateId" TEXT, "creator" TEXT, "rightsHolder" TEXT,
  "text" TEXT, "sourceUrl" TEXT, CONSTRAINT "AssetAttribution_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AssetRendition" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "assetCandidateId" TEXT, "contentHash" TEXT NOT NULL,
  "objectKey" TEXT NOT NULL, "mimeType" TEXT NOT NULL, "width" INTEGER, "height" INTEGER, "duration" DOUBLE PRECISION,
  "codec" TEXT, "alpha" BOOLEAN NOT NULL, "metadata" JSONB NOT NULL, CONSTRAINT "AssetRendition_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AssetSelection" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "motionBeatId" TEXT NOT NULL, "role" TEXT NOT NULL,
  "assetRenditionId" TEXT, "status" TEXT NOT NULL, "locked" BOOLEAN NOT NULL, "version" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AssetSelection_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SkillDefinition" (
  "id" TEXT NOT NULL, "workspaceId" TEXT NOT NULL, "name" TEXT NOT NULL, "trustLevel" TEXT NOT NULL, "source" TEXT NOT NULL,
  CONSTRAINT "SkillDefinition_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SkillVersion" (
  "id" TEXT NOT NULL, "skillDefinitionId" TEXT NOT NULL, "version" TEXT NOT NULL, "checksum" TEXT NOT NULL,
  "capabilities" JSONB NOT NULL, "requiredInputs" JSONB NOT NULL, "designRules" JSONB NOT NULL, "motionRules" JSONB NOT NULL,
  "negativeConstraints" JSONB NOT NULL, "examples" JSONB NOT NULL, "outputContract" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "SkillVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CompositionProject" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "currentVersion" INTEGER NOT NULL, "rootKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CompositionProject_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CompositionSourceVersion" (
  "id" TEXT NOT NULL, "compositionProjectId" TEXT NOT NULL, "graphicId" TEXT, "version" INTEGER NOT NULL,
  "sceneSpecHash" TEXT NOT NULL, "sourceHash" TEXT NOT NULL, "objectKey" TEXT NOT NULL, "dependencies" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CompositionSourceVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RenderManifest" (
  "id" TEXT NOT NULL, "renderJobId" TEXT NOT NULL, "manifestHash" TEXT NOT NULL, "sourceHash" TEXT NOT NULL,
  "dependencies" JSONB NOT NULL, "outputSpecification" JSONB NOT NULL, "runtimeVersions" JSONB NOT NULL, "objectKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "RenderManifest_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AssetUse" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "assetRenditionId" TEXT NOT NULL, "graphicVersionId" TEXT NOT NULL,
  "role" TEXT NOT NULL, CONSTRAINT "AssetUse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TranscriptAlignment_scriptTokenId_transcriptWordId_version_key" ON "TranscriptAlignment"("scriptTokenId", "transcriptWordId", "version");
CREATE INDEX "TranscriptAlignment_transcriptWordId_version_idx" ON "TranscriptAlignment"("transcriptWordId", "version");
CREATE INDEX "Event_projectId_graphVersionId_idx" ON "Event"("projectId", "graphVersionId");
CREATE INDEX "ClaimEvidence_claimId_idx" ON "ClaimEvidence"("claimId");
CREATE INDEX "VerificationResult_projectId_status_idx" ON "VerificationResult"("projectId", "status");
CREATE UNIQUE INDEX "MotionBeat_projectId_id_version_key" ON "MotionBeat"("projectId", "id", "version");
CREATE INDEX "MotionBeat_projectId_status_idx" ON "MotionBeat"("projectId", "status");
CREATE INDEX "AssetLicense_projectId_status_idx" ON "AssetLicense"("projectId", "status");
CREATE INDEX "AssetAttribution_projectId_idx" ON "AssetAttribution"("projectId");
CREATE UNIQUE INDEX "AssetRendition_projectId_contentHash_key" ON "AssetRendition"("projectId", "contentHash");
CREATE UNIQUE INDEX "AssetSelection_projectId_motionBeatId_role_version_key" ON "AssetSelection"("projectId", "motionBeatId", "role", "version");
CREATE INDEX "SkillDefinition_workspaceId_name_idx" ON "SkillDefinition"("workspaceId", "name");
CREATE UNIQUE INDEX "SkillVersion_skillDefinitionId_version_key" ON "SkillVersion"("skillDefinitionId", "version");
CREATE UNIQUE INDEX "SkillVersion_skillDefinitionId_checksum_key" ON "SkillVersion"("skillDefinitionId", "checksum");
CREATE UNIQUE INDEX "CompositionProject_projectId_key" ON "CompositionProject"("projectId");
CREATE UNIQUE INDEX "CompositionSourceVersion_compositionProjectId_graphicId_version_key" ON "CompositionSourceVersion"("compositionProjectId", "graphicId", "version");
CREATE INDEX "CompositionSourceVersion_compositionProjectId_sceneSpecHash_idx" ON "CompositionSourceVersion"("compositionProjectId", "sceneSpecHash");
CREATE UNIQUE INDEX "RenderManifest_renderJobId_manifestHash_key" ON "RenderManifest"("renderJobId", "manifestHash");
CREATE UNIQUE INDEX "AssetUse_assetRenditionId_graphicVersionId_role_key" ON "AssetUse"("assetRenditionId", "graphicVersionId", "role");

ALTER TABLE "TranscriptAlignment" ADD CONSTRAINT "TranscriptAlignment_scriptTokenId_fkey" FOREIGN KEY ("scriptTokenId") REFERENCES "ScriptToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TranscriptAlignment" ADD CONSTRAINT "TranscriptAlignment_transcriptWordId_fkey" FOREIGN KEY ("transcriptWordId") REFERENCES "TranscriptWord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClaimEvidence" ADD CONSTRAINT "ClaimEvidence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VerificationResult" ADD CONSTRAINT "VerificationResult_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VerificationResult" ADD CONSTRAINT "VerificationResult_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MotionBeat" ADD CONSTRAINT "MotionBeat_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetLicense" ADD CONSTRAINT "AssetLicense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetAttribution" ADD CONSTRAINT "AssetAttribution_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetRendition" ADD CONSTRAINT "AssetRendition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetSelection" ADD CONSTRAINT "AssetSelection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillDefinition" ADD CONSTRAINT "SkillDefinition_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillVersion" ADD CONSTRAINT "SkillVersion_skillDefinitionId_fkey" FOREIGN KEY ("skillDefinitionId") REFERENCES "SkillDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompositionProject" ADD CONSTRAINT "CompositionProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompositionSourceVersion" ADD CONSTRAINT "CompositionSourceVersion_compositionProjectId_fkey" FOREIGN KEY ("compositionProjectId") REFERENCES "CompositionProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RenderManifest" ADD CONSTRAINT "RenderManifest_renderJobId_fkey" FOREIGN KEY ("renderJobId") REFERENCES "RenderJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetUse" ADD CONSTRAINT "AssetUse_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetUse" ADD CONSTRAINT "AssetUse_assetRenditionId_fkey" FOREIGN KEY ("assetRenditionId") REFERENCES "AssetRendition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssetUse" ADD CONSTRAINT "AssetUse_graphicVersionId_fkey" FOREIGN KEY ("graphicVersionId") REFERENCES "GraphicVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

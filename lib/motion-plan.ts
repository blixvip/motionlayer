import { z } from "zod";

export const graphicTypes = ["hook-title", "lower-third", "stat-card", "step-list", "pull-quote"] as const;
export const sceneArchetypes = ["overlay", "full-frame-ui", "illustrated", "dimensional", "typographic"] as const;
export const renderEngines = ["hyperframes", "after-effects", "remotion", "manim", "external"] as const;
export const visualAssetKinds = ["logo", "icon", "image", "map", "webpage"] as const;

export const motionWarningSchema = z.object({
  type: z.enum(["SCRIPT_FACT_CONFLICT", "AMBIGUITY", "LOW_CONFIDENCE", "LICENSE_BLOCKED", "TIMING_UNCERTAIN"]),
  message: z.string().min(1),
  approvalRequired: z.boolean(),
});

export const beatClassificationSchema = z.object({
  id: z.string().min(1),
  startSeconds: z.number().min(0),
  endSeconds: z.number().positive(),
  classification: z.enum(["VISUAL", "REST"]),
  reason: z.string().min(1),
}).refine((beat) => beat.endSeconds > beat.startSeconds, "Beat end time must follow start time");

export const motionMomentSchema = z.object({
  id: z.string().regex(/^mg_[a-z0-9_]+$/),
  startSeconds: z.number().min(0),
  endSeconds: z.number().positive(),
  transcriptExcerpt: z.string().min(1),
  purpose: z.enum(["clarify", "emphasize", "compare", "orient", "prove", "transition"]),
  type: z.enum(graphicTypes),
  archetype: z.enum(sceneArchetypes).optional(),
  renderEngine: z.enum(renderEngines).optional(),
  accentWord: z.string().max(40).optional(),
  priority: z.enum(["essential", "helpful", "optional"]),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  content: z.object({
    headline: z.string(),
    supportingText: z.string(),
    data: z.array(z.string()),
  }),
  layout: z.object({
    preferredRegion: z.string(),
    avoidRegions: z.array(z.string()),
    safeZoneNotes: z.string(),
  }),
  motion: z.object({
    entry: z.string(),
    hold: z.string(),
    exit: z.string(),
    energy: z.number().min(0).max(1),
  }),
  visual: z.object({
    scale: z.number().min(0.7).max(1.4).optional(),
    textAlign: z.enum(["left", "center", "right"]).optional(),
    treatment: z.enum(["solid", "outline", "minimal"]).optional(),
    accentRole: z.enum(["registration", "neutral", "accepted", "suggested"]).optional(),
  }).optional(),
  semanticSpanIds: z.array(z.string()).optional(),
  interpretation: z.object({
    normalizedMeaning: z.string(),
    literalness: z.enum(["literal", "metaphorical", "ambiguous"]),
    modality: z.enum(["asserted", "possible", "alleged", "quoted"]),
    negated: z.boolean(),
  }).optional(),
  warnings: z.array(motionWarningSchema).optional(),
  asset: z.object({
    kind: z.enum(visualAssetKinds),
    entity: z.string().min(1).max(120),
    query: z.string().min(1).max(240),
    localPath: z.string().max(500).optional(),
    mimeType: z.string().max(100).optional(),
    source: z.string().max(120).optional(),
    status: z.enum(["needed", "resolved", "unavailable"]),
    usageStatus: z.enum(["approved", "preview-only", "blocked"]).optional(),
    provenance: z.object({
      provider: z.string(),
      canonicalSourceUrl: z.string().url().optional(),
      retrievedAt: z.string().datetime().optional(),
      licenseStatus: z.enum(["provider-terms", "verified-license", "user-provided", "official-source", "unknown"]),
      licenseName: z.string().optional(),
      licenseUrl: z.string().url().optional(),
      attributionRequired: z.boolean(),
      contentHash: z.string().regex(/^sha256:/).optional(),
    }).optional(),
  }).optional(),
  sourceEvidence: z.object({
    transcriptStart: z.number().min(0),
    transcriptEnd: z.number().positive(),
    requiresVerification: z.boolean(),
  }),
  requiresAsset: z.boolean(),
  status: z.enum(["suggested", "accepted", "rejected", "generating", "ready", "failed", "outdated"]),
}).refine((item) => item.endSeconds > item.startSeconds, "End time must follow start time");

export const motionPlanSchema = z.object({
  projectSummary: z.string(),
  sourceLocked: z.literal(true),
  styleIntent: z.string(),
  density: z.enum(["sparse", "balanced", "energetic", "custom"]),
  beatClassifications: z.array(beatClassificationSchema).optional(),
  restRatio: z.number().min(0).max(1).optional(),
  recurringElements: z.array(z.string()).optional(),
  paletteEvidence: z.string().optional(),
  semanticGraphId: z.string().optional(),
  storyboardId: z.string().optional(),
  timingBasis: z.enum(["estimated-script", "aligned-narration", "final-video"]).optional(),
  moments: z.array(motionMomentSchema).max(24),
});

export type MotionMoment = z.infer<typeof motionMomentSchema>;
export type MotionPlan = z.infer<typeof motionPlanSchema>;

export function assertEvidenceVerified(moment: MotionMoment) {
  if (moment.warnings?.some((warning) => warning.approvalRequired)) {
    throw new Error("Resolve required ambiguity or fact warnings before approving this graphic.");
  }
  if (moment.sourceEvidence.requiresVerification && /\d/.test(moment.content.headline + moment.content.supportingText)) {
    throw new Error("Verify the source number before approving this graphic.");
  }
  return true;
}

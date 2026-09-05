import { createHash } from "node:crypto";
import { z } from "zod";

export const assetSearchIntentSchema = z.object({
  purpose: z.string(),
  canonicalEntityId: z.string().optional(),
  queries: z.array(z.string()).min(1),
  timeContext: z.string().optional(),
  orientation: z.enum(["landscape", "portrait", "square", "any"]).default("any"),
  mediaType: z.enum(["logo", "image", "video", "screenshot", "icon"]),
  negativeMeanings: z.array(z.string()).default([]),
});

export const providerCandidateSchema = z.object({
  provider: z.string(),
  providerAssetId: z.string(),
  canonicalSourceUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  mediaType: z.string(),
  creator: z.string().optional(),
  license: z.object({ status: z.enum(["official-source", "provider-terms", "licensed", "public-domain", "unknown"]), name: z.string().optional(), url: z.string().url().optional(), attributionRequired: z.boolean() }),
  identityConfidence: z.number().min(0).max(1),
  contextConfidence: z.number().min(0).max(1),
  securityStatus: z.enum(["pending", "safe", "rejected"]),
});

export type AssetSearchIntent = z.infer<typeof assetSearchIntentSchema>;
export type ProviderCandidate = z.infer<typeof providerCandidateSchema>;

export interface AssetProvider {
  readonly id: string;
  readonly enabled: boolean;
  search(intent: AssetSearchIntent, signal?: AbortSignal): Promise<ProviderCandidate[]>;
}

export function candidateUsageStatus(candidate: ProviderCandidate) {
  if (candidate.securityStatus !== "safe") return "blocked" as const;
  if (candidate.license.status === "unknown") return "preview-only" as const;
  return "approved" as const;
}

/** Deterministic development provider; it never performs network I/O. */
export class FakeAssetProvider implements AssetProvider {
  readonly id = "fake-local";
  readonly enabled = true;

  async search(rawIntent: AssetSearchIntent): Promise<ProviderCandidate[]> {
    const intent = assetSearchIntentSchema.parse(rawIntent);
    const seed = createHash("sha256").update(JSON.stringify(intent)).digest("hex").slice(0, 16);
    return [{
      provider: this.id,
      providerAssetId: `fixture-${seed}`,
      canonicalSourceUrl: `https://fixtures.motionlayer.invalid/assets/${seed}`,
      mediaType: intent.mediaType,
      creator: "MotionLayer fixture",
      license: { status: "provider-terms", name: "Fixture development license", url: "https://fixtures.motionlayer.invalid/terms", attributionRequired: false },
      identityConfidence: intent.canonicalEntityId ? 0.99 : 0.7,
      contextConfidence: 0.95,
      securityStatus: "safe",
    }];
  }
}

import { describe, expect, it, vi } from "vitest";
import { buildDirectedMotionPlan, fallbackTranscriptDecision } from "@/lib/transcript-director";

describe("transcript director", () => {
  it("recognizes an explicit logo mention as a real asset need", () => {
    const result = fallbackTranscriptDecision({ id: "b1", startSeconds: 2, endSeconds: 5, text: "Put the OpenAI logo next to the title." });
    expect(result.visual).toBe("logo");
    expect(result.entity.toLowerCase()).toContain("openai");
  });

  it("turns timestamped semantics into sparse asset-aware motion", async () => {
    const plan = await buildDirectedMotionPlan([
      { id: "s1", startSeconds: 0, endSeconds: 5, text: "Let me explain why this matters." },
      { id: "s2", startSeconds: 5, endSeconds: 10, text: "The OpenAI logo represents the company here." },
      { id: "s3", startSeconds: 10, endSeconds: 16, text: "The result improved by 42 percent." },
      { id: "s4", startSeconds: 16, endSeconds: 24, text: "First plan the idea, then animate the important moment." },
    ], 24, { fetcher: vi.fn().mockRejectedValue(new Error("offline")) as typeof fetch });

    expect(plan.moments.some((moment) => moment.asset?.kind === "logo" && moment.asset.status === "needed")).toBe(true);
    expect(plan.moments.some((moment) => moment.type === "stat-card")).toBe(true);
    expect(plan.beatClassifications?.some((beat) => beat.classification === "REST")).toBe(true);
    expect(plan.moments.every((moment) => moment.sourceEvidence.transcriptEnd <= 24)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { demoPlan } from "@/lib/demo-data";
import { assertEvidenceVerified, motionPlanSchema } from "@/lib/motion-plan";

describe("motion plan validation", () => {
  it("accepts the fixture plan and preserves the locked source", () => {
    const plan = motionPlanSchema.parse(demoPlan);
    expect(plan.sourceLocked).toBe(true);
    expect(plan.moments).toHaveLength(5);
  });

  it("blocks unverified numbers from approval", () => {
    expect(() => assertEvidenceVerified(demoPlan.moments[4])).toThrow(/Verify the source number/);
  });

  it("rejects a reversed time range", () => {
    const bad = structuredClone(demoPlan);
    bad.moments[0].endSeconds = bad.moments[0].startSeconds;
    expect(() => motionPlanSchema.parse(bad)).toThrow();
  });

  it("accepts plan-first coverage, engine choice, and palette evidence", () => {
    const enriched = structuredClone(demoPlan);
    enriched.beatClassifications = [
      { id: "beat_1", startSeconds: 0, endSeconds: 3.5, classification: "REST", reason: "Opening speaker connection" },
      { id: "beat_2", startSeconds: 3.5, endSeconds: 7.4, classification: "VISUAL", reason: "Foundational locked-source rule" },
    ];
    enriched.restRatio = 0.2;
    enriched.paletteEvidence = "Chartreuse sampled from the approved project mark.";
    enriched.moments[0].archetype = "overlay";
    enriched.moments[0].renderEngine = "hyperframes";
    enriched.moments[0].accentWord = "Protect";

    const parsed = motionPlanSchema.parse(enriched);
    expect(parsed.beatClassifications?.[0].classification).toBe("REST");
    expect(parsed.moments[0].renderEngine).toBe("hyperframes");
  });
});

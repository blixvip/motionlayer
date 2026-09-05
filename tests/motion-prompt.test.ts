import { describe, expect, it } from "vitest";
import { demoPlan } from "@/lib/demo-data";
import { applyMotionPromptPatches, fallbackMotionPrompt, motionPromptRequestSchema, resolvePromptTargetIds } from "@/lib/motion-prompt";

describe("motion prompt engine", () => {
  it("applies a whole-project direction to every graphic", () => {
    const request = motionPromptRequestSchema.parse({ prompt: "Make all motion calmer and use a soft fade", scope: "whole-project", selectedId: "mg_steps", plan: demoPlan });
    const ids = resolvePromptTargetIds(request);
    const result = fallbackMotionPrompt(request, ids);
    const moments = applyMotionPromptPatches(demoPlan, result.patches, ids);
    expect(result.patches).toHaveLength(demoPlan.moments.length);
    expect(moments.every((moment, index) => moment.motion.energy < demoPlan.moments[index].motion.energy)).toBe(true);
    expect(moments.every((moment) => moment.motion.entry === "soft eased fade")).toBe(true);
  });

  it("changes visible design properties while preserving evidence", () => {
    const original = demoPlan.moments.find((moment) => moment.id === "mg_steps")!;
    const moments = applyMotionPromptPatches(demoPlan, [{
      id: original.id,
      explanation: "Move and enlarge the selected graphic.",
      layout: { preferredRegion: "lower-left" },
      visual: { scale: 1.2, textAlign: "center", treatment: "outline" },
    }], [original.id]);
    const revised = moments.find((moment) => moment.id === original.id)!;
    expect(revised.layout.preferredRegion).toBe("lower-left");
    expect(revised.visual).toMatchObject({ scale: 1.2, textAlign: "center", treatment: "outline" });
    expect(revised.sourceEvidence).toEqual(original.sourceEvidence);
    expect(revised.transcriptExcerpt).toBe(original.transcriptExcerpt);
    expect(revised.status).toBe("ready");
  });

  it("never lets patches escape their selected scope", () => {
    const moments = applyMotionPromptPatches(demoPlan, [{
      id: "mg_quote",
      explanation: "This must be ignored outside scope.",
      content: { headline: "Wrong target" },
    }], ["mg_steps"]);
    expect(moments).toEqual(demoPlan.moments);
  });
});

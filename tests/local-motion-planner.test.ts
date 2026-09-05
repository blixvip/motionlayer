import { describe, expect, it } from "vitest";
import { buildMotionPlan } from "@/lib/local-motion-planner";

describe("local motion planner", () => {
  it("turns transcript evidence into sparse, timed motion beats", () => {
    const plan = buildMotionPlan([
      { id: "t1", startSeconds: 0, endSeconds: 3.1, text: "This is the core idea behind a better motion layer.", confidence: 0.94 },
      { id: "t2", startSeconds: 3.1, endSeconds: 6.2, text: "First understand the words, second plan the visuals, third animate them.", confidence: 0.91 },
      { id: "t3", startSeconds: 6.2, endSeconds: 9.8, text: "The speaker should stay visible while the frame breathes.", confidence: 0.9 },
      { id: "t4", startSeconds: 9.8, endSeconds: 13.5, text: "That process removes 3 common editing mistakes.", confidence: 0.89 },
    ], 13.5);

    expect(plan.sourceLocked).toBe(true);
    expect(plan.moments.length).toBeGreaterThan(0);
    expect(plan.moments.length).toBeLessThan(4);
    expect(plan.moments.every((moment) => moment.endSeconds > moment.startSeconds)).toBe(true);
    expect(plan.moments.every((moment) => moment.renderEngine === "hyperframes")).toBe(true);
    expect(plan.beatClassifications?.some((beat) => beat.classification === "REST")).toBe(true);
  });

  it("rejects a video with no speech evidence", () => {
    expect(() => buildMotionPlan([], 10)).toThrow("TRANSCRIPT_EMPTY");
  });
});

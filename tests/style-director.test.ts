import { describe, expect, it } from "vitest";
import { ANTI_SLOP_CONSTRAINTS, DEFAULT_STYLE_DIRECTION, getStyleDirectorProfile, referenceMode, resolveStyleDirection, styleDirectionReceipt } from "../lib/style-director";

describe("style director", () => {
  it("uses a restrained editorial default", () => {
    expect(resolveStyleDirection()).toEqual(DEFAULT_STYLE_DIRECTION);
    expect(ANTI_SLOP_CONSTRAINTS).toContain("Never repeat the same centered title-card layout across consecutive beats");
  });

  it("resolves a curated profile into a render receipt", () => {
    const direction = resolveStyleDirection({ profileId: "field-notes", density: "balanced", motion: "expressive", referenceNotes: "Keep it documentary." });
    expect(getStyleDirectorProfile(direction.profileId).palette.accent).toBe("#d24b32");
    expect(styleDirectionReceipt(direction)).toMatchObject({ profileLabel: "Field notes", density: "balanced", motion: "expressive", grammar: "documentary field notes", referenceMode: "quiet" });
  });

  it("turns concise creative notes into planning and motion modes", () => {
    expect(referenceMode(resolveStyleDirection({ referenceNotes: "Keep this quiet and documentary." }))).toBe("quiet");
    expect(referenceMode(resolveStyleDirection({ referenceNotes: "Make the cuts punchy and kinetic." }))).toBe("kinetic");
    expect(referenceMode(resolveStyleDirection({ referenceNotes: "Favor precise hierarchy." }))).toBe("neutral");
  });

  it("falls back safely when persisted data is invalid", () => {
    expect(resolveStyleDirection({ profileId: "unknown" as "editorial-proof" })).toEqual(DEFAULT_STYLE_DIRECTION);
  });
});

import { describe, expect, it } from "vitest";
import { analyzeScriptCopy, parseTimestampedScript } from "@/lib/script-understanding";

describe("script word checking", () => {
  it("corrects high-confidence entity transcripts while preserving review-only guesses", () => {
    const result = analyzeScriptCopy("Invidia posted Kimmy3 on build-vodkaia. It competes with Fable 5.");
    expect(result.correctedScript).toContain("NVIDIA posted Kimi K3 on build.nvidia.com");
    expect(result.correctedScript).toContain("Fable 5");
    expect(result.suggestions.find((item) => item.original === "Fable 5")?.status).toBe("review");
  });

  it("keeps the supplied duration and merges zero-length bridge cues", () => {
    const cues = parseTimestampedScript("[00:00 - 00:02] Invidia\n\n[00:02 - 00:02] or\n\n[00:02 - 00:05] Cloud Code");
    expect(cues).toHaveLength(2);
    expect(cues[0].checkedText).toBe("NVIDIA");
    expect(cues[1]).toMatchObject({ startSeconds: 2, endSeconds: 5, checkedText: "or Claude Code" });
  });
});

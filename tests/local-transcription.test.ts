import { describe, expect, it } from "vitest";
import { coalesceTranscriptSegmentsForCleanup, getWhisperBinDir, groupTranscriptWords } from "@/lib/local-transcription";
import { resolveLocalObjectKey } from "@/lib/storage";

describe("local transcription pipeline", () => {
  it("groups word timestamps into readable evidence-preserving segments", () => {
    const segments = groupTranscriptWords([
      { text: "so", start: 0, end: 0.2, confidence: 0.8 },
      { text: "um", start: 0.2, end: 0.4, confidence: 0.9 },
      { text: "hello.", start: 0.4, end: 1.8, confidence: 1 },
      { text: "Next", start: 2.8, end: 3.1 },
      { text: "idea.", start: 3.1, end: 4.5 },
    ]);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ id: "t_0001", startSeconds: 0, endSeconds: 1.8, text: "so um hello." });
    expect(segments[0].confidence).toBeCloseTo(0.9);
    expect(segments[1].text).toBe("Next idea.");
  });

  it("rejects source keys that escape local object storage", () => {
    expect(() => resolveLocalObjectKey("../../private.txt")).toThrow("INVALID_OBJECT_PATH");
  });

  it("keeps nearby corrections in one S1-mini context window", () => {
    const chunks = coalesceTranscriptSegmentsForCleanup([
      { id: "t_0001", startSeconds: 0.13, endSeconds: 4.36, text: "So, um, send it Friday." },
      { id: "t_0002", startSeconds: 4.49, endSeconds: 6.8, text: "No, wait, make that Thursday." },
    ]);
    expect(chunks).toEqual([{
      id: "c_0001",
      startSeconds: 0.13,
      endSeconds: 6.8,
      text: "So, um, send it Friday. No, wait, make that Thursday.",
    }]);
  });

  it("resolves the pinned user-local whisper.cpp runtime", () => {
    expect(getWhisperBinDir({ LOCALAPPDATA: "C:\\Local" })).toBe("C:\\Local\\MotionLayer\\tools\\whisper.cpp\\b4938");
  });
});

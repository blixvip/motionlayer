import { describe, expect, it } from "vitest";
import { durationWithinOneFrame, formatTimecode, secondsToFrames } from "@/lib/timing";

describe("timing math", () => {
  it("quantizes seconds to frames", () => expect(secondsToFrames(3.5, 30)).toBe(105));
  it("accepts output duration within one frame", () => expect(durationWithinOneFrame(18, 18.03, 30)).toBe(true));
  it("rejects duration drift", () => expect(durationWithinOneFrame(18, 18.2, 30)).toBe(false));
  it("formats frame timecode", () => expect(formatTimecode(1.5, 30)).toBe("00:00:01:15"));
});

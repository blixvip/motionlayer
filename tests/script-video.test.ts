import { describe, expect, it } from "vitest";
import { scenesFromScript, scriptVideoDimensions } from "../lib/script-video";

describe("script video scene planning", () => {
  it("keeps every word while splitting long scripts into timed scenes", () => {
    const script = "One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty.";
    const scenes = scenesFromScript(script, { density: "balanced" });
    expect(scenes).toHaveLength(2);
    expect(scenes.map((scene) => scene.text).join(" ")).toBe(script);
    expect(scenes[1].start).toBe(scenes[0].duration);
  });

  it("produces stable scene timing for the same script", () => {
    const script = "Motion should make an idea easier to understand. Every scene should earn its place.";
    expect(scenesFromScript(script)).toEqual(scenesFromScript(script));
  });

  it("keeps decimals, version numbers, and domains inside their sentences", () => {
    const script = "Revenue grew 12.5% after v2.4 shipped. Visit example.com for proof!";
    const scenes = scenesFromScript(script);
    expect(scenes.map((scene) => scene.text)).toEqual([
      "Revenue grew 12.5% after v2.4 shipped.",
      "Visit example.com for proof!",
    ]);
    expect(scenes.map((scene) => scene.text).join(" ")).toBe(script);
    expect(scenes[0].kind).toBe("editorial-proof");
    expect(scenes[1].start).toBe(scenes[0].duration);
  });

  it("preserves closing quotes and repeated punctuation at sentence boundaries", () => {
    const script = 'She said "Ready?" Then we launched... It worked!';
    const scenes = scenesFromScript(script);
    expect(scenes.map((scene) => scene.text).join(" ")).toBe(script);
    expect(scenes[0].text).toBe('She said "Ready?"');
    expect(scenes.every((scene) => /\p{L}/u.test(scene.text))).toBe(true);
  });

  it("uses supplied timestamps and removes timestamp labels from scene copy", () => {
    const script = `[00:00 - 00:03] First visual beat.\n\n[00:03 - 00:06] Second visual beat.`;
    const scenes = scenesFromScript(script);
    expect(scenes).toHaveLength(2);
    expect(scenes[0]).toMatchObject({ start: 0, duration: 3, text: "First visual beat." });
    expect(scenes[1]).toMatchObject({ start: 3, duration: 3, text: "Second visual beat." });
    expect(scenes.at(-1)!.start + scenes.at(-1)!.duration).toBe(6);
  });

  it("folds a zero-length bridge word into the next cue", () => {
    const scenes = scenesFromScript(`[00:34 - 00:34] or\n\n[00:34 - 00:36] Cloud Code Subscription, right?`);
    expect(scenes).toHaveLength(1);
    expect(scenes[0]).toMatchObject({ start: 34, duration: 2, text: "or Claude Code Subscription, right?" });
  });

  it("uses native canvas dimensions for landscape and short-form renders", () => {
    expect(scriptVideoDimensions("landscape")).toEqual({ width: 1920, height: 1080 });
    expect(scriptVideoDimensions("short-form")).toEqual({ width: 1080, height: 1920 });
  });

  it("uses semantic scene roles instead of repeating generic title cards", () => {
    const script = "The old workflow is fast but it all looks the same. First establish a visual grammar. Then show the proof with 42 tested examples. Finish with a clear authored takeaway.";
    const scenes = scenesFromScript(script, { density: "balanced" });
    expect(scenes.map((scene) => scene.kind)).toEqual([
      "editorial-contrast",
      "editorial-statement",
      "editorial-proof",
      "editorial-close",
    ]);
    expect(scenes.every((scene) => scene.kind !== "generic")).toBe(true);
  });

  it("reserves sequence layouts for scripts with multiple real steps", () => {
    const [scene] = scenesFromScript("First choose the source, then verify the claim, finally render the result.");
    expect(scene.kind).toBe("editorial-sequence");
  });

  it("uses sparse direction to reduce scene churn without losing words", () => {
    const script = "One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour.";
    const sparse = scenesFromScript(script, { density: "sparse" });
    const balanced = scenesFromScript(script, { density: "balanced" });
    expect(sparse.length).toBeLessThanOrEqual(balanced.length);
    expect(sparse.map((scene) => scene.text).join(" ")).toBe(script);
  });
});

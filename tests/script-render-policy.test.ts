import { describe, expect, it } from "vitest";
import { editorialCompositionHtml } from "@/lib/editorial-script-video";
import { scenesFromScript } from "@/lib/script-video";
import { SCRIPT_RENDER_POLICY } from "@/lib/script-render-policy";

describe("directed script render policy", () => {
  it("keeps word checking, native layouts, depth, and validation mandatory", () => {
    expect(SCRIPT_RENDER_POLICY.wordCheckRequired).toBe(true);
    expect(SCRIPT_RENDER_POLICY.nativeAspectLayouts).toBe(true);
    expect(SCRIPT_RENDER_POLICY.validationRequired).toBe(true);
    expect(SCRIPT_RENDER_POLICY.skills).toContain("shader-craft");
    expect(SCRIPT_RENDER_POLICY.skills).toContain("hyperframes-registry");
  });

  it("authors a seek-safe deterministic shader in both native aspect ratios", () => {
    const scenes = scenesFromScript("A restrained visual idea becomes clear through purposeful motion.");
    const landscape = editorialCompositionHtml(scenes, "landscape");
    const vertical = editorialCompositionHtml(scenes, "short-form");

    expect(landscape).toContain('id="motionlayer-depth-shader"');
    expect(landscape).toContain('width="960" height="540"');
    expect(vertical).toContain('width="540" height="960"');
    expect(landscape).toContain('getContext("webgl2"');
    expect(landscape).toContain("tl.to(depthState");
    expect(landscape).not.toContain("requestAnimationFrame");
  });

  it("renders profiles as distinct material systems and wires direction into motion", () => {
    const scenes = scenesFromScript("The old workflow is fast but every output looks the same. 42 examples prove the method. Finish with one authored result.", { density: "balanced" });
    const proof = editorialCompositionHtml(scenes, "landscape", { profileId: "editorial-proof", motion: "restrained", referenceNotes: "quiet" });
    const notes = editorialCompositionHtml(scenes, "landscape", { profileId: "field-notes", motion: "expressive", referenceNotes: "kinetic" });
    const blueprint = editorialCompositionHtml(scenes, "landscape", { profileId: "blueprint", motion: "restrained", referenceNotes: "precise" });

    expect(notes).toContain('class="profile-field-notes motion-expressive note-kinetic"');
    expect(notes).toContain('assets/field-notes-pencil.svg');
    expect(blueprint).toContain('assets/blueprint-grid.svg');
    expect(proof).not.toEqual(notes);
    expect(notes).not.toEqual(blueprint);
    expect(proof).toContain("duration:0.78");
    expect(notes).toContain("duration:0.42");
    expect(notes).not.toMatch(/>THESIS<|>CONTRAST<|>PROOF<|>TAKEAWAY</);
    expect(notes).not.toContain('class="role"');
  });
});

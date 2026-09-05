import { describe, expect, it } from "vitest";
import { compareManifests } from "@/lib/manifest";

describe("render manifest QC", () => {
  it("passes an aligned locked-source render", () => {
    const source = { duration: 18, fps: 30, width: 1280, height: 720, frameCount: 540, alpha: false };
    expect(Object.values(compareManifests(source, { ...source })).every(Boolean)).toBe(true);
  });
  it("requires alpha for overlays", () => {
    const source = { duration: 18, fps: 30, width: 1280, height: 720, frameCount: 540, alpha: false };
    expect(compareManifests(source, source, true).alpha).toBe(false);
  });
});

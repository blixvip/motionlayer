import { durationWithinOneFrame } from "./timing";

export type RenderManifest = { duration: number; fps: number; width: number; height: number; frameCount: number; alpha: boolean };

export function compareManifests(source: RenderManifest, output: RenderManifest, expectAlpha = false) {
  return {
    duration: durationWithinOneFrame(source.duration, output.duration, source.fps),
    fps: source.fps === output.fps,
    dimensions: source.width === output.width && source.height === output.height,
    frameCount: Math.abs(source.frameCount - output.frameCount) <= 1,
    alpha: !expectAlpha || output.alpha,
  };
}

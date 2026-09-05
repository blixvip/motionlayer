export const secondsToFrames = (seconds: number, fps: number) => Math.round(seconds * fps);
export const framesToSeconds = (frames: number, fps: number) => frames / fps;
export const durationWithinOneFrame = (source: number, output: number, fps: number) => Math.abs(source - output) <= 1 / fps;
export const formatTimecode = (seconds: number, fps = 30) => {
  const totalFrames = Math.max(0, Math.round(seconds * fps));
  const frames = totalFrames % fps;
  const totalSeconds = Math.floor(totalFrames / fps);
  const secs = totalSeconds % 60;
  const mins = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return [hours, mins, secs, frames].map((value) => String(value).padStart(2, "0")).join(":");
};

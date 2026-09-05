export type Rect = { x: number; y: number; width: number; height: number };

export const overlapRatio = (a: Rect, b: Rect) => {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  const intersection = width * height;
  return intersection / Math.max(1, a.width * a.height);
};

export const collidesWithProtectedRegion = (graphic: Rect, protectedRegions: Rect[], threshold = 0.08) =>
  protectedRegions.some((region) => overlapRatio(graphic, region) > threshold);

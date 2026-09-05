import { describe, expect, it } from "vitest";
import { collidesWithProtectedRegion, overlapRatio } from "@/lib/collision";

describe("collision rules", () => {
  it("reports material overlap", () => expect(overlapRatio({ x: 0, y: 0, width: 100, height: 100 }, { x: 50, y: 0, width: 100, height: 100 })).toBe(.5));
  it("keeps a clear placement", () => expect(collidesWithProtectedRegion({ x: 0, y: 0, width: 100, height: 100 }, [{ x: 200, y: 200, width: 50, height: 50 }])).toBe(false));
});

import { describe, expect, it } from "vitest";
import { resolveAffectedIds } from "@/lib/prompt-scope";

describe("prompt scope", () => {
  it("does not change unrelated graphics for a local prompt", () => {
    expect(resolveAffectedIds("selected-graphic", "mg_steps", ["mg_steps", "mg_quote"])).toEqual(["mg_steps"]);
  });
  it("can intentionally address a whole project", () => {
    expect(resolveAffectedIds("whole-project", "mg_steps", ["mg_steps", "mg_quote"])).toEqual(["mg_steps", "mg_quote"]);
  });
  it("uses the active range when a timed beat is scoped", () => {
    expect(resolveAffectedIds("selected-range", "mg_steps", ["mg_steps", "mg_quote"], [], ["mg_steps", "mg_quote"])).toEqual(["mg_steps", "mg_quote"]);
  });
});

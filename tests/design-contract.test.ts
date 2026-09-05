import { describe, expect, it } from "vitest";
import { compileDesignContract } from "@/lib/design-contract";
import { FakeAssetProvider, candidateUsageStatus } from "@/packages/asset-providers";

describe("design contract compilation", () => {
  it("applies deterministic precedence and records material conflicts", () => {
    const contract = compileDesignContract([
      { source: { type: "skill", id: "editorial", version: "1.3.0" }, tokens: { colors: { accent: "orange" } }, motionGrammar: { energy: 0.7 }, compositionRules: [], assetRules: [], negativeConstraints: ["no bounce"], aspectRatioOverrides: {} },
      { source: { type: "brand-kit", id: "brand_2", version: 4 }, tokens: { colors: { accent: "blue" } }, motionGrammar: { energy: 0.4 }, compositionRules: [], assetRules: [], negativeConstraints: [], aspectRatioOverrides: {} },
    ]);
    expect(contract.tokens.colors.accent).toBe("blue");
    expect(contract.motionGrammar.energy).toBe(0.4);
    expect(contract.conflicts.some((conflict) => conflict.field === "tokens.colors.accent")).toBe(true);
    expect(contract.checksum).toMatch(/^sha256:/);
  });
});

describe("asset provider policy", () => {
  it("uses typed fake-provider metadata and never guesses licensing", async () => {
    const [candidate] = await new FakeAssetProvider().search({ purpose: "identity", canonicalEntityId: "company:anthropic", queries: ["Anthropic official logo"], orientation: "any", mediaType: "logo", negativeMeanings: [] });
    expect(candidateUsageStatus(candidate)).toBe("approved");
    expect(candidate.provider).toBe("fake-local");
  });
});

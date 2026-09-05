import { describe, expect, it } from "vitest";
import { analyzeSemanticTranscript } from "@/lib/semantic-analysis";
import { buildVisualOpportunities, motionMomentFromOpportunity, optimizeStoryboard } from "@/lib/visual-opportunity";

function segments(lines: string[]) {
  return lines.map((text, index) => ({ id: `s${index + 1}`, startSeconds: index * 6, endSeconds: index * 6 + 5.5, text, confidence: .93 }));
}

describe("open-vocabulary semantic analysis", () => {
  it("resolves Apple from full contextual meaning", () => {
    const corporate = analyzeSemanticTranscript(segments(["Apple entered the AI race."]));
    const physical = analyzeSemanticTranscript(segments(["I ate an apple before the race."]));
    expect(corporate.entities.some((entity) => entity.id === "company:apple")).toBe(true);
    expect(corporate.relations[0]).toMatchObject({ type: "competition", literalness: "metaphorical" });
    expect(physical.entities.some((entity) => entity.id === "object:apple_fruit")).toBe(true);
    expect(physical.entities.some((entity) => entity.id === "company:apple")).toBe(false);
  });

  it("preserves metaphor, identity, and the Sam Altman title conflict", () => {
    const graph = analyzeSemanticTranscript(segments(["Anthropic is starting wars with OpenAI's owner Sam Altman."]));
    expect(graph.relations[0]).toMatchObject({ type: "competition", literalness: "metaphorical", negated: false });
    expect(graph.entities.map((entity) => entity.id)).toEqual(expect.arrayContaining(["company:anthropic", "company:openai", "person:sam_altman"]));
    expect(graph.warnings.some((warning) => warning.type === "FACT_REVIEW" && warning.approvalRequired)).toBe(true);
    expect(graph.claims[0].suggestedLabel).toBe("Sam Altman — CEO, OpenAI");
  });

  it("resolves misspellings without overwriting source wording", () => {
    const graph = analyzeSemanticTranscript(segments(["Antropic launched a new model."]));
    expect(graph.spans[0].verbatimText).toContain("Antropic");
    expect(graph.entities.find((entity) => entity.id === "company:anthropic")?.correction).toMatchObject({ original: "Antropic", proposed: "Anthropic" });
    expect(graph.warnings.some((warning) => warning.type === "PROPOSED_CORRECTION")).toBe(true);
  });

  it("treats Claude attacking a benchmark as model performance, not violence", () => {
    const graph = analyzeSemanticTranscript(segments(["Claude attacked the benchmark."]));
    expect(graph.entities.some((entity) => entity.id === "model:claude")).toBe(true);
    expect(graph.relations[0]).toMatchObject({ type: "performance", literalness: "metaphorical" });
    expect(graph.warnings.some((warning) => warning.type === "METAPHOR")).toBe(true);
  });

  it("requires review when Meta lacks enough context", () => {
    const graph = analyzeSemanticTranscript(segments(["Meta changed everything."]));
    expect(graph.entities.find((entity) => entity.id === "ambiguous:meta")?.resolutionStatus).toBe("needs-review");
    expect(graph.spans[0].ambiguities[0].options).toContain("Meta Platforms");
    expect(graph.warnings.some((warning) => warning.type === "AMBIGUOUS_IDENTITY" && warning.approvalRequired)).toBe(true);
  });

  it.each([
    ["OpenAI did not buy Company X.", true, "asserted"],
    ["OpenAI might buy Company X.", false, "possible"],
    ["Unlike Anthropic, Company Y did not release a model.", true, "asserted"],
  ] as const)("preserves negation and modality for %s", (text, negated, modality) => {
    const graph = analyzeSemanticTranscript(segments([text]));
    expect(graph.spans[0].interpretation).toMatchObject({ negated, modality });
    if (/buy/i.test(text)) expect(graph.relations[0]).toMatchObject({ type: "acquisition", negated, modality });
  });

  it("keeps a quote attributed instead of promoting it to narrator fact", () => {
    const graph = analyzeSemanticTranscript([{ ...segments(["The source said, “OpenAI bought the moon.”"])[0], speaker: "HOST" }]);
    expect(graph.claims[0]).toMatchObject({ status: "quotation", modality: "quoted", speaker: "HOST" });
  });
});

describe("global storyboard optimizer", () => {
  it("keeps a sparse plan and applies entity recurrence cooldown", () => {
    const source = segments([
      "OpenAI launched a model.",
      "OpenAI improved the model.",
      "OpenAI changed the benchmark.",
      "The result improved by 42 percent.",
    ]);
    const graph = analyzeSemanticTranscript(source);
    const storyboard = optimizeStoryboard(graph, source, 24, { density: "balanced", maxGraphics: 3, minimumGapSeconds: 2 });
    const openAiHits = storyboard.opportunities.filter((item) => item.selected && graph.spans.find((span) => span.id === item.semanticSpanIds[0])?.entityIds.includes("company:openai"));
    expect(openAiHits).toHaveLength(1);
    expect(storyboard.opportunities.some((item) => item.rejectedReason?.includes("recurrence cooldown"))).toBe(true);
  });

  it("can create a visual from a phrase the optimizer skipped", () => {
    const source = segments(["This ordinary connective sentence is already clear."]);
    const graph = analyzeSemanticTranscript(source);
    const opportunity = buildVisualOpportunities(graph, source)[0];
    expect(opportunity.visualForm).toBe("no-graphic");
    const moment = motionMomentFromOpportunity(opportunity, graph, 0, true);
    expect(moment.status).toBe("suggested");
    expect(moment.reason).toContain("Created manually");
    expect(moment.semanticSpanIds).toEqual([graph.spans[0].id]);
  });
});

import { z } from "zod";
import type { StoredTranscriptSegment } from "./project-store";
import type { MotionMoment } from "./motion-plan";
import { graphForSegment, type SemanticSpan, type VisualKnowledgeGraph } from "./semantic-analysis";

export const visualOpportunitySchema = z.object({
  id: z.string().min(1),
  semanticSpanIds: z.array(z.string()).min(1),
  segmentId: z.string().min(1),
  startSeconds: z.number().min(0),
  endSeconds: z.number().positive(),
  intendedBenefit: z.enum(["clarify", "identify", "compare", "prove", "orient", "emphasize"]),
  visualForm: z.enum(["identity-card", "relationship-diagram", "stat-card", "step-list", "quote-card", "kinetic-type", "text-first", "no-graphic"]),
  importance: z.number().min(0).max(1),
  visualizability: z.number().min(0).max(1),
  evidenceStrength: z.number().min(0).max(1),
  identityConfidence: z.number().min(0).max(1),
  narrativeFit: z.number().min(0).max(1),
  safeSpaceFit: z.number().min(0).max(1),
  novelty: z.number().min(0).max(1),
  cognitiveLoad: z.number().min(0).max(1),
  licensingRisk: z.number().min(0).max(1),
  score: z.number(),
  explanation: z.string().min(1),
  warnings: z.array(z.string()),
  fallback: z.enum(["typography", "diagram", "icon", "no-graphic"]),
  selected: z.boolean(),
  rejectedReason: z.string().optional(),
});

export const storyboardSchema = z.object({
  id: z.string().min(1),
  density: z.enum(["sparse", "balanced", "energetic", "custom"]),
  maxGraphics: z.number().int().positive(),
  selectedOpportunityIds: z.array(z.string()),
  opportunities: z.array(visualOpportunitySchema),
});

export type VisualOpportunity = z.infer<typeof visualOpportunitySchema>;
export type Storyboard = z.infer<typeof storyboardSchema>;

function formFor(span: SemanticSpan, graph: VisualKnowledgeGraph): VisualOpportunity["visualForm"] {
  const relation = graph.relations.find((item) => item.spanId === span.id);
  const entities = graph.entities.filter((entity) => span.entityIds.includes(entity.id));
  if (relation && ["competition", "conflict", "comparison", "acquisition"].includes(relation.type)) return "relationship-diagram";
  if (span.kind === "statistic") return "stat-card";
  if (/\b(first|second|third|next|finally|steps?|ways?|reasons?)\b/i.test(span.verbatimText)) return "step-list";
  if (span.kind === "quote") return "quote-card";
  if (entities.some((entity) => entity.resolutionStatus === "needs-review")) return "text-first";
  if (entities.some((entity) => ["company", "person", "product", "model"].includes(entity.type))) return "identity-card";
  if (span.visualizability >= .55) return "kinetic-type";
  return "no-graphic";
}

function benefitFor(form: VisualOpportunity["visualForm"]): VisualOpportunity["intendedBenefit"] {
  if (form === "relationship-diagram") return "compare";
  if (form === "stat-card") return "prove";
  if (form === "identity-card") return "identify";
  if (form === "step-list") return "clarify";
  if (form === "no-graphic") return "orient";
  return "emphasize";
}

function explanationFor(form: VisualOpportunity["visualForm"], span: SemanticSpan) {
  if (form === "relationship-diagram") return "One composed relationship beat communicates the actors and action more clearly than separate logo hits.";
  if (form === "stat-card") return "The source contains a fact-bearing number that benefits from a concise visual anchor after verification.";
  if (form === "step-list") return "The spoken sequence is easier to retain as an ordered visual treatment.";
  if (form === "identity-card") return "A first meaningful entity mention benefits from brief identification without repeating it later.";
  if (form === "text-first") return "The meaning is useful, but identity-bearing media is unsafe until ambiguity is resolved.";
  if (form === "quote-card") return "The quotation boundary should stay visible so attributed language is not mistaken for narrator fact.";
  if (form === "kinetic-type") return "A restrained typography beat can emphasize the idea without pretending to provide documentary evidence.";
  return `The source already communicates “${span.verbatimText.slice(0, 60)}” clearly enough; added motion would be decoration.`;
}

export function buildVisualOpportunities(graph: VisualKnowledgeGraph, segments: StoredTranscriptSegment[]) {
  const segmentConfidence = new Map(segments.map((segment) => [segment.id, segment.confidence ?? .82]));
  return graph.spans.map((span, index): VisualOpportunity => {
    const form = formFor(span, graph);
    const entities = graph.entities.filter((entity) => span.entityIds.includes(entity.id));
    const warnings = graph.warnings.filter((warning) => warning.spanId === span.id).map((warning) => warning.message);
    const identityConfidence = entities.length ? Math.min(...entities.map((entity) => entity.confidence)) : .9;
    const evidenceStrength = Math.min(1, segmentConfidence.get(span.segmentId) ?? .82);
    const explicitArtifact = /\b(logo|wordmark|portrait|screenshot|website|map|show|display|put)\b/i.test(span.verbatimText);
    const importance = Math.min(1, .44 + span.visualizability * .34 + (graph.relations.some((relation) => relation.spanId === span.id) ? .2 : 0) + (graph.claims.some((claim) => claim.spanId === span.id) ? .08 : 0) + (explicitArtifact ? .22 : 0));
    const visualizability = form === "no-graphic" ? .15 : span.visualizability;
    const narrativeFit = index === 0 ? .94 : .78;
    const safeSpaceFit = .72;
    const novelty = .86;
    const cognitiveLoad = form === "relationship-diagram" ? .42 : form === "step-list" ? .36 : .22;
    const licensingRisk = form === "identity-card" && entities.length ? entities.some((entity) => entity.resolutionStatus !== "resolved") ? .9 : explicitArtifact ? .18 : .34 : 0;
    const ambiguityPenalty = warnings.length ? .18 : 0;
    const score = importance * visualizability * evidenceStrength * narrativeFit * safeSpaceFit * novelty - cognitiveLoad * .22 - licensingRisk * .18 - ambiguityPenalty;
    return visualOpportunitySchema.parse({
      id: `opp_${String(index + 1).padStart(3, "0")}`,
      semanticSpanIds: [span.id],
      segmentId: span.segmentId,
      startSeconds: span.startSeconds,
      endSeconds: span.endSeconds,
      intendedBenefit: benefitFor(form),
      visualForm: form,
      importance,
      visualizability,
      evidenceStrength,
      identityConfidence,
      narrativeFit,
      safeSpaceFit,
      novelty,
      cognitiveLoad,
      licensingRisk,
      score,
      explanation: explanationFor(form, span),
      warnings,
      fallback: form === "relationship-diagram" ? "diagram" : form === "no-graphic" ? "no-graphic" : "typography",
      selected: false,
    });
  });
}

type OptimizeOptions = { density?: Storyboard["density"]; maxGraphics?: number; minimumGapSeconds?: number };

export function optimizeStoryboard(graph: VisualKnowledgeGraph, segments: StoredTranscriptSegment[], durationSeconds: number, options: OptimizeOptions = {}): Storyboard {
  const density = options.density ?? "balanced";
  const pace = density === "sparse" ? 18 : density === "energetic" ? 8 : 12;
  const maxGraphics = Math.max(1, Math.min(options.maxGraphics ?? Math.max(1, Math.round(durationSeconds / pace)), 24));
  const minimumGap = options.minimumGapSeconds ?? (density === "energetic" ? 2.5 : density === "sparse" ? 7 : 4.5);
  const opportunities = buildVisualOpportunities(graph, segments);
  const ranked = [...opportunities].filter((item) => item.visualForm !== "no-graphic" && item.score > .02).sort((a, b) => b.score - a.score || a.startSeconds - b.startSeconds);
  const selected: VisualOpportunity[] = [];
  const entityLastShown = new Map<string, number>();

  for (const candidate of ranked) {
    if (selected.length >= maxGraphics) break;
    const span = graph.spans.find((item) => candidate.semanticSpanIds.includes(item.id));
    if (!span) continue;
    const overlapsRecovery = selected.some((item) => Math.abs(item.startSeconds - candidate.startSeconds) < minimumGap);
    if (overlapsRecovery) continue;
    const repeatedTooSoon = span.entityIds.some((entityId) => candidate.startSeconds - (entityLastShown.get(entityId) ?? Number.NEGATIVE_INFINITY) < 14);
    if (repeatedTooSoon) continue;
    selected.push(candidate);
    span.entityIds.forEach((entityId) => entityLastShown.set(entityId, candidate.startSeconds));
  }

  const selectedIds = new Set(selected.map((item) => item.id));
  const finalized = opportunities.map((item) => {
    if (selectedIds.has(item.id)) return { ...item, selected: true };
    if (item.visualForm === "no-graphic") return { ...item, rejectedReason: "The source already carries the point; motion would create fake importance." };
    if (selected.some((chosen) => Math.abs(chosen.startSeconds - item.startSeconds) < minimumGap)) return { ...item, rejectedReason: "The viewer needs recovery time after a stronger nearby graphic." };
    const span = graph.spans.find((candidate) => item.semanticSpanIds.includes(candidate.id));
    const repeated = span?.entityIds.some((entityId) => selected.some((chosen) => {
      const chosenSpan = graph.spans.find((candidate) => chosen.semanticSpanIds.includes(candidate.id));
      return chosenSpan?.entityIds.includes(entityId) && chosen.id !== item.id && Math.abs(item.startSeconds - chosen.startSeconds) < 14;
    }));
    if (repeated) return { ...item, rejectedReason: "Entity recurrence cooldown prevents another redundant identity hit." };
    return { ...item, rejectedReason: "A higher-value opportunity better fits the selected density and maximum count." };
  });
  return storyboardSchema.parse({ id: `storyboard_${graph.id}`, density, maxGraphics, selectedOpportunityIds: [...selectedIds], opportunities: finalized });
}

function headline(text: string) {
  const words = text.replace(/[^\p{L}\p{N}%$'’.-]+/gu, " ").trim().split(/\s+/).filter(Boolean).slice(0, 8);
  const value = words.join(" ");
  return value ? value[0].toUpperCase() + value.slice(1) : "Selected idea";
}

function typeFor(form: VisualOpportunity["visualForm"]): MotionMoment["type"] {
  if (form === "stat-card") return "stat-card";
  if (form === "step-list") return "step-list";
  if (form === "quote-card") return "pull-quote";
  if (form === "identity-card" || form === "text-first") return "lower-third";
  return "hook-title";
}

export function motionMomentFromOpportunity(opportunity: VisualOpportunity, graph: VisualKnowledgeGraph, index: number, manual = false): MotionMoment {
  const span = graph.spans.find((item) => opportunity.semanticSpanIds.includes(item.id));
  if (!span) throw new Error("SEMANTIC_SPAN_NOT_FOUND");
  const context = graphForSegment(graph, span.segmentId);
  const primaryEntity = context.entities[0];
  const form = opportunity.visualForm === "no-graphic" && manual ? "kinetic-type" : opportunity.visualForm;
  const numbers = span.verbatimText.match(/\$?\d+(?:[.,]\d+)?%?|\b(?:million|billion|percent)\b/gi) ?? [];
  const steps = span.verbatimText.split(/,|;|\bthen\b/gi).map((item) => item.trim()).filter((item) => item.split(/\s+/).length > 1).slice(0, 3);
  const relation = context.relations[0];
  const title = relation && context.entities.length > 1 ? `${context.entities[0].canonicalName} ↔ ${context.entities[1].canonicalName}` : headline(span.verbatimText);
  const warningMessages = context.warnings.map((warning) => ({ type: warning.type === "FACT_REVIEW" ? "SCRIPT_FACT_CONFLICT" as const : warning.type === "AMBIGUOUS_IDENTITY" ? "AMBIGUITY" as const : "LOW_CONFIDENCE" as const, message: warning.message, approvalRequired: warning.approvalRequired }));
  return {
    id: `mg_${manual ? "manual" : "semantic"}_${String(index + 1).padStart(2, "0")}`,
    startSeconds: Math.max(0, opportunity.startSeconds + .08),
    endSeconds: Math.max(opportunity.startSeconds + 1.9, opportunity.endSeconds + .2),
    transcriptExcerpt: span.verbatimText,
    purpose: opportunity.intendedBenefit === "identify" ? "orient" : opportunity.intendedBenefit,
    type: typeFor(form),
    archetype: form === "relationship-diagram" ? "full-frame-ui" : form === "kinetic-type" || form === "quote-card" ? "typographic" : "overlay",
    renderEngine: "hyperframes",
    accentWord: primaryEntity?.canonicalName ?? span.verbatimText.split(/\s+/)[0],
    priority: opportunity.importance > .78 ? "essential" : "helpful",
    confidence: Math.min(opportunity.evidenceStrength, opportunity.identityConfidence),
    reason: manual ? `Created manually from the selected source span. ${opportunity.explanation}` : opportunity.explanation,
    semanticSpanIds: opportunity.semanticSpanIds,
    interpretation: { normalizedMeaning: span.normalizedMeaning, literalness: span.interpretation.literalness, modality: span.interpretation.modality, negated: span.interpretation.negated },
    warnings: warningMessages,
    content: { headline: title, supportingText: relation ? `${relation.negated ? "Not " : ""}${relation.modality === "possible" ? "Possible " : ""}${relation.type}` : primaryEntity?.type ?? "", data: numbers.length ? numbers.slice(0, 3) : form === "step-list" ? steps : [] },
    layout: { preferredRegion: index % 2 ? "upper-right" : "upper-left", avoidRegions: ["speaker-face", "existing-caption", "important-ui"], safeZoneNotes: "Placement remains provisional until protected-region sampling confirms clear space." },
    motion: { entry: form === "step-list" ? "sequential stagger" : form === "relationship-diagram" ? "node-link resolve" : "masked line reveal", hold: "readable hold", exit: "short eased fade", energy: .4 },
    visual: { scale: 1, textAlign: "left", treatment: "minimal", accentRole: warningMessages.length ? "suggested" : "registration" },
    ...(primaryEntity && ["company", "person", "product", "model"].includes(primaryEntity.type) && primaryEntity.resolutionStatus === "resolved" ? { asset: { kind: primaryEntity.type === "person" ? "image" as const : "logo" as const, entity: primaryEntity.canonicalName, query: `${primaryEntity.canonicalName} official ${primaryEntity.type === "person" ? "portrait" : "logo"}`, status: "needed" as const, usageStatus: "preview-only" as const } } : {}),
    sourceEvidence: { transcriptStart: span.startSeconds, transcriptEnd: span.endSeconds, requiresVerification: context.claims.some((claim) => claim.requiresVerification) },
    requiresAsset: false,
    status: "suggested",
  };
}

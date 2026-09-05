import { createHash } from "node:crypto";
import { z } from "zod";
import type { StoredTranscriptSegment } from "./project-store";

export const entityTypeSchema = z.enum([
  "company", "person", "product", "model", "organization", "object", "location", "concept", "unknown",
]);

export const semanticEntitySchema = z.object({
  id: z.string().min(1),
  canonicalName: z.string().min(1),
  type: entityTypeSchema,
  aliases: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  resolutionStatus: z.enum(["resolved", "needs-review", "locked"]),
  ambiguityOptions: z.array(z.string()).optional(),
  correction: z.object({ original: z.string(), proposed: z.string(), confidence: z.number().min(0).max(1) }).optional(),
});

export const semanticSpanSchema = z.object({
  id: z.string().min(1),
  segmentId: z.string().min(1),
  startSeconds: z.number().min(0),
  endSeconds: z.number().positive(),
  verbatimText: z.string().min(1),
  normalizedMeaning: z.string().min(1),
  language: z.string().min(2),
  kind: z.enum(["clause", "entity", "action", "statistic", "quote", "comparison", "concept"]),
  entityIds: z.array(z.string()),
  interpretation: z.object({
    literalness: z.enum(["literal", "metaphorical", "ambiguous"]),
    modality: z.enum(["asserted", "possible", "alleged", "quoted"]),
    negated: z.boolean(),
    sentiment: z.enum(["neutral", "positive", "negative", "confrontational", "uncertain"]),
  }),
  ambiguities: z.array(z.object({ field: z.string(), options: z.array(z.string()).min(2), confidence: z.number().min(0).max(1) })),
  visualizability: z.number().min(0).max(1),
});

export const semanticRelationSchema = z.object({
  id: z.string().min(1),
  sourceEntityId: z.string().min(1),
  targetEntityId: z.string().min(1),
  type: z.enum(["competition", "conflict", "acquisition", "comparison", "association", "ownership", "performance"]),
  verbatimAction: z.string().min(1),
  literalness: z.enum(["literal", "metaphorical", "ambiguous"]),
  modality: z.enum(["asserted", "possible", "alleged", "quoted"]),
  negated: z.boolean(),
  confidence: z.number().min(0).max(1),
  spanId: z.string().min(1),
});

export const semanticClaimSchema = z.object({
  id: z.string().min(1),
  spanId: z.string().min(1),
  speaker: z.string().min(1),
  exactText: z.string().min(1),
  status: z.enum(["unverified", "supported", "contradicted", "ambiguous", "opinion", "allegation", "quotation"]),
  modality: z.enum(["asserted", "possible", "alleged", "quoted"]),
  negated: z.boolean(),
  requiresVerification: z.boolean(),
  warning: z.string().optional(),
  suggestedLabel: z.string().optional(),
});

export const semanticWarningSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["AMBIGUOUS_IDENTITY", "PROPOSED_CORRECTION", "FACT_REVIEW", "METAPHOR", "LOW_CONFIDENCE"]),
  spanId: z.string().min(1),
  message: z.string().min(1),
  approvalRequired: z.boolean(),
});

export const visualKnowledgeGraphSchema = z.object({
  id: z.string().min(1),
  version: z.literal(1),
  checksum: z.string().regex(/^sha256:/),
  document: z.object({
    summary: z.string(),
    language: z.string(),
    topic: z.string(),
    timingBasis: z.enum(["estimated-script", "aligned-narration", "final-video"]),
  }),
  spans: z.array(semanticSpanSchema),
  entities: z.array(semanticEntitySchema),
  relations: z.array(semanticRelationSchema),
  claims: z.array(semanticClaimSchema),
  warnings: z.array(semanticWarningSchema),
});

export type SemanticEntity = z.infer<typeof semanticEntitySchema>;
export type SemanticSpan = z.infer<typeof semanticSpanSchema>;
export type VisualKnowledgeGraph = z.infer<typeof visualKnowledgeGraphSchema>;

type TimingBasis = VisualKnowledgeGraph["document"]["timingBasis"];

const knownEntities: Array<{ pattern: RegExp; canonicalName: string; id: string; type: SemanticEntity["type"]; confidence: number }> = [
  { pattern: /\bNVIDIA\b/gi, canonicalName: "NVIDIA", id: "company:nvidia", type: "company", confidence: .99 },
  { pattern: /\bInvidia\b/gi, canonicalName: "NVIDIA", id: "company:nvidia", type: "company", confidence: .94 },
  { pattern: /\b(?:Kimi\s*K3|Kimmy\s*K?3)\b/gi, canonicalName: "Kimi K3", id: "model:kimi_k3", type: "model", confidence: .97 },
  { pattern: /\bMoonshot\s*AI\b/gi, canonicalName: "Moonshot AI", id: "company:moonshot_ai", type: "company", confidence: .99 },
  { pattern: /\bClaude Code\b/gi, canonicalName: "Claude Code", id: "product:claude_code", type: "product", confidence: .99 },
  { pattern: /\bCodex\b/gi, canonicalName: "Codex", id: "product:codex", type: "product", confidence: .98 },
  { pattern: /\bOpenCode\b/gi, canonicalName: "OpenCode", id: "product:opencode", type: "product", confidence: .97 },
  { pattern: /\bAnthropic\b/gi, canonicalName: "Anthropic", id: "company:anthropic", type: "company", confidence: .99 },
  { pattern: /\bAntropic\b/gi, canonicalName: "Anthropic", id: "company:anthropic", type: "company", confidence: .84 },
  { pattern: /\bOpen\s?AI\b/gi, canonicalName: "OpenAI", id: "company:openai", type: "company", confidence: .99 },
  { pattern: /\bSam Altman\b/gi, canonicalName: "Sam Altman", id: "person:sam_altman", type: "person", confidence: .99 },
  { pattern: /\bCompany X\b/gi, canonicalName: "Company X", id: "company:company_x", type: "company", confidence: .7 },
  { pattern: /\bCompany Y\b/gi, canonicalName: "Company Y", id: "company:company_y", type: "company", confidence: .7 },
];

function slug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "unknown";
}

function modalityFor(text: string): SemanticSpan["interpretation"]["modality"] {
  if (/\b(might|may|could|possibly|likely)\b/i.test(text)) return "possible";
  if (/\b(allegedly|accused|reportedly|claimed)\b/i.test(text)) return "alleged";
  if (/["“”]/.test(text)) return "quoted";
  return "asserted";
}

function sentimentFor(text: string): SemanticSpan["interpretation"]["sentiment"] {
  if (/\b(war|wars|attack|attacked|versus|vs\.?|conflict|fight)\b/i.test(text)) return "confrontational";
  if (/\b(might|may|could|uncertain|unclear|doubt)\b/i.test(text)) return "uncertain";
  if (/\b(grow|growth|improve|better|success|win)\b/i.test(text)) return "positive";
  if (/\b(fail|failed|risk|fear|problem|worse)\b/i.test(text)) return "negative";
  return "neutral";
}

function entityForApple(text: string): SemanticEntity | null {
  if (!/\bapple\b/i.test(text)) return null;
  if (/\b(ate|eat|eating|fruit|orchard|before the race)\b/i.test(text)) {
    return { id: "object:apple_fruit", canonicalName: "apple", type: "object", aliases: ["apple"], confidence: .98, resolutionStatus: "resolved" };
  }
  if (/\b(AI|company|technology|iPhone|entered|launched|announced)\b/i.test(text) || /\bApple\b/.test(text)) {
    return { id: "company:apple", canonicalName: "Apple Inc.", type: "company", aliases: ["Apple"], confidence: .97, resolutionStatus: "resolved" };
  }
  return { id: "ambiguous:apple", canonicalName: "Apple", type: "unknown", aliases: ["apple"], confidence: .45, resolutionStatus: "needs-review", ambiguityOptions: ["Apple Inc.", "apple fruit", "another name"] };
}

function entityForClaude(text: string): SemanticEntity | null {
  if (!/\bClaude\b/i.test(text)) return null;
  if (/\b(model|AI|benchmark|token|Anthropic|reasoning)\b/i.test(text)) {
    return { id: "model:claude", canonicalName: "Claude", type: "model", aliases: ["Claude"], confidence: .98, resolutionStatus: "resolved" };
  }
  return { id: "ambiguous:claude", canonicalName: "Claude", type: "unknown", aliases: ["Claude"], confidence: .48, resolutionStatus: "needs-review", ambiguityOptions: ["Claude AI model", "person named Claude", "another product"] };
}

function entityForMeta(text: string): SemanticEntity | null {
  if (!/\bMeta\b/i.test(text)) return null;
  if (/\b(Facebook|Instagram|WhatsApp|Platforms|company|AI model)\b/i.test(text)) {
    return { id: "company:meta", canonicalName: "Meta Platforms", type: "company", aliases: ["Meta"], confidence: .96, resolutionStatus: "resolved" };
  }
  if (/\b(game|gaming|strategy|build|deck)\b/i.test(text)) {
    return { id: "concept:meta_strategy", canonicalName: "metagame strategy", type: "concept", aliases: ["meta"], confidence: .9, resolutionStatus: "resolved" };
  }
  return { id: "ambiguous:meta", canonicalName: "Meta", type: "unknown", aliases: ["Meta"], confidence: .35, resolutionStatus: "needs-review", ambiguityOptions: ["Meta Platforms", "metagame strategy", "self-reference", "another entity"] };
}

function upsertEntity(target: Map<string, SemanticEntity>, entity: SemanticEntity) {
  const existing = target.get(entity.id);
  if (!existing) target.set(entity.id, entity);
  else target.set(entity.id, { ...existing, aliases: [...new Set([...existing.aliases, ...entity.aliases])], confidence: Math.max(existing.confidence, entity.confidence) });
}

function normalizedMeaning(text: string) {
  return text
    .replace(/\bstarting wars? with\b/gi, "is in conflict or competition with")
    .replace(/\battacked the benchmark\b/gi, "performed aggressively on the benchmark")
    .replace(/\bthe company exploded\b/gi, "the company grew rapidly")
    .replace(/\bAntropic\b/g, "Anthropic")
    .replace(/\bInvidia\b/gi, "NVIDIA")
    .replace(/\bKimmy\s*K?3\b/gi, "Kimi K3")
    .replace(/\bCloud Code\b/gi, "Claude Code")
    .trim();
}

function makeSpan(segment: StoredTranscriptSegment, index: number, entityIds: string[]): SemanticSpan {
  const text = segment.text.trim();
  const metaphor = /\b(starting wars?|attacked? the benchmark|company exploded|AI race)\b/i.test(text);
  const ambiguities: SemanticSpan["ambiguities"] = [];
  if (/\bMeta changed everything\b/i.test(text)) ambiguities.push({ field: "entity", options: ["Meta Platforms", "metagame strategy", "self-reference"], confidence: .35 });
  return semanticSpanSchema.parse({
    id: `span_${segment.id}_${String(index + 1).padStart(3, "0")}`,
    segmentId: segment.id,
    startSeconds: segment.startSeconds,
    endSeconds: segment.endSeconds,
    verbatimText: text,
    normalizedMeaning: normalizedMeaning(text),
    language: "en",
    kind: /\d|%|\$|million|billion|percent/i.test(text) ? "statistic" : /\b(unlike|versus|vs\.)\b/i.test(text) ? "comparison" : /["“”]/.test(text) ? "quote" : "clause",
    entityIds,
    interpretation: {
      literalness: metaphor ? "metaphorical" : ambiguities.length ? "ambiguous" : "literal",
      modality: modalityFor(text),
      negated: /\b(no|not|never|didn't|did not|hasn't|wasn't|without)\b/i.test(text),
      sentiment: sentimentFor(text),
    },
    ambiguities,
    visualizability: /\d|%|\$|\b(first|second|third|unlike|versus|vs\.|buy|acquire|war|attack|benchmark|launch|logo|website|map)\b/i.test(text) || entityIds.length > 1 ? .88 : entityIds.length ? .68 : .42,
  });
}

function findEntityId(entities: Map<string, SemanticEntity>, pattern: RegExp) {
  return [...entities.values()].find((entity) => pattern.test(entity.canonicalName))?.id;
}

export function analyzeSemanticTranscript(segments: StoredTranscriptSegment[], timingBasis: TimingBasis = "final-video"): VisualKnowledgeGraph {
  const entities = new Map<string, SemanticEntity>();
  const spans: SemanticSpan[] = [];
  const relations: VisualKnowledgeGraph["relations"] = [];
  const claims: VisualKnowledgeGraph["claims"] = [];
  const warnings: VisualKnowledgeGraph["warnings"] = [];

  segments.forEach((segment, index) => {
    const text = segment.text;
    for (const known of knownEntities) {
      known.pattern.lastIndex = 0;
      const match = known.pattern.exec(text);
      if (!match) continue;
      const mention = match[0];
      upsertEntity(entities, {
        id: known.id, canonicalName: known.canonicalName, type: known.type, aliases: [mention], confidence: known.confidence,
        resolutionStatus: "resolved",
        ...(mention.toLowerCase() === "antropic" ? { correction: { original: mention, proposed: "Anthropic", confidence: .84 } } : {}),
      });
    }
    for (const contextual of [entityForApple(text), entityForClaude(text), entityForMeta(text)]) if (contextual) upsertEntity(entities, contextual);

    const spanEntityIds = [...entities.values()].filter((entity) => entity.aliases.some((alias) => text.toLowerCase().includes(alias.toLowerCase()))).map((entity) => entity.id);
    const span = makeSpan(segment, index, spanEntityIds);
    spans.push(span);

    for (const entityId of spanEntityIds) {
      const entity = entities.get(entityId)!;
      if (entity.resolutionStatus === "needs-review") warnings.push({ id: `warning_identity_${slug(entity.id)}_${index}`, type: "AMBIGUOUS_IDENTITY", spanId: span.id, message: `${entity.canonicalName} is ambiguous in this context and needs a user choice before identity-bearing media is used.`, approvalRequired: true });
      if (entity.correction) warnings.push({ id: `warning_correction_${slug(entity.id)}_${index}`, type: "PROPOSED_CORRECTION", spanId: span.id, message: `“${entity.correction.original}” likely refers to ${entity.correction.proposed}; the original wording is preserved.`, approvalRequired: entity.correction.confidence < .9 });
    }
    if (span.interpretation.literalness === "metaphorical") warnings.push({ id: `warning_metaphor_${index}`, type: "METAPHOR", spanId: span.id, message: "The action is interpreted metaphorically; literal violence or disaster imagery is not appropriate.", approvalRequired: false });

    const anthropic = findEntityId(entities, /^Anthropic$/i);
    const openai = findEntityId(entities, /^OpenAI$/i);
    const sam = findEntityId(entities, /^Sam Altman$/i);
    const claude = findEntityId(entities, /^Claude$/i);
    const appleCompany = findEntityId(entities, /^Apple Inc\.$/i);

    if (/\b(starting wars?|war|versus|vs\.?|competing)\b/i.test(text) && anthropic && openai) {
      relations.push({ id: `relation_conflict_${index}`, sourceEntityId: anthropic, targetEntityId: openai, type: "competition", verbatimAction: text.match(/starting wars?|war|versus|vs\.?|competing/i)?.[0] ?? "conflict", literalness: "metaphorical", modality: modalityFor(text), negated: span.interpretation.negated, confidence: .78, spanId: span.id });
    }
    if (/\battacked the benchmark\b/i.test(text) && claude) {
      const benchmarkId = "concept:benchmark";
      upsertEntity(entities, { id: benchmarkId, canonicalName: "benchmark", type: "concept", aliases: ["benchmark"], confidence: .95, resolutionStatus: "resolved" });
      relations.push({ id: `relation_performance_${index}`, sourceEntityId: claude, targetEntityId: benchmarkId, type: "performance", verbatimAction: "attacked", literalness: "metaphorical", modality: modalityFor(text), negated: false, confidence: .94, spanId: span.id });
      if (!span.entityIds.includes(benchmarkId)) span.entityIds.push(benchmarkId);
    }
    if (/\bentered the AI race\b/i.test(text) && appleCompany) {
      const raceId = "concept:ai_competition";
      upsertEntity(entities, { id: raceId, canonicalName: "AI competition", type: "concept", aliases: ["AI race"], confidence: .96, resolutionStatus: "resolved" });
      relations.push({ id: `relation_ai_race_${index}`, sourceEntityId: appleCompany, targetEntityId: raceId, type: "competition", verbatimAction: "entered the AI race", literalness: "metaphorical", modality: modalityFor(text), negated: false, confidence: .96, spanId: span.id });
    }

    const acquisition = /\b(buy|bought|acquire|acquired)\b/i.exec(text);
    if (acquisition) {
      const sourceId = openai ?? spanEntityIds[0];
      const targetId = spanEntityIds.find((id) => id !== sourceId);
      if (sourceId && targetId) relations.push({ id: `relation_acquisition_${index}`, sourceEntityId: sourceId, targetEntityId: targetId, type: "acquisition", verbatimAction: acquisition[0], literalness: "literal", modality: modalityFor(text), negated: span.interpretation.negated, confidence: span.interpretation.negated ? .98 : .86, spanId: span.id });
    }
    if (/\bUnlike\b/i.test(text) && spanEntityIds.length >= 2) relations.push({ id: `relation_comparison_${index}`, sourceEntityId: spanEntityIds[0], targetEntityId: spanEntityIds[1], type: "comparison", verbatimAction: "Unlike", literalness: "literal", modality: modalityFor(text), negated: span.interpretation.negated, confidence: .94, spanId: span.id });

    const factSensitive = /\b(owner|CEO|founded|bought|acquired|released|\d|%|\$|million|billion)\b/i.test(text);
    const ownerConflict = Boolean(sam && openai && /OpenAI['’]s owner Sam Altman|owner Sam Altman/i.test(text));
    if (factSensitive || modalityFor(text) !== "asserted" || /["“”]/.test(text)) {
      const claimId = `claim_${String(claims.length + 1).padStart(3, "0")}`;
      claims.push({
        id: claimId, spanId: span.id, speaker: segment.speaker ?? (/["“”]/.test(text) ? "quoted source" : "narrator"), exactText: text,
        status: /["“”]/.test(text) ? "quotation" : ownerConflict ? "ambiguous" : modalityFor(text) === "alleged" ? "allegation" : "unverified",
        modality: modalityFor(text), negated: span.interpretation.negated, requiresVerification: factSensitive,
        ...(ownerConflict ? { warning: "The narration calls Sam Altman OpenAI's owner; that title requires fact review.", suggestedLabel: "Sam Altman — CEO, OpenAI" } : {}),
      });
      if (ownerConflict) warnings.push({ id: `warning_fact_${index}`, type: "FACT_REVIEW", spanId: span.id, message: "Narration says “owner”; proposed on-screen role is “CEO, OpenAI” and requires explicit approval.", approvalRequired: true });
    }
  });

  const text = segments.map((segment) => segment.text).join(" ").trim();
  const topicEntities = [...entities.values()].filter((entity) => entity.type !== "concept" && entity.type !== "object").slice(0, 4).map((entity) => entity.canonicalName);
  const payload = { text, entityIds: [...entities.keys()], relationCount: relations.length, claimCount: claims.length, timingBasis };
  const checksum = `sha256:${createHash("sha256").update(JSON.stringify(payload)).digest("hex")}`;
  return visualKnowledgeGraphSchema.parse({
    id: `vkg_${checksum.slice(7, 19)}`,
    version: 1,
    checksum,
    document: {
      summary: text.length > 180 ? `${text.slice(0, 177).trim()}…` : text,
      language: "en",
      topic: topicEntities.length ? topicEntities.join(" · ") : "Open-vocabulary transcript",
      timingBasis,
    },
    spans,
    entities: [...entities.values()],
    relations,
    claims,
    warnings,
  });
}

export function graphForSegment(graph: VisualKnowledgeGraph, segmentId: string) {
  const spans = graph.spans.filter((span) => span.segmentId === segmentId);
  const spanIds = new Set(spans.map((span) => span.id));
  const entityIds = new Set(spans.flatMap((span) => span.entityIds));
  return {
    spans,
    entities: graph.entities.filter((entity) => entityIds.has(entity.id)),
    relations: graph.relations.filter((relation) => spanIds.has(relation.spanId)),
    claims: graph.claims.filter((claim) => spanIds.has(claim.spanId)),
    warnings: graph.warnings.filter((warning) => spanIds.has(warning.spanId)),
  };
}

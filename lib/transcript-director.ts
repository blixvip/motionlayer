import { z } from "zod";
import { motionPlanSchema, type MotionMoment, type MotionPlan } from "./motion-plan";
import { splitTranscriptBeats } from "./local-motion-planner";
import type { StoredTranscriptSegment } from "./project-store";
import { analyzeSemanticTranscript } from "./semantic-analysis";
import { motionMomentFromOpportunity, optimizeStoryboard } from "./visual-opportunity";

const visualKinds = ["REST", "title", "quote", "steps", "stat", "logo", "icon", "image", "map", "webpage"] as const;
const decisionSchema = z.object({
  beatId: z.string(),
  visual: z.enum(visualKinds),
  entity: z.string(),
  query: z.string(),
  headline: z.string(),
  supportingText: z.string(),
  data: z.array(z.string()).max(5),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
});
const responseSchema = z.object({ summary: z.string(), decisions: z.array(decisionSchema) });
const ollamaSchema = z.object({ message: z.object({ content: z.string() }) });

const structuredFormat = {
  type: "object", additionalProperties: false,
  properties: {
    summary: { type: "string" },
    decisions: { type: "array", items: {
      type: "object", additionalProperties: false,
      properties: {
        beatId: { type: "string" }, visual: { type: "string", enum: visualKinds }, entity: { type: "string" }, query: { type: "string" },
        headline: { type: "string" }, supportingText: { type: "string" }, data: { type: "array", items: { type: "string" }, maxItems: 5 },
        reason: { type: "string" }, confidence: { type: "number", minimum: 0, maximum: 1 },
      },
      required: ["beatId", "visual", "entity", "query", "headline", "supportingText", "data", "reason", "confidence"],
    } },
  }, required: ["summary", "decisions"],
} as const;

function compactHeadline(text: string) {
  const tokens = text.replace(/[^\p{L}\p{N}%$'’-]+/gu, " ").trim().split(/\s+/).filter(Boolean).slice(0, 7);
  const value = tokens.join(" ");
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Key idea";
}

function entityBeforeKeyword(text: string, keyword: string) {
  const match = new RegExp("(?:the\\s+)?([A-Za-z][A-Za-z0-9.&'’-]*(?:\\s+[A-Za-z][A-Za-z0-9.&'’-]*){0,2})\\s+" + keyword, "i").exec(text);
  return match?.[1]?.replace(/^(?:show|display|use|put|their|a|an|the)\s+/i, "").trim() ?? "";
}

function normalizeEntity(entity: string) {
  const compact = entity.trim();
  const known: Array<[RegExp, string]> = [
    [/^open\s+ai$/i, "OpenAI"], [/^you\s*tube$/i, "YouTube"], [/^git\s*hub$/i, "GitHub"],
    [/^linked\s*in$/i, "LinkedIn"], [/^tik\s*tok$/i, "TikTok"], [/^micro\s*soft$/i, "Microsoft"],
  ];
  for (const [pattern, value] of known) if (pattern.test(compact)) return value;
  return compact;
}

export function fallbackTranscriptDecision(beat: StoredTranscriptSegment) {
  const text = beat.text;
  const logoEntity = normalizeEntity(entityBeforeKeyword(text, "(?:logo|wordmark|brand mark)"));
  const hasNumber = /\b\d+(?:[.,]\d+)?%?|\$\d+|\b(?:million|billion|percent)\b/i.test(text);
  const hasSequence = /\b(first|second|third|next|finally|steps?|ways?|reasons?)\b/i.test(text);
  const locationEntity = entityBeforeKeyword(text, "(?:city|country|map|location)");
  let visual: typeof visualKinds[number] = "REST";
  let entity = "";
  if (/\b(?:logo|wordmark|brand mark)\b/i.test(text)) { visual = "logo"; entity = logoEntity || compactHeadline(text).split(" ")[0]; }
  else if (hasNumber) visual = "stat";
  else if (hasSequence) visual = "steps";
  else if (/\b(?:website|webpage|landing page|app screen|dashboard|interface|homepage)\b/i.test(text)) { visual = "webpage"; entity = compactHeadline(text); }
  else if (/\b(?:map|country|city|state|location|travel|from .+ to .+)\b/i.test(text)) { visual = "map"; entity = locationEntity || compactHeadline(text); }
  else if (/\b(?:photo|image|picture|portrait|product)\b/i.test(text)) { visual = "image"; entity = compactHeadline(text); }
  else if (/\b(?:icon|symbol|emoji)\b/i.test(text)) { visual = "icon"; entity = entityBeforeKeyword(text, "(?:icon|symbol|emoji)") || compactHeadline(text); }
  else if (/\b(?:remember|important|truth|lesson|means|never|always|must)\b/i.test(text)) visual = "quote";
  return {
    beatId: beat.id, visual, entity, query: entity ? `${entity} ${visual}` : "", headline: compactHeadline(text), supportingText: "",
    data: hasNumber ? (text.match(/\$?\d+(?:[.,]\d+)?%?|\b(?:million|billion|percent)\b/gi) ?? []).slice(0, 3) : [],
    reason: visual === "REST" ? "The speaker and source footage carry this beat without decoration." : `The transcript explicitly calls for a ${visual} treatment.`,
    confidence: visual === "REST" ? 0.72 : 0.9,
  } satisfies z.infer<typeof decisionSchema>;
}

type DirectorOptions = { fetcher?: typeof fetch; baseUrl?: string; model?: string; timeoutMs?: number };

export async function directTranscript(segments: StoredTranscriptSegment[], options: DirectorOptions = {}) {
  const beats = splitTranscriptBeats(segments);
  const fallback = beats.map(fallbackTranscriptDecision);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 45_000);
  const baseUrl = (options.baseUrl ?? process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
  const model = options.model ?? process.env.MOTION_DIRECTOR_MODEL ?? "qwen2.5:3b-instruct";
  try {
    const response = await (options.fetcher ?? fetch)(`${baseUrl}/api/chat`, {
      method: "POST", headers: { "content-type": "application/json" }, signal: controller.signal,
      body: JSON.stringify({
        model, stream: false, keep_alive: "15m", format: structuredFormat,
        options: { temperature: 0, seed: 0, num_predict: Math.min(2200, 160 + beats.length * 105) },
        messages: [
          { role: "system", content: "You are the transcript director for a premium talking-head motion edit. Classify EVERY timestamped beat. Choose REST unless a visual materially improves understanding or retention. If a named company, product, platform, or organization and its logo/brand is discussed, choose logo and return the exact entity name so an official logo can be resolved. Choose stat for numbers, steps for sequences, map for locations/routes, webpage for sites/apps/UI, image for concrete people/places/products, icon only for simple abstract concepts, quote for a load-bearing phrase, title only for a real section/hook. Do not invent facts, entities, or copy. Keep headlines 3-8 words. Copy exact numbers into data. Return schema-valid JSON only." },
          { role: "user", content: JSON.stringify({ beats: beats.map((beat) => ({ id: beat.id, start: beat.startSeconds, end: beat.endSeconds, text: beat.text })) }) },
        ],
      }),
    });
    if (!response.ok) throw new Error(`DIRECTOR_HTTP_${response.status}`);
    const payload = ollamaSchema.parse(await response.json());
    const parsed = responseSchema.parse(JSON.parse(payload.message.content));
    const returned = new Map(parsed.decisions.map((decision) => [decision.beatId, decision]));
    return { beats, decisions: beats.map((beat, index) => returned.get(beat.id) ?? fallback[index]), provider: model, summary: parsed.summary };
  } catch {
    return { beats, decisions: fallback, provider: "local-rules", summary: "Transcript classified with deterministic local rules." };
  } finally {
    clearTimeout(timeout);
  }
}

function typeFor(visual: z.infer<typeof decisionSchema>["visual"]): MotionMoment["type"] {
  if (visual === "stat") return "stat-card";
  if (visual === "steps") return "step-list";
  if (visual === "quote") return "pull-quote";
  if (["logo", "icon", "image", "map", "webpage"].includes(visual)) return "lower-third";
  return "hook-title";
}

export async function buildDirectedMotionPlan(segments: StoredTranscriptSegment[], durationSeconds: number, options: DirectorOptions = {}): Promise<MotionPlan & { directorProvider: string; semanticGraph: ReturnType<typeof analyzeSemanticTranscript>; storyboard: ReturnType<typeof optimizeStoryboard> }> {
  if (!segments.length) throw new Error("TRANSCRIPT_EMPTY");
  const directed = await directTranscript(segments, options);
  const duration = Math.max(durationSeconds, directed.beats.at(-1)?.endSeconds ?? 1);
  const semanticGraph = analyzeSemanticTranscript(directed.beats, "final-video");
  const storyboard = optimizeStoryboard(semanticGraph, directed.beats, duration, { density: "balanced" });
  const selected = storyboard.opportunities.filter((opportunity) => opportunity.selected).sort((a, b) => a.startSeconds - b.startSeconds);
  if (!selected.length) {
    const fallback = storyboard.opportunities.find((opportunity) => opportunity.visualForm !== "no-graphic") ?? storyboard.opportunities[0];
    if (fallback) selected.push({ ...fallback, selected: true });
  }
  const moments = selected.map((opportunity, index) => motionMomentFromOpportunity(opportunity, semanticGraph, index));
  const visualSegmentIds = new Set(selected.map((opportunity) => opportunity.segmentId));
  const beatClassifications = directed.beats.map((beat) => ({ id: `beat_${beat.id}`, startSeconds: beat.startSeconds, endSeconds: beat.endSeconds, classification: visualSegmentIds.has(beat.id) ? "VISUAL" as const : "REST" as const, reason: visualSegmentIds.has(beat.id) ? "Globally selected semantic opportunity." : "Intentional rest; a stronger opportunity won the density and recovery-time pass." }));
  const restDuration = beatClassifications.filter((beat) => beat.classification === "REST").reduce((sum, beat) => sum + beat.endSeconds - beat.startSeconds, 0);
  return {
    ...motionPlanSchema.parse({
      projectSummary: semanticGraph.document.summary || directed.summary,
      sourceLocked: true,
      styleIntent: "Open-vocabulary editorial overlays; verified assets, restrained density, explicit uncertainty, eased motion, and protected speaker framing.",
      density: "balanced",
      beatClassifications,
      restRatio: Math.min(1, restDuration / duration),
      recurringElements: ["Canonical entity identity", "Transcript-linked card system"],
      paletteEvidence: "Footage-derived palette pending the first-frame sampler.",
      semanticGraphId: semanticGraph.id,
      storyboardId: storyboard.id,
      timingBasis: "final-video",
      moments,
    }),
    directorProvider: directed.provider,
    semanticGraph,
    storyboard,
  };
}

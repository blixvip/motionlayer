import { z } from "zod";
import { motionPlanSchema, motionMomentSchema, type MotionMoment, type MotionPlan } from "./motion-plan";
import { promptScopes } from "./prompt-scope";

export const visualTreatmentSchema = z.object({
  scale: z.number().min(0.7).max(1.4).optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  treatment: z.enum(["solid", "outline", "minimal"]).optional(),
  accentRole: z.enum(["registration", "neutral", "accepted", "suggested"]).optional(),
}).partial();

export const motionPromptPatchSchema = z.object({
  id: z.string().regex(/^mg_[a-z0-9_]+$/),
  explanation: z.string().min(1).max(240),
  type: motionMomentSchema.shape.type.optional(),
  startSeconds: z.number().min(0).optional(),
  endSeconds: z.number().positive().optional(),
  content: motionMomentSchema.shape.content.partial().optional(),
  layout: motionMomentSchema.shape.layout.pick({ preferredRegion: true, safeZoneNotes: true }).partial().optional(),
  motion: motionMomentSchema.shape.motion.partial().optional(),
  visual: visualTreatmentSchema.optional(),
  status: z.enum(["ready", "suggested", "rejected"]).optional(),
}).refine((patch) => Object.keys(patch).some((key) => !["id", "explanation"].includes(key)), "A prompt patch must change the graphic");

export const motionPromptResultSchema = z.object({
  summary: z.string().min(1).max(360),
  patches: z.array(motionPromptPatchSchema).min(1).max(24),
});

const modelPatchSchema = z.object({
  id: z.string(), explanation: z.string(),
  type: motionMomentSchema.shape.type.optional(),
  startSeconds: z.number().optional(), endSeconds: z.number().optional(),
  headline: z.string().optional(), supportingText: z.string().optional(), data: z.array(z.string()).optional(),
  preferredRegion: z.string().optional(), safeZoneNotes: z.string().optional(),
  entry: z.string().optional(), hold: z.string().optional(), exit: z.string().optional(), energy: z.number().optional(),
  scale: z.number().optional(), textAlign: z.enum(["left", "center", "right"]).optional(),
  treatment: z.enum(["solid", "outline", "minimal"]).optional(),
  accentRole: z.enum(["registration", "neutral", "accepted", "suggested"]).optional(),
  status: z.enum(["ready", "suggested", "rejected"]).optional(),
});
const modelResultSchema = z.object({ summary: z.string(), patches: z.array(modelPatchSchema).min(1) });

export const motionPromptRequestSchema = z.object({
  prompt: z.string().trim().min(2).max(2000),
  scope: z.enum(promptScopes),
  selectedId: z.string().regex(/^mg_[a-z0-9_]+$/),
  plan: motionPlanSchema,
});

export type MotionPromptPatch = z.infer<typeof motionPromptPatchSchema>;
export type MotionPromptRequest = z.infer<typeof motionPromptRequestSchema>;

type PromptOptions = {
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
};

const ollamaResponseSchema = z.object({ message: z.object({ content: z.string() }) });

const structuredFormat = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    patches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" }, explanation: { type: "string" },
          type: { type: "string", enum: ["hook-title", "lower-third", "stat-card", "step-list", "pull-quote"] },
          startSeconds: { type: "number" }, endSeconds: { type: "number" },
          headline: { type: "string" }, supportingText: { type: "string" }, data: { type: "array", items: { type: "string" } },
          preferredRegion: { type: "string" }, safeZoneNotes: { type: "string" },
          entry: { type: "string" }, hold: { type: "string" }, exit: { type: "string" }, energy: { type: "number", minimum: 0, maximum: 1 },
          scale: { type: "number", minimum: 0.7, maximum: 1.4 },
          textAlign: { type: "string", enum: ["left", "center", "right"] },
          treatment: { type: "string", enum: ["solid", "outline", "minimal"] },
          accentRole: { type: "string", enum: ["registration", "neutral", "accepted", "suggested"] },
          status: { type: "string", enum: ["ready", "suggested", "rejected"] },
        },
        required: ["id", "explanation"],
      },
    },
  },
  required: ["summary", "patches"],
} as const;

export function resolvePromptTargetIds(request: MotionPromptRequest) {
  const selected = request.plan.moments.find((moment) => moment.id === request.selectedId);
  if (!selected) throw new Error("SELECTED_GRAPHIC_NOT_FOUND");
  if (request.scope === "selected-graphic") return [selected.id];
  if (request.scope === "graphic-type") return request.plan.moments.filter((moment) => moment.type === selected.type).map((moment) => moment.id);
  if (request.scope === "whole-project") return request.plan.moments.map((moment) => moment.id);
  return request.plan.moments
    .filter((moment) => moment.startSeconds < selected.endSeconds && moment.endSeconds > selected.startSeconds)
    .map((moment) => moment.id);
}

function expandModelPatch(patch: z.infer<typeof modelPatchSchema>): MotionPromptPatch {
  return motionPromptPatchSchema.parse({
    id: patch.id,
    explanation: patch.explanation,
    ...(patch.type ? { type: patch.type } : {}),
    ...(patch.startSeconds !== undefined ? { startSeconds: patch.startSeconds } : {}),
    ...(patch.endSeconds !== undefined ? { endSeconds: patch.endSeconds } : {}),
    ...((patch.headline !== undefined || patch.supportingText !== undefined || patch.data !== undefined) ? { content: {
      ...(patch.headline !== undefined ? { headline: patch.headline } : {}),
      ...(patch.supportingText !== undefined ? { supportingText: patch.supportingText } : {}),
      ...(patch.data !== undefined ? { data: patch.data } : {}),
    } } : {}),
    ...((patch.preferredRegion !== undefined || patch.safeZoneNotes !== undefined) ? { layout: {
      ...(patch.preferredRegion !== undefined ? { preferredRegion: patch.preferredRegion } : {}),
      ...(patch.safeZoneNotes !== undefined ? { safeZoneNotes: patch.safeZoneNotes } : {}),
    } } : {}),
    ...((patch.entry !== undefined || patch.hold !== undefined || patch.exit !== undefined || patch.energy !== undefined) ? { motion: {
      ...(patch.entry !== undefined ? { entry: patch.entry } : {}),
      ...(patch.hold !== undefined ? { hold: patch.hold } : {}),
      ...(patch.exit !== undefined ? { exit: patch.exit } : {}),
      ...(patch.energy !== undefined ? { energy: patch.energy } : {}),
    } } : {}),
    ...((patch.scale !== undefined || patch.textAlign !== undefined || patch.treatment !== undefined || patch.accentRole !== undefined) ? { visual: {
      ...(patch.scale !== undefined ? { scale: patch.scale } : {}),
      ...(patch.textAlign !== undefined ? { textAlign: patch.textAlign } : {}),
      ...(patch.treatment !== undefined ? { treatment: patch.treatment } : {}),
      ...(patch.accentRole !== undefined ? { accentRole: patch.accentRole } : {}),
    } } : {}),
    ...(patch.status ? { status: patch.status } : {}),
  });
}

export function applyMotionPromptPatches(plan: MotionPlan, patches: MotionPromptPatch[], affectedIds: string[]) {
  const allowed = new Set(affectedIds);
  const patchById = new Map(patches.filter((patch) => allowed.has(patch.id)).map((patch) => [patch.id, patch]));
  return plan.moments.map((moment) => {
    const patch = patchById.get(moment.id);
    if (!patch) return moment;
    const startSeconds = patch.startSeconds ?? moment.startSeconds;
    const endSeconds = patch.endSeconds ?? moment.endSeconds;
    const safeTiming = endSeconds > startSeconds ? { startSeconds, endSeconds } : {};
    return motionMomentSchema.parse({
      ...moment,
      ...safeTiming,
      ...(patch.type ? { type: patch.type } : {}),
      content: { ...moment.content, ...patch.content },
      layout: { ...moment.layout, ...patch.layout },
      motion: { ...moment.motion, ...patch.motion },
      visual: { ...moment.visual, ...patch.visual },
      status: patch.status === "rejected" ? "rejected" : "ready",
    });
  });
}

function regionFromPrompt(prompt: string) {
  if (/lower[ -]?left|bottom[ -]?left/i.test(prompt)) return "lower-left";
  if (/lower[ -]?right|bottom[ -]?right/i.test(prompt)) return "lower-right";
  if (/upper[ -]?left|top[ -]?left/i.test(prompt)) return "upper-left";
  if (/upper[ -]?right|top[ -]?right/i.test(prompt)) return "upper-right";
  if (/\bcent(?:er|re)(?:ed)?\b/i.test(prompt)) return "center";
  if (/\bleft\b/i.test(prompt)) return "left-center";
  if (/\bright\b/i.test(prompt)) return "right-center";
  return undefined;
}

function typeFromPrompt(prompt: string): MotionMoment["type"] | undefined {
  const conversion = /(?:turn|convert|change|make)\b[\s\S]{0,28}\b(?:into|to|as)\b[\s\S]{0,18}/i.exec(prompt)?.[0] ?? "";
  if (/lower[ -]?third/i.test(conversion)) return "lower-third";
  if (/stat|number|counter/i.test(conversion)) return "stat-card";
  if (/quote/i.test(conversion)) return "pull-quote";
  if (/step|list/i.test(conversion)) return "step-list";
  if (/title|headline/i.test(conversion)) return "hook-title";
  return undefined;
}

export function fallbackMotionPrompt(request: MotionPromptRequest, affectedIds = resolvePromptTargetIds(request)) {
  const prompt = request.prompt;
  const headline = prompt.match(/(?:headline|title)\s*[:=]\s*["“]?([^"”\n]+)["”]?/i)?.[1]?.trim();
  const supportingText = prompt.match(/(?:supporting text|subtitle|subhead)\s*[:=]\s*["“]?([^"”\n]+)["”]?/i)?.[1]?.trim();
  const region = regionFromPrompt(prompt);
  const type = typeFromPrompt(prompt);
  const patches = request.plan.moments.filter((moment) => affectedIds.includes(moment.id)).map((moment) => {
    const patch: MotionPromptPatch = { id: moment.id, explanation: "Applied the prompt with the local deterministic motion editor." };
    const energyDelta = /calm|subtle|gentle|less energ|slower/i.test(prompt) ? -0.18 : /bold|energetic|dynamic|punch|faster/i.test(prompt) ? 0.18 : 0;
    const entry = /blur/i.test(prompt) ? "pop-blur-fade" : /fade/i.test(prompt) ? "soft eased fade" : /slide/i.test(prompt) ? "eased slide" : /stagger/i.test(prompt) ? "sequential stagger" : undefined;
    if (headline || supportingText) patch.content = { ...(headline ? { headline } : {}), ...(supportingText ? { supportingText } : {}) };
    if (region) patch.layout = { preferredRegion: region };
    if (type) patch.type = type;
    if (energyDelta || entry) patch.motion = { ...(energyDelta ? { energy: Math.min(1, Math.max(0, moment.motion.energy + energyDelta)) } : {}), ...(entry ? { entry } : {}) };
    const scale = /\b(?:bigger|larger|increase size)\b/i.test(prompt) ? 1.18 : /\b(?:smaller|reduce size)\b/i.test(prompt) ? 0.86 : undefined;
    const textAlign = /align (?:the )?text (left|center|right)/i.exec(prompt)?.[1] as "left" | "center" | "right" | undefined;
    const treatment = /outline/i.test(prompt) ? "outline" as const : /minimal|cleaner/i.test(prompt) ? "minimal" as const : undefined;
    if (scale || textAlign || treatment) patch.visual = { ...(scale ? { scale } : {}), ...(textAlign ? { textAlign } : {}), ...(treatment ? { treatment } : {}) };
    if (/remove|delete|hide/i.test(prompt)) patch.status = "rejected";
    else patch.status = "ready";
    if (Object.keys(patch).length === 3) patch.motion = { entry: `art-directed revision: ${prompt.slice(0, 72)}` };
    return motionPromptPatchSchema.parse(patch);
  });
  return { summary: `Updated ${patches.length} graphic${patches.length === 1 ? "" : "s"} locally.`, patches, provider: "local-rules" as const };
}

export async function runMotionPrompt(rawRequest: MotionPromptRequest, options: PromptOptions = {}) {
  const request = motionPromptRequestSchema.parse(rawRequest);
  const affectedIds = resolvePromptTargetIds(request);
  const targetMoments = request.plan.moments.filter((moment) => affectedIds.includes(moment.id));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 35_000);
  const model = options.model ?? process.env.MOTION_PROMPT_MODEL ?? "qwen2.5:3b-instruct";
  const baseUrl = (options.baseUrl ?? process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");

  try {
    const response = await (options.fetcher ?? fetch)(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        keep_alive: "15m",
        format: structuredFormat,
        options: { temperature: 0, seed: 0, num_predict: 500 },
        messages: [
          {
            role: "system",
            content: "You are MotionLayer's senior motion-design editor. Convert plain-English direction into one compact flat patch per target. Use flat keys such as headline, preferredRegion, scale, textAlign, treatment, entry, energy, and status. You may revise graphic type, copy, layout, visual treatment, motion, graphic timing, or inclusion. Keep copy concise. Never modify source footage, transcript evidence, confidence, protected-region rules, or factual claims. Use eased, staggered motion and face-safe layouts. Return only schema-valid JSON.",
          },
          {
            role: "user",
            content: JSON.stringify({ instruction: request.prompt, scope: request.scope, styleIntent: request.plan.styleIntent, targets: targetMoments, requiredTargetIds: affectedIds }),
          },
        ],
      }),
    });
    if (!response.ok) throw new Error(`MOTION_PROMPT_HTTP_${response.status}`);
    const payload = ollamaResponseSchema.parse(await response.json());
    const parsed = modelResultSchema.parse(JSON.parse(payload.message.content));
    const validPatches = parsed.patches.filter((patch) => affectedIds.includes(patch.id)).map(expandModelPatch);
    if (!validPatches.length) throw new Error("MOTION_PROMPT_EMPTY");
    return {
      ...parsed,
      patches: validPatches,
      affectedIds,
      moments: applyMotionPromptPatches(request.plan, validPatches, affectedIds),
      provider: model,
      execution: "local" as const,
    };
  } catch {
    const fallback = fallbackMotionPrompt(request, affectedIds);
    return {
      ...fallback,
      affectedIds,
      moments: applyMotionPromptPatches(request.plan, fallback.patches, affectedIds),
      execution: "local" as const,
    };
  } finally {
    clearTimeout(timeout);
  }
}

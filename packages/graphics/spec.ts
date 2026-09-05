import { z } from "zod";

export const ENGINE_VERSION = "1.0.0";
export const UPSTREAM_REVISION = "5c7c689f3cecf8bcb1b4ea329527a1155db49eb8";
export const families = ["title", "statistic", "comparison", "steps", "quote", "product", "explainer"] as const;
export const effects = ["none", "edge", "aurora", "liquid", "plasma", "metal", "smoke"] as const;
export const visualKinds = ["portrait", "statement", "network", "boundary", "ecosystem", "flow"] as const;
export const visualActions = ["identify", "announce", "pause", "connect", "exchange", "restrict", "escape", "compare", "sequence", "learn", "scale", "decline"] as const;
export const visualIcons = ["person", "chip", "agent", "message", "globe", "shield", "document", "network", "chart", "check", "search", "pause", "code", "idea"] as const;
export const entityAssetSchema = z.object({
  file: z.string().regex(/^[a-f0-9]{24}\.png$/), sourceUrl: z.url(),
  license: z.string().max(200), credit: z.string().max(600),
}).strict();
export const visualEntitySchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]{1,100}$/), name: z.string().min(1).max(80),
  kind: z.enum(["person", "brand", "concept", "object"]), mention: z.string().min(1).max(160),
  role: z.string().max(80).default(""), asset: entityAssetSchema.optional(),
}).strict();
export const visualSchema = z.object({
  kind: z.enum(visualKinds), action: z.enum(visualActions),
  entities: z.array(visualEntitySchema).max(6),
  steps: z.array(z.object({label:z.string().min(1).max(64),icon:z.enum(visualIcons)}).strict()).max(5),
  evidence: z.string().max(600), qualifier: z.enum(["", "Script excerpt", "Illustration", "Hypothetical", "Claim in script"]).default("Illustration"),
}).strict();
export type VisualEntity = z.infer<typeof visualEntitySchema>;
export type SceneVisual = z.infer<typeof visualSchema>;
const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
export const styleSchema = z.object({
  palette: z.object({ background: hex, ink: hex, accent: hex, secondary: hex }),
  font: z.enum(["grotesk", "humanist"]), typeScale: z.number().min(.7).max(1.3),
  spacing: z.enum(["compact", "open"]),
  material: z.enum(effects), intensity: z.number().min(0).max(1), speed: z.number().min(0).max(2),
  finish: z.enum(['glass','solid','outline']).optional(), radius: z.number().min(0).max(48).optional(),
}).strict();
export const rectSchema = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), width: z.number().positive().max(1), height: z.number().positive().max(1) }).refine(r => r.x + r.width <= 1.001 && r.y + r.height <= 1.001, "Rectangle exceeds frame");
export const graphicSchema = z.object({
  version: z.literal(ENGINE_VERSION), id: z.string().regex(/^[a-zA-Z0-9_-]{3,120}$/), revision: z.number().int().positive(),
  family: z.enum(families), layout: z.number().int().min(0).max(2),
  visual: visualSchema.optional(),
  source: z.object({ text: z.string().max(5000), refs: z.array(z.string().max(120)).max(100) }),
  content: z.object({ title: z.string().min(1).max(240), detail: z.string().max(600), value: z.string().max(80), attribution: z.string().max(160), items: z.array(z.string().min(1).max(200)).max(5), control: z.enum(["button", "tabs", "input", "progress", "cards"]) }).strict(),
  start: z.number().nonnegative(), duration: z.number().min(.5).max(120),
  box: rectSchema, protectedRegions: z.array(rectSchema).max(20),
  style: styleSchema,
  motion: z.object({ entry: z.number().min(.1).max(2), exit: z.number().min(.1).max(2), energy: z.number().min(0).max(1) }).strict(),
  locks: z.object({ content: z.boolean(), style: z.boolean(), timing: z.boolean() }).strict(),
  enabled: z.boolean(),
}).strict().refine(s => s.motion.entry + s.motion.exit < s.duration, "Entry and exit must leave a readable hold");
export type GraphicSpec = z.infer<typeof graphicSchema>;
export const planSchema = z.object({
  version: z.literal(ENGINE_VERSION), id: z.string().regex(/^gp_[a-zA-Z0-9_-]+$/), revision: z.number().int().positive(),
  createdAt: z.string(), updatedAt: z.string(), sourceText: z.string().max(100000), projectId: z.string().regex(/^[a-zA-Z0-9_-]{3,120}$/).nullable(),
  undoRevision: z.number().int().positive().nullable().default(null),
  width: z.number().int().min(240).max(4096), height: z.number().int().min(240).max(4096), fps: z.number().min(1).max(120), duration: z.number().positive().max(14400),
  direction: z.string().max(300), generation: z.object({ mode: z.enum(["preset", "ai"]), provider: z.string(), note: z.string() }),
  scenes: z.array(graphicSchema).min(1).max(120),
}).strict().superRefine((p, ctx) => {
  const ids = new Set<string>();
  for (const s of p.scenes) {
    if (ids.has(s.id)) ctx.addIssue({ code: "custom", message: "Duplicate scene ID" });
    ids.add(s.id);
    if (s.start + s.duration > p.duration + .001) ctx.addIssue({ code: "custom", message: "Scene exceeds source duration" });
    if (s.enabled && s.protectedRegions.some(r => intersects(s.box, r))) ctx.addIssue({ code: "custom", message: "Graphic overlaps a protected region" });
  }
  const enabled = p.scenes.filter(s => s.enabled).sort((a,b) => a.start-b.start);
  if (enabled.some((s,i) => i > 0 && enabled[i-1].start + enabled[i-1].duration > s.start + .001)) ctx.addIssue({ code: "custom", message: "Graphics must not overlap in time" });
});
export type GraphicsPlan = z.infer<typeof planSchema>;
export function intersects(a: z.infer<typeof rectSchema>, b: z.infer<typeof rectSchema>) { return a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y; }
export function sceneAt(plan: GraphicsPlan, seconds: number) { return plan.scenes.find(s => s.enabled && seconds >= s.start && seconds < s.start + s.duration); }
export function motionAt(spec: GraphicSpec, seconds: number) {
  const t = Math.max(0, Math.min(spec.duration, seconds));
  const ease = (v: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, v)), 3);
  const entry = ease(t / spec.motion.entry), exit = ease((spec.duration-t) / spec.motion.exit);
  return { opacity: Math.min(entry, exit), y: (1-entry) * (20+spec.motion.energy*55) - (1-exit)*18, progress: ease((t-spec.motion.entry)/Math.max(.2,spec.duration-spec.motion.entry-spec.motion.exit)), frame: 1800 + t*1000*spec.style.speed };
}
export function enforceLocks(before: GraphicSpec, after: GraphicSpec): GraphicSpec {
  return graphicSchema.parse({ ...after, id: before.id, source: before.source, protectedRegions: before.protectedRegions, revision: before.revision+1,
    ...(before.locks.content ? { content: before.content, visual: before.visual } : {}),
    ...(before.locks.style ? { style: before.style, family: before.family, layout: before.layout, box: before.box } : {}),
    ...(before.locks.timing ? { start: before.start, duration: before.duration, motion: before.motion } : {}),
  });
}

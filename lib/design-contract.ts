import { createHash } from "node:crypto";
import { z } from "zod";

const tokenGroupSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

export const designSourceSchema = z.object({
  type: z.enum(["default", "workspace", "skill", "brand-kit", "user-direction"]),
  id: z.string(),
  version: z.union([z.string(), z.number()]),
  checksum: z.string().optional(),
});

export const designInputSchema = z.object({
  source: designSourceSchema,
  tokens: z.record(z.string(), tokenGroupSchema).default({}),
  motionGrammar: z.object({
    energy: z.number().min(0).max(1).optional(),
    easingFamily: z.string().optional(),
    entryPrinciples: z.array(z.string()).optional(),
    holdPrinciples: z.array(z.string()).optional(),
    exitPrinciples: z.array(z.string()).optional(),
    transitionPrinciples: z.array(z.string()).optional(),
  }).default({}),
  compositionRules: z.array(z.string()).default([]),
  assetRules: z.array(z.string()).default([]),
  negativeConstraints: z.array(z.string()).default([]),
  aspectRatioOverrides: z.record(z.string(), z.unknown()).default({}),
});

export const designContractSchema = z.object({
  id: z.string(),
  sources: z.array(designSourceSchema),
  tokens: z.record(z.string(), tokenGroupSchema),
  motionGrammar: z.object({
    energy: z.number().min(0).max(1),
    easingFamily: z.string(),
    entryPrinciples: z.array(z.string()),
    holdPrinciples: z.array(z.string()),
    exitPrinciples: z.array(z.string()),
    transitionPrinciples: z.array(z.string()),
  }),
  compositionRules: z.array(z.string()),
  assetRules: z.array(z.string()),
  negativeConstraints: z.array(z.string()),
  aspectRatioOverrides: z.record(z.string(), z.unknown()),
  conflicts: z.array(z.object({ field: z.string(), keptSource: z.string(), replacedSource: z.string() })),
  checksum: z.string(),
});

export type DesignInput = z.infer<typeof designInputSchema>;
export type DesignContract = z.infer<typeof designContractSchema>;

const precedence: Record<DesignInput["source"]["type"], number> = {
  default: 0,
  workspace: 1,
  skill: 2,
  "brand-kit": 3,
  "user-direction": 4,
};

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function compileDesignContract(rawInputs: DesignInput[], version = 1): DesignContract {
  const inputs = rawInputs.map((input) => designInputSchema.parse(input)).sort((a, b) => precedence[a.source.type] - precedence[b.source.type]);
  const tokens: Record<string, Record<string, string | number | boolean>> = {};
  const owners = new Map<string, string>();
  const conflicts: DesignContract["conflicts"] = [];
  const motion = { energy: 0.42, easingFamily: "restrained-editorial", entryPrinciples: [] as string[], holdPrinciples: [] as string[], exitPrinciples: [] as string[], transitionPrinciples: [] as string[] };
  let motionOwner = "MotionLayer defaults";

  for (const input of inputs) {
    for (const [group, values] of Object.entries(input.tokens)) {
      tokens[group] ??= {};
      for (const [key, value] of Object.entries(values)) {
        const field = `tokens.${group}.${key}`;
        const previous = owners.get(field);
        if (previous && tokens[group][key] !== value) conflicts.push({ field, keptSource: input.source.id, replacedSource: previous });
        tokens[group][key] = value;
        owners.set(field, input.source.id);
      }
    }
    if (input.motionGrammar.energy !== undefined) {
      if (motion.energy !== input.motionGrammar.energy) conflicts.push({ field: "motionGrammar.energy", keptSource: input.source.id, replacedSource: motionOwner });
      motion.energy = input.motionGrammar.energy;
      motionOwner = input.source.id;
    }
    if (input.motionGrammar.easingFamily) motion.easingFamily = input.motionGrammar.easingFamily;
    for (const key of ["entryPrinciples", "holdPrinciples", "exitPrinciples", "transitionPrinciples"] as const) {
      motion[key] = unique([...motion[key], ...(input.motionGrammar[key] ?? [])]);
    }
  }

  const value = {
    id: `design_contract_v${version}`,
    sources: inputs.map((input) => input.source),
    tokens,
    motionGrammar: motion,
    compositionRules: unique(inputs.flatMap((input) => input.compositionRules)),
    assetRules: unique(inputs.flatMap((input) => input.assetRules)),
    negativeConstraints: unique(inputs.flatMap((input) => input.negativeConstraints)),
    aspectRatioOverrides: Object.assign({}, ...inputs.map((input) => input.aspectRatioOverrides)),
    conflicts,
  };
  return designContractSchema.parse({ ...value, checksum: `sha256:${createHash("sha256").update(canonical(value)).digest("hex")}` });
}

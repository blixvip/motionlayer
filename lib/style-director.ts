import { z } from "zod";

export const styleProfileIds = ["editorial-proof", "field-notes", "blueprint"] as const;
export const styleDirectionSchema = z.object({
  profileId: z.enum(styleProfileIds).default("editorial-proof"),
  density: z.enum(["sparse", "balanced"]).default("sparse"),
  motion: z.enum(["restrained", "expressive"]).default("restrained"),
  referenceNotes: z.string().trim().max(280).default(""),
});

export type StyleDirection = z.infer<typeof styleDirectionSchema>;

export type StyleDirectorProfile = {
  id: StyleDirection["profileId"];
  label: string;
  description: string;
  palette: { paper: string; ink: string; accent: string; soft: string };
  grammar: string;
};

export const STYLE_DIRECTOR_PROFILES: readonly StyleDirectorProfile[] = [
  {
    id: "editorial-proof",
    label: "Editorial proof",
    description: "Hard hierarchy, evidence-led frames, restrained lime notation.",
    palette: { paper: "#eeeade", ink: "#11120f", accent: "#76b900", soft: "#d8d3c5" },
    grammar: "print-tech editorial",
  },
  {
    id: "field-notes",
    label: "Field notes",
    description: "Warm stock, documentary pacing, human red-pencil emphasis.",
    palette: { paper: "#f1eadf", ink: "#24211d", accent: "#d24b32", soft: "#d8cdbd" },
    grammar: "documentary field notes",
  },
  {
    id: "blueprint",
    label: "Blueprint",
    description: "Cool technical paper, structural lines, precise orange signals.",
    palette: { paper: "#e9eef1", ink: "#10243d", accent: "#e56334", soft: "#cdd8df" },
    grammar: "technical blueprint",
  },
] as const;

export const DEFAULT_STYLE_DIRECTION: StyleDirection = {
  profileId: "editorial-proof",
  density: "sparse",
  motion: "restrained",
  referenceNotes: "",
};

export const ANTI_SLOP_CONSTRAINTS = [
  "Never repeat the same centered title-card layout across consecutive beats",
  "Do not illustrate every sentence; use quiet holds when typography is enough",
  "Use one dominant visual grammar per piece and vary hierarchy inside it",
  "No gradients, glass, glow, generic card grids, fake telemetry, or decorative UI chrome",
  "Use verified source assets only and keep generated evidence clearly labeled",
] as const;

export function resolveStyleDirection(input?: Partial<StyleDirection> | null): StyleDirection {
  const parsed = styleDirectionSchema.safeParse(input ?? {});
  return parsed.success ? parsed.data : DEFAULT_STYLE_DIRECTION;
}

export function getStyleDirectorProfile(id: StyleDirection["profileId"]): StyleDirectorProfile {
  return STYLE_DIRECTOR_PROFILES.find((profile) => profile.id === id) ?? STYLE_DIRECTOR_PROFILES[0];
}

export function styleDirectorCss(direction: StyleDirection) {
  const profile = getStyleDirectorProfile(direction.profileId);
  return `--paper:${profile.palette.paper};--ink:${profile.palette.ink};--green:${profile.palette.accent};--soft:${profile.palette.soft};--motion-energy:${direction.motion === "expressive" ? "1" : ".72"}`;
}

export type StyleDirectionReceipt = {
  profileId: StyleDirection["profileId"];
  profileLabel: string;
  density: StyleDirection["density"];
  motion: StyleDirection["motion"];
  grammar: string;
  referenceMode: "quiet" | "kinetic" | "neutral";
};

export function referenceMode(direction: StyleDirection): StyleDirectionReceipt["referenceMode"] {
  if (/\b(?:quiet|calm|minimal|slow|restrained|documentary)\b/i.test(direction.referenceNotes)) return "quiet";
  if (/\b(?:fast|kinetic|energetic|punchy|urgent|dynamic)\b/i.test(direction.referenceNotes)) return "kinetic";
  return "neutral";
}

export function styleDirectionReceipt(direction: StyleDirection): StyleDirectionReceipt {
  const profile = getStyleDirectorProfile(direction.profileId);
  return { profileId: profile.id, profileLabel: profile.label, density: direction.density, motion: direction.motion, grammar: profile.grammar, referenceMode: referenceMode(direction) };
}

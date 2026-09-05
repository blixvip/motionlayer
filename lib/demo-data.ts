import type { MotionPlan } from "./motion-plan";

export const transcript = [
  { id: "t1", start: 0.0, end: 3.5, speaker: "KAI", text: "A strong motion layer starts by protecting the edit you already approved." },
  { id: "t2", start: 3.5, end: 7.4, speaker: "KAI", text: "The source stays locked while every graphic remains independently editable." },
  { id: "t3", start: 7.4, end: 11.7, speaker: "KAI", text: "First we understand the words and the frame, then we propose only the moments that need help." },
  { id: "t4", start: 11.7, end: 15.2, speaker: "KAI", text: "That means less decoration, clearer ideas, and a motion plan you can actually trust." },
  { id: "t5", start: 15.2, end: 18.0, speaker: "KAI", text: "Approve the useful beats, revise them in plain English, and export the finish." },
];

export const demoPlan: MotionPlan = {
  projectSummary: "An educational explainer about evidence-led motion finishing.",
  sourceLocked: true,
  styleIntent: "Editorial precision, restrained energy, chartreuse registration details.",
  density: "balanced",
  moments: [
    {
      id: "mg_hook", startSeconds: 0.45, endSeconds: 3.1,
      transcriptExcerpt: "A strong motion layer starts by protecting the edit",
      purpose: "orient", type: "hook-title", priority: "essential", confidence: 0.96,
      reason: "The opening establishes the product promise; a concise title gives the viewer immediate orientation.",
      content: { headline: "Protect the edit.", supportingText: "Add only what earns its frame.", data: [] },
      layout: { preferredRegion: "upper-left", avoidRegions: ["speaker-face", "existing-caption"], safeZoneNotes: "Clear sky plate in the upper-left; 8% title-safe inset." },
      motion: { entry: "masked line reveal", hold: "quiet lockup", exit: "fast crop close", energy: 0.42 },
      sourceEvidence: { transcriptStart: 0.0, transcriptEnd: 3.5, requiresVerification: false }, requiresAsset: false, status: "ready",
    },
    {
      id: "mg_lower", startSeconds: 3.8, endSeconds: 7.0,
      transcriptExcerpt: "The source stays locked",
      purpose: "emphasize", type: "lower-third", priority: "helpful", confidence: 0.91,
      reason: "The locked-source rule is foundational and benefits from a persistent status treatment.",
      content: { headline: "SOURCE EDIT", supportingText: "Locked · timing preserved", data: [] },
      layout: { preferredRegion: "lower-left", avoidRegions: ["existing-caption"], safeZoneNotes: "Raised 96 px above the caption rail." },
      motion: { entry: "registration line draw", hold: "static label", exit: "line retract", energy: 0.28 },
      sourceEvidence: { transcriptStart: 3.5, transcriptEnd: 7.4, requiresVerification: false }, requiresAsset: false, status: "accepted",
    },
    {
      id: "mg_steps", startSeconds: 7.7, endSeconds: 11.55,
      transcriptExcerpt: "First we understand the words and the frame, then we propose",
      purpose: "clarify", type: "step-list", priority: "essential", confidence: 0.94,
      reason: "The spoken sequence asks the viewer to hold three stages in working memory.",
      content: { headline: "From source to motion", supportingText: "Three inspectable stages", data: ["Understand", "Plan", "Generate"] },
      layout: { preferredRegion: "right-center", avoidRegions: ["speaker-face"], safeZoneNotes: "Right-side negative space remains clear across sampled frames." },
      motion: { entry: "staggered ledger build", hold: "active step trace", exit: "single group fade", energy: 0.46 },
      sourceEvidence: { transcriptStart: 7.4, transcriptEnd: 11.7, requiresVerification: false }, requiresAsset: false, status: "suggested",
    },
    {
      id: "mg_quote", startSeconds: 12.0, endSeconds: 15.05,
      transcriptExcerpt: "less decoration, clearer ideas",
      purpose: "emphasize", type: "pull-quote", priority: "helpful", confidence: 0.88,
      reason: "This is the central creative principle and deserves a short visual beat without repeating the entire sentence.",
      content: { headline: "Less decoration.\nClearer ideas.", supportingText: "", data: [] },
      layout: { preferredRegion: "upper-right", avoidRegions: ["speaker-face", "logo"], safeZoneNotes: "Narrow measure avoids the protected center portrait region." },
      motion: { entry: "word-by-word focus", hold: "steady", exit: "soft defocus", energy: 0.36 },
      sourceEvidence: { transcriptStart: 11.7, transcriptEnd: 15.2, requiresVerification: false }, requiresAsset: false, status: "suggested",
    },
    {
      id: "mg_stat", startSeconds: 15.35, endSeconds: 17.8,
      transcriptExcerpt: "Approve the useful beats",
      purpose: "orient", type: "stat-card", priority: "optional", confidence: 0.76,
      reason: "A compact completion signal closes the workflow, though the source is already visually active.",
      content: { headline: "3 deliberate passes", supportingText: "Approve · Revise · Export", data: ["3"] },
      layout: { preferredRegion: "upper-left", avoidRegions: ["speaker-face", "existing-caption"], safeZoneNotes: "Use only if the closing frame stays below the density threshold." },
      motion: { entry: "calibrated count-up", hold: "settled figure", exit: "aperture close", energy: 0.5 },
      sourceEvidence: { transcriptStart: 15.2, transcriptEnd: 18.0, requiresVerification: true }, requiresAsset: false, status: "suggested",
    },
  ],
};

export const demoProject = {
  id: "demo", name: "Motion with intention", aspect: "16:9", resolution: "1280 × 720", fps: 30, duration: 18,
  platform: "YouTube", updated: "Just now", progress: 72, stage: "Plan review", thumbnail: "/demo/poster.jpg",
};

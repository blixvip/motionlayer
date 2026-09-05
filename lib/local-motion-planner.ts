import { motionPlanSchema, type MotionMoment, type MotionPlan } from "./motion-plan";
import type { StoredTranscriptSegment } from "./project-store";

const types: MotionMoment["type"][] = ["hook-title", "step-list", "stat-card", "pull-quote", "lower-third"];
const regions = ["upper-left", "right-center", "upper-right", "lower-left"];

function words(text: string) {
  return text.replace(/[^\p{L}\p{N}%$'’-]+/gu, " ").trim().split(/\s+/).filter(Boolean);
}

function headlineFor(text: string, type: MotionMoment["type"]) {
  const sourceWords = words(text);
  const numeric = sourceWords.find((word) => /\d|%|\$/.test(word));
  const chosen = type === "stat-card" && numeric
    ? [numeric, ...sourceWords.filter((word) => word !== numeric).slice(0, 4)]
    : sourceWords.slice(0, Math.min(7, sourceWords.length));
  const line = chosen.join(" ");
  return line ? line.charAt(0).toUpperCase() + line.slice(1) : "Key idea";
}

function stepDataFor(text: string) {
  const clauses = text.split(/[,;]|\bthen\b|\band then\b/gi)
    .map((clause) => clause.replace(/^\s*(first|second|third|next|finally)\b[,:]?\s*/i, "").trim())
    .filter((clause) => words(clause).length > 1);
  return clauses.slice(0, 3).map((clause) => {
    const meaningful = words(clause).filter((word) => !/^(the|a|an|that|to)$/i.test(word)).slice(0, 4);
    const value = meaningful.join(" ");
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Next idea";
  });
}

function scoreSegment(segment: StoredTranscriptSegment, index: number) {
  let score = index === 0 ? 4 : 0;
  if (/\d|percent|million|billion|first|second|third|steps?|ways?|reasons?/i.test(segment.text)) score += 4;
  if (/because|means|important|problem|solution|never|always|must|need|result|finally|actually/i.test(segment.text)) score += 2;
  if (segment.text.length > 55) score += 1;
  return score;
}

export function splitTranscriptBeats(segments: StoredTranscriptSegment[]) {
  return segments.flatMap((segment) => {
    let parts = (segment.text.match(/[^.!?]+[.!?]?/g) ?? [segment.text]).map((part) => part.trim()).filter(Boolean);
    if (parts.length === 1 && segment.endSeconds - segment.startSeconds > 6.5) {
      const commaParts = segment.text.split(/,\s+|;\s+/).map((part) => part.trim()).filter(Boolean);
      if (commaParts.length > 1) parts = commaParts;
    }
    if (parts.length === 1) return [segment];
    const weights = parts.map((part) => Math.max(1, words(part).length));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const segmentDuration = segment.endSeconds - segment.startSeconds;
    let cursor = segment.startSeconds;
    return parts.map((text, index) => {
      const endSeconds = index === parts.length - 1 ? segment.endSeconds : cursor + segmentDuration * (weights[index] / totalWeight);
      const beat = { ...segment, id: `${segment.id}_${index + 1}`, startSeconds: cursor, endSeconds, text };
      cursor = endSeconds;
      return beat;
    });
  });
}

export function buildMotionPlan(segments: StoredTranscriptSegment[], durationSeconds: number): MotionPlan {
  if (!segments.length) throw new Error("TRANSCRIPT_EMPTY");
  const beats = splitTranscriptBeats(segments);
  const duration = Math.max(durationSeconds, beats.at(-1)?.endSeconds ?? 1);
  const maxVisuals = Math.max(1, Math.min(14, Math.floor(duration / 8)));
  const ranked = beats
    .map((segment, index) => ({ segment, index, score: scoreSegment(segment, index) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, maxVisuals);
  const chosen = new Set(ranked.map((entry) => entry.index));
  if (!chosen.has(0)) chosen.add(0);

  const visualIndexes = [...chosen].sort((a, b) => a - b).slice(0, maxVisuals);
  const moments = visualIndexes.map((segmentIndex, visualIndex): MotionMoment => {
    const segment = beats[segmentIndex];
    const hasNumber = /\d|%|\$/.test(segment.text);
    const hasSequence = /first|second|third|steps?|ways?|reasons?/i.test(segment.text);
    const type = hasNumber ? "stat-card" : hasSequence ? "step-list" : types[visualIndex % types.length];
    const start = Math.max(0, segment.startSeconds + (visualIndex === 0 ? 0.08 : 0.12));
    const end = Math.min(duration, Math.max(start + 1.8, segment.endSeconds + 0.25));
    const sourceWords = words(segment.text);
    const data = type === "step-list"
      ? stepDataFor(segment.text)
      : type === "stat-card" ? sourceWords.filter((word) => /\d|%|\$/.test(word)).slice(0, 2) : [];
    const accentWord = sourceWords.find((word) => /\d|%|\$/.test(word)) ?? sourceWords[Math.min(1, sourceWords.length - 1)];
    return {
      id: `mg_auto_${String(visualIndex + 1).padStart(2, "0")}`,
      startSeconds: start,
      endSeconds: end,
      transcriptExcerpt: segment.text,
      purpose: hasNumber ? "prove" : hasSequence ? "clarify" : visualIndex === 0 ? "orient" : "emphasize",
      type,
      archetype: type === "lower-third" ? "overlay" : type === "hook-title" || type === "pull-quote" ? "typographic" : "full-frame-ui",
      renderEngine: "hyperframes",
      accentWord,
      priority: visualIndex === 0 || hasNumber ? "essential" : "helpful",
      confidence: segment.confidence ?? 0.86,
      reason: hasNumber ? "A number in the source deserves a visual anchor." : hasSequence ? "The spoken sequence is easier to retain as ordered motion." : visualIndex === 0 ? "The opening idea earns a concise orientation beat." : "This load-bearing idea benefits from a short emphasis beat.",
      content: {
        headline: headlineFor(segment.text, type),
        supportingText: type === "hook-title" ? "Motion generated from the transcript" : "",
        data: data.length ? data : type === "step-list" ? ["Understand", "Shape", "Animate"] : [],
      },
      layout: {
        preferredRegion: regions[visualIndex % regions.length],
        avoidRegions: ["speaker-face", "existing-caption"],
        safeZoneNotes: "Keep inside title-safe and clear of captions; reposition after reviewing the plate.",
      },
      motion: {
        entry: type === "step-list" ? "staggered ledger build" : type === "stat-card" ? "pop blur fade" : "masked line reveal",
        hold: "slow camera drift",
        exit: "fast eased fade",
        energy: 0.38 + (visualIndex % 3) * 0.06,
      },
      sourceEvidence: { transcriptStart: segment.startSeconds, transcriptEnd: segment.endSeconds, requiresVerification: hasNumber },
      requiresAsset: false,
      status: "ready",
    };
  });

  const beatClassifications = beats.map((segment, index) => ({
    id: `beat_${String(index + 1).padStart(3, "0")}`,
    startSeconds: segment.startSeconds,
    endSeconds: segment.endSeconds,
    classification: chosen.has(index) ? "VISUAL" as const : "REST" as const,
    reason: chosen.has(index) ? "Load-bearing transcript beat selected for motion." : "Intentional visual rest keeps the edit from becoming over-decorated.",
  }));
  const restDuration = beatClassifications.filter((beat) => beat.classification === "REST").reduce((sum, beat) => sum + beat.endSeconds - beat.startSeconds, 0);

  return motionPlanSchema.parse({
    projectSummary: "A locally transcribed video with evidence-linked motion graphics.",
    sourceLocked: true,
    styleIntent: "Editorial, restrained, high-contrast motion with staggered entrances and eased camera drift.",
    density: "balanced",
    beatClassifications,
    restRatio: Math.min(1, restDuration / duration),
    recurringElements: ["Transcript-linked title system"],
    paletteEvidence: "Neutral MotionLayer palette until footage sampling is approved.",
    moments,
  });
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { buildDirectedMotionPlan } from "@/lib/transcript-director";
import { coalesceTranscriptSegmentsForCleanup, probeMediaLocally, transcribeMediaLocally } from "@/lib/local-transcription";
import { getStoredProject, updateStoredProject } from "@/lib/project-store";
import { resolveLocalObjectKey } from "@/lib/storage";
import { normalizeTranscriptLocally } from "@/lib/transcript-normalizer";
import { z } from "zod";

const analysisInputSchema = z.object({ model: z.enum(["tiny.en", "base.en", "small.en", "medium.en", "large-v3"]).optional(), replan: z.boolean().optional() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await context.params;
  const input = analysisInputSchema.parse(await request.json().catch(() => ({})));
  const project = await getStoredProject(id);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  if (project.stage === "ready" && project.motionPlan && project.transcript && !input.replan) return NextResponse.json({ project, reused: true });

  if (input.replan && project.transcript?.length) {
    const directedPlan = await buildDirectedMotionPlan(project.transcript, project.duration);
    // Planning is intentionally metadata-only. Full assets are acquired only after
    // a user approves the corresponding beat.
    const motionPlan = directedPlan;
    const ready = await updateStoredProject(id, { stage: "ready", progress: 100, motionPlan, semanticGraph: directedPlan.semanticGraph, storyboard: directedPlan.storyboard, error: undefined });
    return NextResponse.json({ project: ready, director: { provider: directedPlan.directorProvider, execution: "local" }, semanticGraph: directedPlan.semanticGraph, storyboard: directedPlan.storyboard, assets: motionPlan.moments.filter((moment) => moment.asset).map((moment) => moment.asset), motionGraphics: motionPlan.moments.length, replanned: true });
  }

  try {
    await updateStoredProject(id, { stage: "transcribing", progress: 36, error: undefined });
    const inputPath = resolveLocalObjectKey(project.assetKey);
    const projectDir = join(process.cwd(), "data", "analysis", id);
    await mkdir(projectDir, { recursive: true });
    const [probe, raw] = await Promise.all([
      probeMediaLocally(inputPath),
      transcribeMediaLocally({ inputPath, projectDir, model: input.model ?? (process.env.WHISPER_MODEL as "small.en" | undefined) ?? "small.en", language: "en" }),
    ]);
    if (!raw.words.length || !raw.segments.length) throw new Error("NO_SPEECH_DETECTED");
    const chunks = coalesceTranscriptSegmentsForCleanup(raw.segments);
    const cleaned = await normalizeTranscriptLocally({ segments: chunks });
    await updateStoredProject(id, { stage: "planning", progress: 76 });
    const duration = probe?.duration || raw.durationSeconds;
    const transcript = cleaned.segments.map((segment) => ({
      id: segment.id,
      startSeconds: segment.startSeconds,
      endSeconds: segment.endSeconds,
      text: segment.text,
      rawText: segment.rawText,
      confidence: segment.confidence,
      normalized: segment.normalized,
    }));
    const directedPlan = await buildDirectedMotionPlan(transcript, duration);
    const motionPlan = directedPlan;
    const ready = await updateStoredProject(id, {
      stage: "ready",
      progress: 100,
      duration,
      width: probe?.width ?? project.width,
      height: probe?.height ?? project.height,
      fps: probe?.fps ?? project.fps,
      transcript,
      words: raw.words,
      motionPlan,
      semanticGraph: directedPlan.semanticGraph,
      storyboard: directedPlan.storyboard,
      error: undefined,
    });
    return NextResponse.json({
      project: ready,
      transcription: { engine: raw.engine, model: raw.model, wordCount: raw.words.length },
      cleanup: { provider: cleaned.provider, execution: cleaned.execution, fallbackReason: cleaned.fallbackReason },
      director: { provider: directedPlan.directorProvider, execution: "local" },
      semanticGraph: directedPlan.semanticGraph,
      storyboard: directedPlan.storyboard,
      assets: motionPlan.moments.filter((moment) => moment.asset).map((moment) => moment.asset),
      motionGraphics: motionPlan.moments.length,
    });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("NO_SPEECH_DETECTED")
      ? "No speech was detected in this video."
      : "Local analysis failed. Confirm the speech tools are installed, then retry.";
    await updateStoredProject(id, { stage: "failed", progress: 18, error: message });
    return NextResponse.json({ error: message, sourceLocked: true }, { status: 503 });
  }
}

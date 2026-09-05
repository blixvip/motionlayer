import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { requireSession } from "@/lib/auth";
import { coalesceTranscriptSegmentsForCleanup, transcribeMediaLocally, whisperModels } from "@/lib/local-transcription";
import { resolveLocalObjectKey } from "@/lib/storage";
import { normalizeTranscriptLocally } from "@/lib/transcript-normalizer";

const inputSchema = z.object({
  assetKey: z.string().min(1).max(300),
  model: z.enum(whisperModels).default("small.en"),
  language: z.string().regex(/^[a-z]{2,3}$/).default("en"),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await context.params;

  try {
    const input = inputSchema.parse(await request.json());
    const inputPath = resolveLocalObjectKey(input.assetKey);
    const projectDir = join(process.cwd(), "data", "analysis", id);
    await mkdir(projectDir, { recursive: true });
    const raw = await transcribeMediaLocally({ inputPath, projectDir, model: input.model, language: input.language });
    const cleanupChunks = coalesceTranscriptSegmentsForCleanup(raw.segments);
    const cleaned = input.language === "en"
      ? await normalizeTranscriptLocally({ segments: cleanupChunks })
      : { provider: null, execution: "skipped" as const, segments: cleanupChunks, fallbackReason: "english-only" as const };

    return NextResponse.json({
      projectId: id,
      stage: "transcript-ready",
      sourceLocked: true,
      transcription: { engine: raw.engine, model: raw.model, execution: raw.execution, durationSeconds: raw.durationSeconds, wordCount: raw.words.length },
      cleanup: cleaned,
      words: raw.words,
      segments: cleaned.segments,
    });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Local transcription input is invalid.", details: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Local transcription failed.", recovery: "The source asset is unchanged; retry with a smaller Whisper model." }, { status: 503 });
  }
}

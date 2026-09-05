import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireSession } from "@/lib/auth";
import { normalizeTranscriptLocally, transcriptCleanupInputSchema } from "@/lib/transcript-normalizer";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await context.params;

  try {
    const input = transcriptCleanupInputSchema.parse(await request.json());
    const result = await normalizeTranscriptLocally(input);
    return NextResponse.json({ projectId: id, stage: "transcript-normalized", priorWorkSafe: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Transcript cleanup input is invalid.", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Transcript cleanup could not be started." }, { status: 500 });
  }
}

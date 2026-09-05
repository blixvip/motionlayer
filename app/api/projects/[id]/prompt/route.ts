import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireSession } from "@/lib/auth";
import { motionPromptRequestSchema, runMotionPrompt } from "@/lib/motion-prompt";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await context.params;
  try {
    const input = motionPromptRequestSchema.parse(await request.json());
    const result = await runMotionPrompt(input);
    return NextResponse.json({ projectId: id, sourceLocked: true, evidencePreserved: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "The motion prompt or project state is invalid.", details: error.issues }, { status: 400 });
    return NextResponse.json({ error: "The local motion prompt could not be applied. Your previous version is unchanged." }, { status: 503 });
  }
}

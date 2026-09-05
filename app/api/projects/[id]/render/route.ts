import { NextResponse } from "next/server";
import { z } from "zod";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { requireSession } from "@/lib/auth";
import { getStoredProject } from "@/lib/project-store";
import { renderStoredProject } from "@/lib/project-renderer";

const schema = z.object({ format: z.enum(["mp4", "mov"]), quality: z.enum(["draft", "standard", "high"]), compositionVersion: z.string().min(1) });
const statusSchema = z.object({ jobId: z.string().min(1), format: z.enum(["mp4", "mov"]) });

const artifacts = {
  mp4: { file: "motionlayer-demo.mp4", container: "H.264/AAC MP4" },
  mov: { file: "motionlayer-overlay.mov", container: "ProRes 4444 alpha MOV" },
} as const;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await context.params;
  const input = schema.parse(await request.json());
  const jobId = `job_render_${crypto.randomUUID()}`;
  if (id !== "demo") {
    const project = await getStoredProject(id);
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    try {
      await renderStoredProject(project, input.format, input.quality);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Project render failed." }, { status: 503 });
    }
  }
  return NextResponse.json({
    jobId,
    projectId: id,
    stage: "queued",
    progress: 0,
    cacheKey: `${id}:${input.compositionVersion}:${input.format}:${input.quality}`,
    statusUrl: `/api/projects/${id}/render?jobId=${encodeURIComponent(jobId)}&format=${input.format}`,
    cancellable: true,
  }, { status: 202 });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await context.params;
  const query = statusSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  const artifact = artifacts[query.format];

  try {
    const isDemo = id === "demo";
    const path = isDemo
      ? join(process.cwd(), "public", "demo", artifact.file)
      : join(process.cwd(), "data", "projects", id, "renders", query.format === "mp4" ? "motionlayer-final.mp4" : "motionlayer-overlay.mov");
    const metadata = await stat(path);
    if (!metadata.isFile() || metadata.size === 0) throw new Error("Render artifact is empty.");

    return NextResponse.json({
      jobId: query.jobId,
      projectId: id,
      stage: "completed",
      progress: 100,
      artifact: {
        url: isDemo ? `/demo/${artifact.file}` : `/api/projects/${id}/render/file?format=${query.format}`,
        bytes: metadata.size,
        container: artifact.container,
        verified: true,
      },
    });
  } catch {
    return NextResponse.json({
      jobId: query.jobId,
      projectId: id,
      stage: "failed",
      progress: 0,
      error: "The render worker did not produce a valid artifact. Prior versions are still safe; retry this render stage.",
    }, { status: 503 });
  }
}

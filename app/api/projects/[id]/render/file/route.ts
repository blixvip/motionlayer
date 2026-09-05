import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getStoredProject } from "@/lib/project-store";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await context.params;
  if (!await getStoredProject(id)) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const format = new URL(request.url).searchParams.get("format") === "mov" ? "mov" : "mp4";
  const root = resolve(process.cwd(), "data", "projects", id, "renders");
  const path = resolve(root, format === "mov" ? "motionlayer-overlay.mov" : "motionlayer-final.mp4");
  if (!path.startsWith(`${root}${sep}`)) return NextResponse.json({ error: "Invalid artifact path." }, { status: 400 });
  const metadata = await stat(path);
  const stream = Readable.toWeb(createReadStream(path)) as ReadableStream;
  return new Response(stream, { headers: { "content-type": format === "mov" ? "video/quicktime" : "video/mp4", "content-length": String(metadata.size), "content-disposition": `attachment; filename="${format === "mov" ? "motionlayer-overlay.mov" : "motionlayer-final.mp4"}"` } });
}

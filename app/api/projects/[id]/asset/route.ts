import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getStoredProject } from "@/lib/project-store";

function mimeFor(path: string) {
  const extension = path.toLowerCase().split(".").at(-1);
  if (extension === "svg") return "image/svg+xml";
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  if (extension === "ico") return "image/x-icon";
  return "application/octet-stream";
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await context.params;
  if (!await getStoredProject(id)) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const relative = new URL(request.url).searchParams.get("path") ?? "";
  const mediaRoot = resolve(process.cwd(), "data", "projects", id, ".media");
  const path = resolve(process.cwd(), "data", "projects", id, relative);
  if (!path.startsWith(`${mediaRoot}${sep}`)) return NextResponse.json({ error: "Invalid asset path." }, { status: 400 });
  const metadata = await stat(path);
  const stream = Readable.toWeb(createReadStream(path)) as ReadableStream;
  return new Response(stream, { headers: { "content-type": mimeFor(path), "content-length": String(metadata.size), "cache-control": "private, max-age=86400" } });
}

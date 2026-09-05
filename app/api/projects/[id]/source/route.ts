import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getStoredProject } from "@/lib/project-store";
import { resolveLocalObjectKey } from "@/lib/storage";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await context.params;
  const project = await getStoredProject(id);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const path = resolveLocalObjectKey(project.assetKey);
  const metadata = await stat(path);
  const range = request.headers.get("range");
  const commonHeaders = {
    "accept-ranges": "bytes",
    "content-type": project.mime,
    "cache-control": "private, max-age=3600",
  };

  if (!range) {
    const stream = Readable.toWeb(createReadStream(path)) as ReadableStream;
    return new Response(stream, { headers: { ...commonHeaders, "content-length": String(metadata.size) } });
  }

  const match = /^bytes=(\d+)-(\d*)$/.exec(range);
  if (!match) return new Response(null, { status: 416, headers: { "content-range": `bytes */${metadata.size}` } });
  const start = Number(match[1]);
  const end = Math.min(match[2] ? Number(match[2]) : metadata.size - 1, metadata.size - 1);
  if (start > end || start >= metadata.size) return new Response(null, { status: 416, headers: { "content-range": `bytes */${metadata.size}` } });
  const stream = Readable.toWeb(createReadStream(path, { start, end })) as ReadableStream;
  return new Response(stream, {
    status: 206,
    headers: {
      ...commonHeaders,
      "content-length": String(end - start + 1),
      "content-range": `bytes ${start}-${end}/${metadata.size}`,
    },
  });
}

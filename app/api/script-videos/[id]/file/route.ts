import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { scriptVideoDirectory } from "@/lib/script-video";

export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const path = join(scriptVideoDirectory(id), "video.mp4");
    const metadata = await stat(path);
    if (!metadata.isFile() || metadata.size === 0) throw new Error("VIDEO_NOT_FOUND");
    const bytes = await readFile(path);
    const download = new URL(request.url).searchParams.get("download") === "1";
    const range = request.headers.get("range")?.match(/^bytes=(\d+)-(\d*)$/);
    const start = range ? Number(range[1]) : 0;
    const requestedEnd = range?.[2] ? Number(range[2]) : metadata.size - 1;
    const end = Math.min(requestedEnd, metadata.size - 1);
    if (start < 0 || start > end || start >= metadata.size) return new NextResponse(null, { status: 416, headers: { "content-range": `bytes */${metadata.size}` } });
    const body = range ? bytes.subarray(start, end + 1) : bytes;
    return new NextResponse(body, {
      status: range ? 206 : 200,
      headers: {
        "content-type": "video/mp4",
        "content-length": String(body.byteLength),
        "accept-ranges": "bytes",
        ...(range ? { "content-range": `bytes ${start}-${end}/${metadata.size}` } : {}),
        "cache-control": "private, max-age=3600",
        "content-disposition": `${download ? "attachment" : "inline"}; filename="motionlayer-video.mp4"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { signUploadToken } from "@/lib/storage";

const schema = z.object({ projectId: z.string().min(1), filename: z.string().min(1), size: z.number().positive(), mime: z.enum(["video/mp4", "video/quicktime"]) });

export async function POST(request: Request) {
  await requireSession();
  const input = schema.parse(await request.json());
  const max = Number(process.env.MAX_UPLOAD_BYTES || 5_368_709_120);
  if (input.size > max) return NextResponse.json({ error: "File exceeds the workspace upload limit." }, { status: 413 });
  const uploadId = `upl_${crypto.randomUUID()}`;
  const expiresAt = Date.now() + 60 * 60 * 1000;
  return NextResponse.json({ uploadId, partSize: 10 * 1024 * 1024, token: signUploadToken(input.projectId, uploadId, expiresAt), expiresAt, sourceLocked: true });
}

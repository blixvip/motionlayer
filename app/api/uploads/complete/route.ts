import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { putLocalObject, verifyUploadToken } from "@/lib/storage";
import { createStoredProject } from "@/lib/project-store";

export async function POST(request: Request) {
  await requireSession();
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const projectId = String(form.get("projectId") || "");
  const file = form.get("file");
  if (!verifyUploadToken(token) || !(file instanceof File)) return NextResponse.json({ error: "Upload session is invalid or expired." }, { status: 400 });
  if (!["video/mp4", "video/quicktime"].includes(file.type)) return NextResponse.json({ error: "Only real MP4 and MOV files are accepted." }, { status: 415 });
  const stored = await putLocalObject(projectId, file.name, Buffer.from(await file.arrayBuffer()));
  const project = await createStoredProject({
    id: projectId,
    name: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Untitled video",
    filename: file.name,
    assetKey: stored.key,
    mime: file.type,
    bytes: stored.bytes,
  });
  return NextResponse.json({ asset: stored, project, stage: "uploaded", originalPreserved: true });
}

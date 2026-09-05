import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve, sep } from "node:path";

const storageRoot = resolve(process.cwd(), "data", "objects");

export function resolveLocalObjectKey(key: string) {
  const target = resolve(storageRoot, key);
  if (target !== storageRoot && !target.startsWith(`${storageRoot}${sep}`)) throw new Error("INVALID_OBJECT_PATH");
  return target;
}

export const sanitizeFilename = (name: string) => basename(name).replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 180);
export const hashBuffer = (buffer: Buffer) => createHash("sha256").update(buffer).digest("hex");

export function signUploadToken(projectId: string, uploadId: string, expiresAt: number) {
  const secret = process.env.SESSION_SECRET || "local-development-session-secret-32";
  const payload = `${projectId}.${uploadId}.${expiresAt}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyUploadToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [projectId, uploadId, expires, signature] = parts;
  if (Number(expires) < Date.now()) return false;
  const expected = signUploadToken(projectId, uploadId, Number(expires)).split(".").at(-1) || "";
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function putLocalObject(projectId: string, key: string, data: Buffer) {
  const safeProject = projectId.replace(/[^a-zA-Z0-9_-]/g, "");
  const targetDir = join(storageRoot, safeProject);
  const target = resolve(targetDir, sanitizeFilename(key));
  if (!target.startsWith(targetDir)) throw new Error("INVALID_OBJECT_PATH");
  await mkdir(targetDir, { recursive: true });
  await writeFile(target, data);
  return { key: `${safeProject}/${sanitizeFilename(key)}`, bytes: data.byteLength, sha256: hashBuffer(data) };
}

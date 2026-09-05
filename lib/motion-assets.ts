import { spawn } from "node:child_process";
import { delimiter, relative, resolve, sep } from "node:path";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { getLocalFfmpegPaths } from "./local-transcription";
import { motionPlanSchema, type MotionPlan } from "./motion-plan";

const resolverResultSchema = z.object({ ok: z.literal(true), path: z.string(), source: z.string().optional(), description: z.string().optional() });

function mimeFor(path: string) {
  const extension = path.toLowerCase().split(".").at(-1);
  if (extension === "svg") return "image/svg+xml";
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  if (extension === "ico") return "image/x-icon";
  return "application/octet-stream";
}

async function resolveOne(projectId: string, kind: "logo" | "icon" | "image", entity: string, query: string) {
  const script = resolve(process.env.MEDIA_USE_SKILL_DIR ?? "C:/Users/kaiha/.codex/skills/media-use", "scripts", "resolve.mjs");
  const projectDir = resolve(process.cwd(), "data", "projects", projectId);
  const args = [script, "--type", kind, "--intent", query, "--project", projectDir, "--json"];
  if (kind === "logo") args.splice(5, 0, "--entity", entity);
  return new Promise<z.infer<typeof resolverResultSchema>>((resolvePromise, reject) => {
    const ffmpeg = getLocalFfmpegPaths();
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(), windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, ...(ffmpeg ? { PATH: `${ffmpeg.binDir}${delimiter}${process.env.PATH ?? ""}` } : {}) },
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => { child.kill(); reject(new Error("ASSET_RESOLVE_TIMEOUT")); }, 45_000);
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", reject);
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`ASSET_RESOLVE_FAILED: ${stderr.slice(-500)}`));
      const line = stdout.trim().split(/\r?\n/).reverse().find((value) => value.trim().startsWith("{"));
      if (!line) return reject(new Error("ASSET_RESOLVE_RESULT_MISSING"));
      resolvePromise(resolverResultSchema.parse(JSON.parse(line)));
    });
  });
}

export async function resolveMotionAssets(projectId: string, plan: MotionPlan) {
  const moments = [] as MotionPlan["moments"];
  for (const moment of plan.moments) {
    if (!moment.asset || !["logo", "icon", "image"].includes(moment.asset.kind)) {
      moments.push(moment);
      continue;
    }
    try {
      const resolved = await resolveOne(projectId, moment.asset.kind as "logo" | "icon" | "image", moment.asset.entity, moment.asset.query);
      const projectDir = resolve(process.cwd(), "data", "projects", projectId);
      const normalizedPath = resolved.path.replace(/\\/g, "/");
      const resolvedPath = resolve(projectDir, normalizedPath);
      const relativePath = relative(projectDir, resolvedPath);
      if (relativePath.startsWith(`..${sep}`) || relativePath === ".." || relativePath.includes(`..${sep}`)) {
        throw new Error("ASSET_PATH_OUTSIDE_PROJECT");
      }
      const bytes = await readFile(resolvedPath);
      const manifestPath = resolve(projectDir, ".media", "manifest.jsonl");
      const manifestText = await readFile(manifestPath, "utf8").catch(() => "");
      const ledgerEntry = manifestText.split(/\r?\n/).filter(Boolean).map((line) => {
        try { return JSON.parse(line) as { path?: string; source?: string; provenance?: { provider?: string; route?: string } }; } catch { return null; }
      }).find((entry) => entry?.path?.replace(/\\/g, "/") === normalizedPath);
      const provider = ledgerEntry?.provenance?.provider ?? resolved.source ?? "media-use";
      const official = ledgerEntry?.source === "official" || /brandfetch|official/i.test(provider);
      const providerTerms = /brandfetch/i.test(provider);
      moments.push({
        ...moment,
        ...(!official && !providerTerms ? { warnings: [...(moment.warnings ?? []), { type: "LICENSE_BLOCKED" as const, message: "The retrieved asset has no verified usage terms and is preview-only until replaced or approved.", approvalRequired: true }] } : {}),
        asset: {
          ...moment.asset,
          localPath: normalizedPath,
          mimeType: mimeFor(resolved.path),
          source: resolved.source ?? "media-use",
          status: "resolved",
          usageStatus: official || providerTerms ? "approved" : "preview-only",
          provenance: {
            provider,
            ...(ledgerEntry?.provenance?.route?.startsWith("http") ? { canonicalSourceUrl: ledgerEntry.provenance.route } : {}),
            retrievedAt: new Date().toISOString(),
            licenseStatus: official ? "official-source" : providerTerms ? "provider-terms" : "unknown",
            attributionRequired: false,
            contentHash: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
          },
        },
        requiresAsset: false,
      });
    } catch {
      moments.push({ ...moment, asset: { ...moment.asset, status: "unavailable", usageStatus: "blocked" }, requiresAsset: false });
    }
  }
  return motionPlanSchema.parse({ ...plan, moments });
}

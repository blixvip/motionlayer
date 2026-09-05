import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { delimiter, join, resolve } from "node:path";
import { z } from "zod";

export const whisperModels = ["tiny.en", "base.en", "small.en", "medium.en", "large-v3"] as const;

const wordSchema = z.object({
  text: z.string(),
  start: z.number().min(0),
  end: z.number().positive(),
  confidence: z.number().min(0).max(1).optional(),
}).refine((word) => word.end >= word.start, "Word end must follow its start");

const cliSuccessSchema = z.object({
  ok: z.literal(true),
  engine: z.string(),
  model: z.string(),
  wordCount: z.number().int().min(0),
  durationSeconds: z.number().min(0),
  transcriptPath: z.string().min(1),
});

const cliSkippedSchema = z.object({
  ok: z.literal(false),
  skipped: z.literal(true),
  reason: z.string().min(1),
});

export type TranscriptWord = z.infer<typeof wordSchema>;

type Environment = Readonly<Record<string, string | undefined>>;

export function getWhisperBinDir(env: Environment = process.env) {
  if (env.WHISPER_CPP_BIN_DIR) return resolve(env.WHISPER_CPP_BIN_DIR);
  const localAppData = env.LOCALAPPDATA;
  if (!localAppData) return undefined;
  return join(localAppData, "MotionLayer", "tools", "whisper.cpp", env.WHISPER_CPP_VERSION ?? "b4938");
}

export function getLocalFfmpegPaths(env: Environment = process.env) {
  if (env.HYPERFRAMES_FFMPEG_PATH && env.HYPERFRAMES_FFPROBE_PATH) {
    return {
      ffmpeg: resolve(env.HYPERFRAMES_FFMPEG_PATH),
      ffprobe: resolve(env.HYPERFRAMES_FFPROBE_PATH),
      binDir: resolve(env.HYPERFRAMES_FFMPEG_PATH, ".."),
    };
  }
  if (!env.LOCALAPPDATA) return undefined;
  const packagesDir = join(env.LOCALAPPDATA, "Microsoft", "WinGet", "Packages");
  try {
    const packageDirName = readdirSync(packagesDir).find((name) => name.startsWith("Gyan.FFmpeg_"));
    if (!packageDirName) return undefined;
    const packageDir = join(packagesDir, packageDirName);
    const distributionDir = readdirSync(packageDir).find((name) => name.startsWith("ffmpeg-"));
    if (!distributionDir) return undefined;
    const binDir = join(packageDir, distributionDir, "bin");
    const ffmpeg = join(binDir, "ffmpeg.exe");
    const ffprobe = join(binDir, "ffprobe.exe");
    return existsSync(ffmpeg) && existsSync(ffprobe) ? { ffmpeg, ffprobe, binDir } : undefined;
  } catch {
    return undefined;
  }
}

export function groupTranscriptWords(words: TranscriptWord[], maxSegmentSeconds = 12) {
  const parsed = z.array(wordSchema).parse(words);
  const segments: Array<{
    id: string;
    startSeconds: number;
    endSeconds: number;
    text: string;
    confidence?: number;
  }> = [];
  let group: TranscriptWord[] = [];

  const flush = () => {
    if (!group.length) return;
    const text = group.map((word) => word.text).join(" ").replace(/\s+([,.;:!?])/g, "$1").trim();
    const confidences = group.flatMap((word) => word.confidence === undefined ? [] : [word.confidence]);
    segments.push({
      id: `t_${String(segments.length + 1).padStart(4, "0")}`,
      startSeconds: group[0].start,
      endSeconds: group[group.length - 1].end,
      text,
      ...(confidences.length ? { confidence: confidences.reduce((sum, value) => sum + value, 0) / confidences.length } : {}),
    });
    group = [];
  };

  for (const word of parsed) {
    const previous = group.at(-1);
    const gap = previous ? word.start - previous.end : 0;
    const duration = group.length ? word.end - group[0].start : 0;
    if (group.length && (gap > 0.8 || duration > maxSegmentSeconds)) flush();
    group.push(word);
    if (/[.!?]$/.test(word.text) && word.end - group[0].start >= 1.5) flush();
  }
  flush();
  return segments;
}

export function coalesceTranscriptSegmentsForCleanup(
  segments: ReturnType<typeof groupTranscriptWords>,
  maxChunkSeconds = 30,
) {
  const chunks: ReturnType<typeof groupTranscriptWords> = [];
  let group: typeof segments = [];

  const flush = () => {
    if (!group.length) return;
    const confidences = group.flatMap((segment) => segment.confidence === undefined ? [] : [segment.confidence]);
    chunks.push({
      id: `c_${String(chunks.length + 1).padStart(4, "0")}`,
      startSeconds: group[0].startSeconds,
      endSeconds: group[group.length - 1].endSeconds,
      text: group.map((segment) => segment.text).join(" ").trim(),
      ...(confidences.length ? { confidence: confidences.reduce((sum, value) => sum + value, 0) / confidences.length } : {}),
    });
    group = [];
  };

  for (const segment of segments) {
    const previous = group.at(-1);
    const gap = previous ? segment.startSeconds - previous.endSeconds : 0;
    const nextDuration = group.length ? segment.endSeconds - group[0].startSeconds : 0;
    if (group.length && (gap > 2 || nextDuration > maxChunkSeconds)) flush();
    group.push(segment);
  }
  flush();
  return chunks;
}

export async function transcribeMediaLocally(options: {
  inputPath: string;
  projectDir: string;
  model?: typeof whisperModels[number];
  language?: string;
  timeoutMs?: number;
}) {
  const cliPath = resolve(process.cwd(), "node_modules", "hyperframes", "bin", "hyperframes.mjs");
  const args = [
    cliPath,
    "transcribe",
    resolve(options.inputPath),
    "--engine", "whisper",
    "--model", options.model ?? "small.en",
    "--language", options.language ?? "en",
    "--dir", resolve(options.projectDir),
    "--json",
  ];

  const output = await new Promise<string>((resolvePromise, reject) => {
    const whisperBinDir = getWhisperBinDir();
    const ffmpeg = getLocalFfmpegPaths();
    const extraBinDirs = [whisperBinDir, ffmpeg?.binDir].filter((value): value is string => Boolean(value));
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        ...(extraBinDirs.length ? { PATH: `${extraBinDirs.join(delimiter)}${delimiter}${process.env.PATH ?? ""}` } : {}),
        ...(ffmpeg ? {
          HYPERFRAMES_FFMPEG_PATH: ffmpeg.ffmpeg,
          HYPERFRAMES_FFPROBE_PATH: ffmpeg.ffprobe,
        } : {}),
      },
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("LOCAL_TRANSCRIPTION_TIMEOUT"));
    }, options.timeoutMs ?? 15 * 60 * 1000);
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", reject);
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) resolvePromise(stdout);
      else reject(new Error(`LOCAL_TRANSCRIPTION_FAILED_${code}: ${stderr.slice(-800)}`));
    });
  });

  const jsonLine = output.trim().split(/\r?\n/).reverse().find((line) => line.trim().startsWith("{"));
  if (!jsonLine) throw new Error("LOCAL_TRANSCRIPTION_RESULT_MISSING");
  const rawResult = JSON.parse(jsonLine);
  const skipped = cliSkippedSchema.safeParse(rawResult);
  if (skipped.success) throw new Error(`LOCAL_TRANSCRIPTION_UNAVAILABLE: ${skipped.data.reason}`);
  const result = cliSuccessSchema.parse(rawResult);
  const words = z.array(wordSchema).parse(JSON.parse(await readFile(result.transcriptPath, "utf8")));

  return {
    engine: "whisper.cpp" as const,
    model: result.model,
    execution: "local" as const,
    durationSeconds: result.durationSeconds,
    words,
    segments: groupTranscriptWords(words),
  };
}

export async function probeMediaLocally(inputPath: string) {
  const ffmpeg = getLocalFfmpegPaths();
  if (!ffmpeg) return null;
  const output = await new Promise<string>((resolvePromise, reject) => {
    const child = spawn(ffmpeg.ffprobe, [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=width,height,r_frame_rate:format=duration",
      "-of", "json", resolve(inputPath),
    ], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolvePromise(stdout) : reject(new Error(`FFPROBE_FAILED: ${stderr.slice(-400)}`)));
  });
  const parsed = z.object({
    streams: z.array(z.object({ width: z.number().positive(), height: z.number().positive(), r_frame_rate: z.string() })).min(1),
    format: z.object({ duration: z.string() }),
  }).parse(JSON.parse(output));
  const [numerator, denominator = "1"] = parsed.streams[0].r_frame_rate.split("/");
  return {
    width: parsed.streams[0].width,
    height: parsed.streams[0].height,
    fps: Number(numerator) / Math.max(1, Number(denominator)),
    duration: Number(parsed.format.duration),
  };
}

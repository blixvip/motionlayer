import { mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { createRenderJob, executeRenderJob } from "@hyperframes/producer";

const projectDir = resolve(process.argv[2] ?? "fixtures/hyperframes/demo");
const output = resolve(process.argv[3] ?? "data/benchmarks/fixture.mp4");
const format = output.endsWith(".mov") ? "mov" : output.endsWith(".webm") ? "webm" : "mp4";
await mkdir(dirname(output), { recursive: true });
const startedAt = new Date().toISOString();
const started = performance.now();
const job = createRenderJob({ fps: { num: 30, den: 1 }, quality: "draft", format, workers: 1, strictness: "strict", entryFile: "index.html", hdrMode: format === "mp4" ? "auto" : "force-sdr" });
await executeRenderJob(job, projectDir, output);
const artifact = await stat(output);
const elapsedSeconds = (performance.now() - started) / 1_000;
console.log(JSON.stringify({ startedAt, projectDir, output, format, bytes: artifact.size, elapsedSeconds, peakRssBytes: process.resourceUsage().maxRSS * 1_024, producerPerformance: job.perfSummary, warnings: job.warnings }, null, 2));

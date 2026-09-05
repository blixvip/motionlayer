import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import type { MotionPlan } from "./motion-plan";
import type { TranscriptWord } from "./local-transcription";
import type { VisualKnowledgeGraph } from "./semantic-analysis";
import type { Storyboard } from "./visual-opportunity";

export type StoredTranscriptSegment = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  speaker?: string;
  text: string;
  rawText?: string;
  confidence?: number;
  normalized?: boolean;
};

export type StoredProject = {
  id: string;
  name: string;
  filename: string;
  assetKey: string;
  mime: string;
  bytes: number;
  createdAt: string;
  updatedAt: string;
  stage: "uploaded" | "transcribing" | "planning" | "ready" | "failed";
  progress: number;
  sourceLocked: true;
  duration: number;
  width: number;
  height: number;
  fps: number;
  transcript?: StoredTranscriptSegment[];
  words?: TranscriptWord[];
  motionPlan?: MotionPlan;
  semanticGraph?: VisualKnowledgeGraph;
  storyboard?: Storyboard;
  graphicsPlanId?: string;
  error?: string;
};

const projectsRoot = resolve(process.cwd(), "data", "projects");

function safeProjectId(id: string) {
  if (!/^[a-zA-Z0-9_-]{3,120}$/.test(id)) throw new Error("INVALID_PROJECT_ID");
  return id;
}

function projectPath(id: string) {
  const safe = safeProjectId(id);
  const target = resolve(projectsRoot, safe, "project.json");
  if (!target.startsWith(`${projectsRoot}${sep}`)) throw new Error("INVALID_PROJECT_PATH");
  return target;
}

export async function saveProject(project: StoredProject) {
  const target = projectPath(project.id);
  const dir = resolve(target, "..");
  await mkdir(dir, { recursive: true });
  const temporary = join(dir, `project-${crypto.randomUUID()}.tmp`);
  await writeFile(temporary, JSON.stringify(project, null, 2), "utf8");
  await rename(temporary, target);
  return project;
}

export async function createStoredProject(input: Pick<StoredProject, "id" | "name" | "filename" | "assetKey" | "mime" | "bytes">) {
  const now = new Date().toISOString();
  return saveProject({
    ...input,
    createdAt: now,
    updatedAt: now,
    stage: "uploaded",
    progress: 18,
    sourceLocked: true,
    duration: 0,
    width: 1920,
    height: 1080,
    fps: 30,
  });
}

export async function getStoredProject(id: string) {
  try {
    return JSON.parse(await readFile(projectPath(id), "utf8")) as StoredProject;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function updateStoredProject(id: string, patch: Partial<Omit<StoredProject, "id" | "createdAt">>) {
  const current = await getStoredProject(id);
  if (!current) throw new Error("PROJECT_NOT_FOUND");
  return saveProject({ ...current, ...patch, id: current.id, createdAt: current.createdAt, updatedAt: new Date().toISOString() });
}

export async function listStoredProjects() {
  try {
    const entries = await readdir(projectsRoot, { withFileTypes: true });
    const projects = await Promise.all(entries.filter((entry) => entry.isDirectory()).map((entry) => getStoredProject(entry.name)));
    return projects.filter((project): project is StoredProject => Boolean(project)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

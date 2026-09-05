import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { demoProject } from "@/lib/demo-data";
import { listStoredProjects } from "@/lib/project-store";

export async function GET() {
  await requireSession();
  const stored = await listStoredProjects();
  return NextResponse.json({ projects: [
    ...stored.map((project) => ({
      id: project.id,
      name: project.name,
      aspect: `${project.width}:${project.height}`,
      resolution: `${project.width} × ${project.height}`,
      fps: project.fps,
      duration: project.duration,
      updated: project.updatedAt,
      progress: project.progress,
      stage: project.stage,
      thumbnail: `/api/projects/${project.id}/source`,
    })),
    demoProject,
  ] });
}

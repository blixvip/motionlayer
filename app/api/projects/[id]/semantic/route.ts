import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { transcript as demoTranscript } from "@/lib/demo-data";
import { getStoredProject, updateStoredProject } from "@/lib/project-store";
import { analyzeSemanticTranscript } from "@/lib/semantic-analysis";
import { optimizeStoryboard } from "@/lib/visual-opportunity";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await context.params;
  if (id === "demo") {
    const segments = demoTranscript.map((segment) => ({ id: segment.id, startSeconds: segment.start, endSeconds: segment.end, speaker: segment.speaker, text: segment.text, confidence: .94 }));
    const semanticGraph = analyzeSemanticTranscript(segments, "final-video");
    const storyboard = optimizeStoryboard(semanticGraph, segments, 18, { density: "balanced" });
    return NextResponse.json({ semanticGraph, storyboard });
  }
  const project = await getStoredProject(id);
  if (!project?.transcript) return NextResponse.json({ error: "Transcript not found." }, { status: 404 });
  if (project.semanticGraph && project.storyboard) return NextResponse.json({ semanticGraph: project.semanticGraph, storyboard: project.storyboard, reused: true });
  const semanticGraph = analyzeSemanticTranscript(project.transcript, "final-video");
  const storyboard = optimizeStoryboard(semanticGraph, project.transcript, project.duration, { density: project.motionPlan?.density ?? "balanced" });
  await updateStoredProject(id, { semanticGraph, storyboard });
  return NextResponse.json({ semanticGraph, storyboard });
}

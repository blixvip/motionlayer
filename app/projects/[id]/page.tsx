import { EditorWorkspace } from "@/components/editor/EditorWorkspace";
import { notFound } from "next/navigation";
import { demoPlan, demoProject, transcript as demoTranscript } from "@/lib/demo-data";
import { getStoredProject } from "@/lib/project-store";
import { analyzeSemanticTranscript } from "@/lib/semantic-analysis";
import { optimizeStoryboard } from "@/lib/visual-opportunity";

function aspectLabel(width: number, height: number) {
  let a = Math.round(width);
  let b = Math.round(height);
  while (b) [a, b] = [b, a % b];
  return `${Math.round(width) / a}:${Math.round(height) / a}`;
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === "demo") {
    const segments = demoTranscript.map((segment) => ({ id: segment.id, startSeconds: segment.start, endSeconds: segment.end, speaker: segment.speaker, text: segment.text, confidence: .94 }));
    const semanticGraph = analyzeSemanticTranscript(segments, "final-video");
    const storyboard = optimizeStoryboard(semanticGraph, segments, demoProject.duration, { density: demoPlan.density });
    return <EditorWorkspace project={demoProject} plan={demoPlan} transcript={demoTranscript} semanticGraph={semanticGraph} storyboard={storyboard} sourceUrl="/demo/master.mp4" posterUrl="/demo/poster.jpg" />;
  }
  const stored = await getStoredProject(id);
  if (!stored?.motionPlan || !stored.transcript || stored.stage !== "ready") notFound();
  const project = {
    id: stored.id,
    name: stored.name,
    aspect: aspectLabel(stored.width, stored.height),
    resolution: `${stored.width} × ${stored.height}`,
    fps: stored.fps,
    duration: stored.duration,
    platform: "Source",
    updated: "Just now",
    progress: stored.progress,
    stage: "Plan review",
    thumbnail: `/api/projects/${stored.id}/source`,
    filename: stored.filename,
    graphicsPlanId: stored.graphicsPlanId,
  };
  const transcript = stored.transcript.map((segment) => ({ id: segment.id, start: segment.startSeconds, end: segment.endSeconds, speaker: segment.speaker ?? "VOICE", text: segment.text }));
  const semanticGraph = stored.semanticGraph ?? analyzeSemanticTranscript(stored.transcript, "final-video");
  const storyboard = stored.storyboard ?? optimizeStoryboard(semanticGraph, stored.transcript, stored.duration, { density: stored.motionPlan.density });
  return <EditorWorkspace project={project} plan={stored.motionPlan} transcript={transcript} semanticGraph={semanticGraph} storyboard={storyboard} sourceUrl={`/api/projects/${stored.id}/source`} />;
}

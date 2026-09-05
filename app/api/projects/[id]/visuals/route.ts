import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { demoPlan, transcript as demoTranscript } from "@/lib/demo-data";
import { motionPlanSchema } from "@/lib/motion-plan";
import { getStoredProject, updateStoredProject } from "@/lib/project-store";
import { analyzeSemanticTranscript } from "@/lib/semantic-analysis";
import { buildVisualOpportunities, motionMomentFromOpportunity } from "@/lib/visual-opportunity";

const inputSchema = z.object({ segmentId: z.string().min(1), semanticSpanId: z.string().optional() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await context.params;
  const input = inputSchema.parse(await request.json());
  const project = id === "demo" ? null : await getStoredProject(id);
  const transcript = id === "demo"
    ? demoTranscript.map((segment) => ({ id: segment.id, startSeconds: segment.start, endSeconds: segment.end, speaker: segment.speaker, text: segment.text, confidence: .94 }))
    : project?.transcript;
  const currentPlan = id === "demo" ? demoPlan : project?.motionPlan;
  if (!transcript || !currentPlan) return NextResponse.json({ error: "Project transcript or motion plan not found." }, { status: 404 });
  const graph = project?.semanticGraph ?? analyzeSemanticTranscript(transcript, "final-video");
  const candidates = buildVisualOpportunities(graph, transcript).filter((opportunity) => opportunity.segmentId === input.segmentId);
  const semanticSpanId = input.semanticSpanId;
  const opportunity = semanticSpanId ? candidates.find((candidate) => candidate.semanticSpanIds.includes(semanticSpanId)) : candidates[0];
  if (!opportunity) return NextResponse.json({ error: "No semantic span was found for that selection." }, { status: 404 });
  const moment = motionMomentFromOpportunity(opportunity, graph, currentPlan.moments.length, true);
  const plan = motionPlanSchema.parse({ ...currentPlan, semanticGraphId: graph.id, moments: [...currentPlan.moments, moment] });
  if (id !== "demo") await updateStoredProject(id, { semanticGraph: graph, motionPlan: plan });
  return NextResponse.json({ moment, plan, interpretation: graph.spans.find((span) => opportunity.semanticSpanIds.includes(span.id)), warnings: moment.warnings ?? [] });
}

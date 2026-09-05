import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { demoPlan } from "@/lib/demo-data";
import { motionPlanSchema } from "@/lib/motion-plan";
import { getStoredProject, updateStoredProject } from "@/lib/project-store";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await context.params;
  if (id === "demo") return NextResponse.json(motionPlanSchema.parse(demoPlan));
  const project = await getStoredProject(id);
  if (!project?.motionPlan) return NextResponse.json({ error: "Motion plan not found." }, { status: 404 });
  return NextResponse.json(motionPlanSchema.parse(project.motionPlan));
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await context.params;
  const plan = motionPlanSchema.parse(await request.json());
  if (id !== "demo") await updateStoredProject(id, { motionPlan: plan });
  return NextResponse.json({ plan, version: `plan_${crypto.randomUUID()}`, saved: true });
}

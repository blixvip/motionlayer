import { ScriptStudio } from "@/components/script/ScriptStudio";
import { loadPlan } from '@/lib/graphics/store';
import {resolvePlanEntities} from '@/lib/graphics/entity-assets';

export default async function HomePage({searchParams}:{searchParams:Promise<{plan?:string}>}) {
  const {plan:id}=await searchParams;
  const plan=id && /^gp_[a-zA-Z0-9_-]+$/.test(id) ? await loadPlan(id).catch(()=>null) : null;
  // Finishing projects retain their authenticated project route.
  const initialPlan=plan && !plan.projectId ? await resolvePlanEntities(plan,AbortSignal.timeout(5000),{cachedOnly:true}) : undefined;
  return <ScriptStudio initialScript={initialPlan?.sourceText} initialGraphicsPlan={initialPlan}/>;
}

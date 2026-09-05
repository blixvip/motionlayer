import { join, resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { createPlan,sourceContent } from "../packages/graphics/planner";
import { effects,families,type GraphicSpec } from "../packages/graphics/spec";
import { compileGraphics } from "../lib/graphics/compiler";

const root=resolve(process.env.MOTIONLAYER_GRAPHICS_FIXTURES || "data/graphics-verification");
const templateFamilies=families.filter(family=>family!=='explainer');
const copy={title:"Ideas become useful through action.",statistic:"Three tasks. One clear workflow.",comparison:"Manual handoff versus connected work",steps:"Choose a source then shape the story then render the result",quote:'“Make the idea clear.” — Demonstration copy',product:"Click Continue to advance the workflow"};
async function main(){
  await mkdir(root,{recursive:true});
  for(const format of ["landscape","short-form"]) {
    const plan=createPlan({id:`gp_demo_${format}`,script:Object.values(copy).join(" "),format});
    plan.width=format==="landscape" ? 960 : 540;plan.height=format==="landscape" ? 540 : 960;plan.fps=24;
    plan.scenes=templateFamilies.map((family,i):GraphicSpec=>({...plan.scenes[0],id:`gs_demo_${i}`,family,layout:i%3,start:i*3,duration:3,
      content:{...sourceContent(copy[family]),value:family==="statistic" ? "3" : "",items:family==="product" ? ["Continue"] : sourceContent(copy[family]).items},source:{text:copy[family],refs:["labelled-demonstration-copy"]},style:{...plan.scenes[0].style,material:effects[i+1],intensity:.45},motion:{entry:.6,exit:.4,energy:.6}}));
    plan.duration=18;
    await compileGraphics(plan,join(root,format));
  }
  for(const format of ["landscape","short-form"])for(const layout of [0,1,2]) {
    const plan=createPlan({id:`gp_matrix_${format}_${layout}`,script:"Layout verification.",format});
    plan.width=format==="landscape" ? 960 : 540;plan.height=format==="landscape" ? 540 : 960;plan.fps=24;
    plan.scenes=templateFamilies.map((family,i)=>({...plan.scenes[0],id:`gs_matrix_${i}`,family,layout,start:i*3,duration:3,content:{...sourceContent(copy[family]),value:family==="statistic" ? "3" : "",items:family==="product" ? ["Continue"] : sourceContent(copy[family]).items},style:{...plan.scenes[0].style,material:"none" as const}}));plan.duration=18;
    await compileGraphics(plan,join(root,`matrix-${format}-${layout}`));
  }
  console.log(root);
}
void main().catch(error=>{console.error(error);process.exitCode=1;});

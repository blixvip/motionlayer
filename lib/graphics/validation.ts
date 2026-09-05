import { spawn } from "node:child_process";
import { resolve,join } from "node:path";
import { writeFile } from "node:fs/promises";
import type { GraphicsPlan } from "../../packages/graphics/spec";

export async function validateComposition(plan:GraphicsPlan,directory:string,signal:AbortSignal) {
  const samples=plan.scenes.filter(s=>s.enabled).flatMap(s=>[s.start+s.motion.entry*.5,s.start+s.duration*.5,s.start+s.duration-s.motion.exit*.5]);
  const args=[resolve("node_modules/hyperframes/dist/cli.js"),"check",directory,"--at",samples.map(t=>t.toFixed(3)).join(","),"--json","--timeout","30000"];
  const output=await new Promise<{stdout:string;stderr:string;code:number|null}>((resolveResult,reject)=>{
    const child=spawn(process.execPath,args,{cwd:process.cwd(),windowsHide:true,shell:false,signal,stdio:["ignore","pipe","pipe"],env:process.env});
    let stdout="",stderr="";
    const timer=setTimeout(()=>{child.kill();reject(new Error("Graphics validation timed out. Check the renderer browser and retry."));},240000);
    child.stdout.on("data",chunk=>{stdout=(stdout+String(chunk)).slice(-3000000);});child.stderr.on("data",chunk=>{stderr=(stderr+String(chunk)).slice(-100000);});
    child.on("error",error=>{clearTimeout(timer);reject(error);});child.on("close",code=>{clearTimeout(timer);resolveResult({stdout,stderr,code});});
  });
  await writeFile(join(directory,"validation.json"),output.stdout);
  await writeFile(join(directory,"validation.log"),output.stderr);
  if(output.code!==0)throw new Error("Graphics validation failed. Inspect the saved validation report; revise overflowing text, contrast, or unavailable shaders before retrying.");
  const report=JSON.parse(output.stdout) as Record<string,{findings?:Array<{severity:string;message:string}>}>;
  const blocking=Object.values(report).flatMap(section=>section?.findings || []).filter(f=>["error","warning"].includes(f.severity) && !/GPU stall due to ReadPixels/.test(f.message));
  if(blocking.length)throw new Error(`Graphics quality check: ${blocking[0].message}`);
}

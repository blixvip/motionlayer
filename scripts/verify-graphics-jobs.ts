/** Opt-in integration verification. Creates only uniquely named fixture data. */
import { randomUUID,createHash } from "node:crypto";
import { readFile,stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createPlan } from "../packages/graphics/planner";
import { enqueue,cancelJob,ensureWorker } from "../lib/graphics/jobs";
import { loadJob,loadPlan,saveNewPlan,saveJob,atomicJson } from "../lib/graphics/store";
import { saveProject } from "../lib/project-store";
import { putLocalObject } from "../lib/storage";
import { demoPlan,transcript } from "../lib/demo-data";

const delay=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function wait(id:string){for(let i=0;i<180;i++){const job=await loadJob(id);if(job && ["complete","failed","cancelled"].includes(job.status))return job;await delay(2000);}throw new Error(`Job timed out: ${id}`);}
async function main(){
  const suffix=randomUUID();
  const plan=await saveNewPlan(createPlan({id:`gp_verify_${suffix}`,script:"A clear source makes a useful graphic."}));
  const planned=await wait((await enqueue(plan,{kind:"plan",provider:"preset"})).id);
  if(planned.status!=="complete")throw new Error(planned.error);
  const current=(await loadPlan(plan.id))!;
  const variants=await wait((await enqueue(current,{kind:"regenerate",provider:"preset",sceneId:current.scenes[0].id})).id);
  if(variants.alternatives?.length!==3)throw new Error("Missing alternatives");
  // Recovery and cancellation use unique records, leaving user jobs untouched.
  const cancelled={...planned,id:`gj_cancel_${suffix}`,status:"queued" as const};
  await saveJob(cancelled);await cancelJob(cancelled.id);await ensureWorker();
  if((await wait(cancelled.id)).status!=="cancelled")throw new Error("Cancel did not settle");
  const interrupted={...planned,id:`gj_interrupted_${suffix}`,status:"running" as const,workerPid:2147483647};
  await saveJob(interrupted);await ensureWorker();
  if((await wait(interrupted.id)).status!=="failed")throw new Error("Interrupted job was not recovered");
  const source=await readFile(resolve("public/demo/master.mp4"));
  const sourceHash=createHash("sha256").update(source).digest("hex");
  const projectId=`graphics_verify_${suffix}`;
  const object=await putLocalObject(projectId,"master.mp4",source);
  const now=new Date().toISOString();
  const project=await saveProject({id:projectId,name:"Graphics verification — synthetic source",filename:"master.mp4",assetKey:object.key,mime:"video/mp4",bytes:source.length,createdAt:now,updatedAt:now,stage:"ready",progress:100,sourceLocked:true,duration:18,width:1280,height:720,fps:30,motionPlan:demoPlan,transcript:transcript.map(t=>({id:t.id,startSeconds:t.start,endSeconds:t.end,text:t.text}))});
  const upload=await saveNewPlan(createPlan({id:`gp_source_${suffix}`,script:transcript.map(t=>t.text).join(" "),project}));
  const output=[];
  for(const format of ["mp4","mov"] as const){const job=await wait((await enqueue(upload,{kind:"render",format,quality:"draft"})).id);output.push({id:job.id,status:job.status,error:job.error});if(job.status!=="complete")throw new Error(`${format}: ${job.error}`);}
  if(createHash("sha256").update(await readFile(resolve("public/demo/master.mp4"))).digest("hex")!==sourceHash)throw new Error("Source changed");
  await atomicJson(resolve("data/graphics-verification/jobs-report.json"),{projectId,planId:upload.id,sourceHash,planned:planned.id,variants:variants.id,cancelled:cancelled.id,interrupted:interrupted.id,output,sourceBytes:(await stat(resolve("public/demo/master.mp4"))).size});
  console.log(JSON.stringify({projectId,output}));
}
void main().catch(error=>{console.error(error);process.exitCode=1;});

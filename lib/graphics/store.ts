import { mkdir, readFile, readdir, rename, writeFile, unlink, stat, open } from "node:fs/promises";
import { resolve, join } from "node:path";
import { randomUUID } from "node:crypto";
import { planSchema, type GraphicsPlan, enforceLocks, type GraphicSpec } from "../../packages/graphics/spec";

export const graphicsRoot = () => resolve(process.env.MOTIONLAYER_GRAPHICS_DATA || "data/graphics");
export function safeId(id:string) { if(!/^(gp|gj)_[a-zA-Z0-9_-]{3,120}$/.test(id)) throw new Error("INVALID_ID"); return id; }
export function planDirectory(id:string) { return join(graphicsRoot(),"plans",safeId(id)); }
export async function atomicJson(path:string,value:unknown) {
  await mkdir(resolve(path,".."),{recursive:true});const tmp=`${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(tmp,JSON.stringify(value,null,2));
    // Windows scanners/readers can briefly deny replacement. Keep the old
    // complete JSON visible and retry the atomic rename, never truncate it.
    for(let attempt=0;;attempt++)try{await rename(tmp,path);break;}catch(error){if(attempt>=9 || !["EPERM","EACCES","EBUSY"].includes((error as NodeJS.ErrnoException).code || ""))throw error;await new Promise(r=>setTimeout(r,Math.min(500,25*2**attempt)));}
  }finally{await unlink(tmp).catch(()=>{});}
}
export async function readJson<T>(path:string):Promise<T|null> { try{return JSON.parse(await readFile(path,"utf8"));}catch(error){if((error as NodeJS.ErrnoException).code==="ENOENT")return null;throw error;} }
export async function loadPlan(id:string) { const value=await readJson<GraphicsPlan>(join(planDirectory(id),"plan.json")); return value ? planSchema.parse(value) : null; }
export async function saveNewPlan(plan:GraphicsPlan) { const parsed=planSchema.parse(plan); await atomicJson(join(planDirectory(plan.id),"revisions",`${plan.revision}.json`),parsed); await atomicJson(join(planDirectory(plan.id),"plan.json"),parsed); return parsed; }
export async function withPlanLock<T>(id:string,fn:()=>Promise<T>) {
  const file=join(planDirectory(id),"edit.lock"); await mkdir(planDirectory(id),{recursive:true});
  let handle;
  try{handle=await open(file,"wx");}catch(error) {
    if((error as NodeJS.ErrnoException).code!=="EEXIST")throw error;
    const owner=await readJson<{pid:number}>(file).catch(()=>null);
    let live=false;if(owner?.pid)try{process.kill(owner.pid,0);live=true;}catch{/* Dead owner's edit can recover. */}
    const old=Date.now()-(await stat(file)).mtimeMs>60000;
    if(live || (!owner && !old))throw new Error("PLAN_BUSY");
    await unlink(file);try{handle=await open(file,"wx");}catch{throw new Error("PLAN_BUSY");}
  }
  try{await handle.writeFile(JSON.stringify({pid:process.pid}));return await fn();}finally{await handle.close();await unlink(file).catch(()=>{});}
}
export async function editScene(id:string,sceneId:string,revision:number,scene:GraphicSpec) { return withPlanLock(id,async()=>{
  const plan=await loadPlan(id); if(!plan)throw new Error("PLAN_NOT_FOUND");
  if(plan.revision!==revision)throw new Error("REVISION_CONFLICT");
  const previous=plan.scenes.find(s=>s.id===sceneId);if(!previous)throw new Error("SCENE_NOT_FOUND");
  const next=enforceLocks(previous,scene);
  if(plan.projectId) {next.start=previous.start;next.duration=previous.duration;}
  return saveNewPlan(planSchema.parse({...plan,revision:plan.revision+1,undoRevision:plan.revision,updatedAt:new Date().toISOString(),scenes:plan.scenes.map(s=>s.id===sceneId ? next : s)}));
}); }
export async function undoPlan(id:string,revision:number) { return withPlanLock(id,async()=>{
  const current=await loadPlan(id);if(!current)throw new Error("PLAN_NOT_FOUND");if(current.revision!==revision)throw new Error("REVISION_CONFLICT");
  if(!current.undoRevision)throw new Error("NO_HISTORY");
  const previous=await readJson<GraphicsPlan>(join(planDirectory(id),"revisions",`${current.undoRevision}.json`));if(!previous)throw new Error("NO_HISTORY");
  return saveNewPlan({...previous,revision:revision+1,updatedAt:new Date().toISOString()});
}); }
export type GraphicsJob = {id:string;planId:string;revision:number;kind:"plan"|"regenerate"|"render";status:"queued"|"running"|"complete"|"failed"|"cancelled";progress:number;stage:string;createdAt:string;updatedAt:string;error?:string;format?:"mp4"|"mov";quality?:"draft"|"standard"|"high";sceneId?:string;provider?:"auto"|"preset"|"codex"|"claude";cancelRequested?:boolean;output?:string;bundle?:string;alternatives?:GraphicSpec[];snapshot:GraphicsPlan;workerPid?:number;};
export const jobPath=(id:string)=>join(graphicsRoot(),"jobs",`${safeId(id)}.json`);
export const loadJob=(id:string)=>readJson<GraphicsJob>(jobPath(id));
export const saveJob=(job:GraphicsJob)=>atomicJson(jobPath(job.id),{...job,updatedAt:new Date().toISOString()});
export async function listJobs() { await mkdir(join(graphicsRoot(),"jobs"),{recursive:true}); const files=await readdir(join(graphicsRoot(),"jobs"));return (await Promise.all(files.filter(n=>/^gj_[\w-]+\.json$/.test(n)).map(n=>readJson<GraphicsJob>(join(graphicsRoot(),"jobs",n))))).filter((j):j is GraphicsJob=>!!j).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)); }

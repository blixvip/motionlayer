import { mkdir, open, readFile, unlink, readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { createRenderJob, executeRenderJob } from "@hyperframes/producer";
import { Zip, ZipPassThrough } from "fflate";
import { createReadStream, createWriteStream } from "node:fs";
import { once } from "node:events";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { graphicsRoot, listJobs, saveJob, loadJob, loadPlan, saveNewPlan, withPlanLock, readJson, type GraphicsJob } from "./store";
import { compileGraphics } from "./compiler";
import { directWithModel } from "./provider";
import { alternatives } from "../../packages/graphics/planner";
import { getStoredProject } from "../project-store";
import { resolveLocalObjectKey } from "../storage";
import { getLocalFfmpegPaths } from "../local-transcription";
import { validateComposition } from "./validation";
import { resolvePlanEntities } from './entity-assets';

const pause=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const alive=(pid:number)=>{try{process.kill(pid,0);return true;}catch{return false;}};
export function fpsRatio(fps:number){for(const n of [24000,30000,60000])if(Math.abs(fps-n/1001)<.01)return{num:n,den:1001};return{num:Math.round(fps*1000),den:1000};}
async function sourceZip(directory:string,output:string) {
  const destination=createWriteStream(output);let failure:Error|undefined;
  destination.on("error",error=>{failure=error;});
  const archive=new Zip((error,data,final)=>{if(error){failure=error;destination.destroy(error);return;}destination.write(data);if(final)destination.end();});
  async function visit(dir:string){for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.name.startsWith(".") || entry.name==="node_modules")continue;if(entry.isDirectory())await visit(path);else {
    const file=new ZipPassThrough(relative(directory,path).replace(/\\/g,"/"));archive.add(file);
    for await(const chunk of createReadStream(path)){if(failure)throw failure;file.push(new Uint8Array(chunk),false);if(destination.writableNeedDrain)await once(destination,"drain");}file.push(new Uint8Array(),true);
  }}}
  try{await visit(directory);const finished=once(destination,"finish");archive.end();await finished;if(failure)throw failure;}catch(error){archive.terminate();destination.destroy();throw error;}
}
async function execute(job:GraphicsJob,signal:AbortSignal) {
  const workspace=join(graphicsRoot(),"artifacts",job.id);await mkdir(workspace,{recursive:true});
  let progressWrites=Promise.resolve();
  const progress=(stage:string,value:number)=>{job.stage=stage;job.progress=value;progressWrites=progressWrites.then(()=>saveJob(job));return progressWrites;};
  if(job.kind!=="render") {
    await progress("Directing source-backed graphics",15);
    const selected=job.sceneId ? {...job.snapshot,scenes:job.snapshot.scenes.filter(s=>s.id===job.sceneId)} : job.snapshot;
    let directed;
    try {directed=await directWithModel(selected,job.provider || "auto",join(workspace,"model"),signal);}
    catch(error) {if(signal.aborted || job.provider && job.provider!=='auto')throw error;directed={...selected,generation:{mode:'preset' as const,provider:'MotionLayer semantic planner',note:'Local model unavailable. Contextual diagrams and sourced subjects are active.'}};}
    await progress('Finding portraits and brand marks',55);
    directed=await resolvePlanEntities(directed,signal);
    signal.throwIfAborted();
    if(job.kind==="regenerate") {job.alternatives=alternatives(directed.scenes[0]);await progress("Three editable alternatives ready",100);}
    else await withPlanLock(job.planId,async()=>{const current=await loadPlan(job.planId);if(!current || current.revision!==job.revision)throw new Error("Plan changed while directing. Regenerate the selected scene instead.");await saveNewPlan({...directed,revision:current.revision+1,undoRevision:current.revision,updatedAt:new Date().toISOString()});});
    return;
  }
  await progress("Compiling shared React graphics",5);
  await progress('Verifying portraits and brand marks',6);
  const plan=await resolvePlanEntities(job.snapshot,signal);
  const missing=plan.scenes.filter(scene=>scene.enabled).flatMap(scene=>(scene.visual?.entities||[]).filter(entity=>!entity.asset && ['person','brand'].includes(entity.kind)));
  if(missing.length)throw new Error(`Images need attention: ${[...new Set(missing.map(entity=>entity.name))].join(', ')}. Repair images or add a photo in the inspector before exporting.`);
  const project=plan.projectId ? await getStoredProject(plan.projectId) : null;
  if(plan.projectId && !project)throw new Error("Source project not found");
  if(project && (project.width!==plan.width || project.height!==plan.height || project.duration!==plan.duration || project.fps!==plan.fps))throw new Error("Source metadata changed. Rebuild the graphics plan.");
  const composition=join(workspace,"composition");
  const ffmpeg=getLocalFfmpegPaths();if(ffmpeg){process.env.HYPERFRAMES_FFMPEG_PATH=ffmpeg.ffmpeg;process.env.HYPERFRAMES_FFPROBE_PATH=ffmpeg.ffprobe;}
  const sourceFile=project && job.format!=="mov" ? resolveLocalObjectKey(project.assetKey) : undefined;
  let sourceHasAudio=false;
  if(sourceFile){if(!ffmpeg)throw new Error("FFmpeg and FFprobe are required for source-video export.");const probe=await promisify(execFile)(ffmpeg.ffprobe,["-v","error","-select_streams","a:0","-show_entries","stream=index","-of","csv=p=0",sourceFile],{signal,timeout:15000,windowsHide:true,maxBuffer:100000});sourceHasAudio=!!probe.stdout.trim();}
  await compileGraphics(plan,composition,{overlay:!!project || job.format==="mov",sourceFile,sourceHasAudio});
  signal.throwIfAborted();
  await progress("Checking layout, contrast, fonts, and shader runtime",8);
  await validateComposition(plan,composition,signal);
  signal.throwIfAborted();
  const render=createRenderJob({fps:fpsRatio(plan.fps),format:job.format || "mp4",quality:job.quality || "standard",workers:1,strictness:"strict",entryFile:"index.html",hdrMode:job.format==="mov" ? "force-sdr" : "auto"});
  const output=join(workspace,`motionlayer.${job.format || "mp4"}`);
  await executeRenderJob(render,composition,output,async (state,message)=>progress(message,Math.max(10,Math.min(95,state.progress))),signal);
  signal.throwIfAborted();
  await progress("Packaging editable source and provenance",97);
  await sourceZip(composition,join(workspace,"editable-source.zip"));
  job.output=`motionlayer.${job.format || "mp4"}`;job.bundle="editable-source.zip";
}
async function main() {
  await mkdir(graphicsRoot(),{recursive:true});
  const lock=join(graphicsRoot(),"worker.lock");
  const old=await readJson<{pid:number}>(lock).catch(()=>null);
  if(old && alive(old.pid))return;
  if(old)await unlink(lock).catch(()=>{});
  let handle;try{handle=await open(lock,"wx");await handle.writeFile(JSON.stringify({pid:process.pid}));}catch{return;}
  try {
    let idle=0;
    while(idle<30) {
      const jobs=await listJobs();
      for(const previous of jobs.filter(j=>j.status==="running" && (!j.workerPid || !alive(j.workerPid)))) {previous.status="failed";previous.error="Worker interrupted. Retry starts from the saved revision.";await saveJob(previous);}
      const job=jobs.find(j=>j.status==="queued");if(!job){idle++;await pause(1000);continue;}idle=0;
      if(await readJson(join(graphicsRoot(),"jobs",`${job.id}.cancel.json`))){job.status="cancelled";await saveJob(job);continue;}
      job.status="running";job.workerPid=process.pid;await saveJob(job);
      const controller=new AbortController();
      const monitor=setInterval(()=>{void readJson(join(graphicsRoot(),"jobs",`${job.id}.cancel.json`)).then(cancel=>{if(cancel)controller.abort();});},500);
      try{await execute(job,controller.signal);job.status="complete";job.progress=100;job.stage="Complete";}
      catch(error){job.status=controller.signal.aborted ? "cancelled" : "failed";job.error=controller.signal.aborted ? "Cancelled. The editable plan is unchanged." : error instanceof Error ? error.message : "Job failed";}
      finally{clearInterval(monitor);await saveJob(job);}
    }
  }finally{await handle.close();const current=await readJson<{pid:number}>(lock);if(current?.pid===process.pid)await unlink(lock).catch(()=>{});}
}
// Imported for unit tests without starting a worker.
if(process.argv[1]?.includes("worker-") && process.argv[1].endsWith(".mjs"))void main().catch(error=>{console.error(error);process.exitCode=1;});

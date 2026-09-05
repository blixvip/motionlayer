import { spawn } from "node:child_process";
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { openSync,closeSync } from "node:fs";
import { graphicsRoot, saveJob, type GraphicsJob, loadJob, atomicJson, readJson } from "./store";
import type { GraphicsPlan } from "../../packages/graphics/spec";

export async function ensureWorker() {
  const owner=await readJson<{pid:number}>(join(graphicsRoot(),"worker.lock")).catch(()=>null);
  if(owner?.pid)try{process.kill(owner.pid,0);return;}catch{/* Recover a stopped worker. */}
  const directory=join(graphicsRoot(),"worker");await mkdir(directory,{recursive:true});
  // A separate process owns the queue, so navigation and Next hot reload cannot kill a job.
  const result=await build({entryPoints:[resolve("lib/graphics/worker.ts")],bundle:true,packages:"external",platform:"node",format:"esm",target:"node22",write:false});
  const { createHash }=await import("node:crypto");const hash=createHash("sha256").update(result.outputFiles[0].contents).digest("hex").slice(0,16);
  const file=join(directory,`worker-${hash}.mjs`);
  await import("node:fs/promises").then(async fs=>{try{await fs.writeFile(file,result.outputFiles[0].contents,{flag:"wx"});}catch(e){if((e as NodeJS.ErrnoException).code!=="EEXIST")throw e;}});
  const log=openSync(join(directory,"worker.log"),"a");
  const child=spawn(process.execPath,["--preserve-symlinks","--preserve-symlinks-main",file],{cwd:process.cwd(),detached:true,windowsHide:true,stdio:["ignore",log,log],env:process.env});
  closeSync(log);
  await new Promise<void>((resolve,reject)=>{child.once("spawn",resolve);child.once("error",reject);});
  child.unref();
}
export async function enqueue(plan:GraphicsPlan,options:Pick<GraphicsJob,"kind"> & Partial<Pick<GraphicsJob,"format"|"quality"|"sceneId"|"provider">>) {
  const now=new Date().toISOString();
  const job:GraphicsJob={id:`gj_${randomUUID()}`,planId:plan.id,revision:plan.revision,status:"queued",progress:0,stage:"Queued",createdAt:now,updatedAt:now,snapshot:plan,...options};
  await saveJob(job);await ensureWorker();return job;
}
export async function cancelJob(id:string) {const job=await loadJob(id);if(!job)throw new Error("JOB_NOT_FOUND");await atomicJson(join(graphicsRoot(),"jobs",`${id}.cancel.json`),{cancel:true});return job;}

import { z } from "zod";
import { join, resolve } from "node:path";
import { stat, readFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import { createPlan } from "@/packages/graphics/planner";
import { graphicSchema, styleSchema } from "@/packages/graphics/spec";
import { referencePalette, footagePalette } from '@/lib/graphics/palette';
import { resolveLocalObjectKey } from '@/lib/storage';
import { provenance } from "@/packages/graphics/provenance";
import { getStoredProject, updateStoredProject } from "@/lib/project-store";
import { requireSession } from "@/lib/auth";
import { loadPlan, saveNewPlan, editScene, undoPlan, loadJob, graphicsRoot, planDirectory, withPlanLock, type GraphicsJob } from "@/lib/graphics/store";
import { enqueue, cancelJob, ensureWorker } from "@/lib/graphics/jobs";
import { compileGraphics, contentHash, graphicsBuildHash } from "@/lib/graphics/compiler";
import { resolveEntity, resolvePlanEntities, entityAssetPath, storeSubjectImage } from '@/lib/graphics/entity-assets';
import { entityId } from '@/packages/graphics/semantics';

export const runtime="nodejs";
export const dynamic="force-dynamic";
const createSchema=z.object({script:z.string().min(12).max(5000).optional(),projectId:z.string().regex(/^[\w-]{3,120}$/).optional(),format:z.enum(["landscape","short-form"]).default("landscape"),direction:z.string().max(300).default("Adaptive art direction"),provider:z.enum(["auto","preset","codex","claude"]).default("auto"),palette:styleSchema.shape.palette.optional(),paletteSource:z.string().max(120).optional()}).strict();
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"cache-control":"no-store"}});
function publicJob(job:GraphicsJob) {const {snapshot,workerPid,...rest}=job;void snapshot;void workerPid;return rest;}
async function ownedPlan(id:string) {const plan=await loadPlan(id);if(!plan)throw new Error("PLAN_NOT_FOUND");if(plan.projectId)await requireSession();return resolvePlanEntities(plan,AbortSignal.timeout(5000),{cachedOnly:true});}
async function body(request:Request) {const raw=await request.text();if(raw.length>150000)throw new Error("Request is too large");return JSON.parse(raw);}
async function fileResponse(request:Request,path:string,type:string,download?:string) {
  const metadata=await stat(path);const headers:Record<string,string>={"content-type":type,"accept-ranges":"bytes","cache-control":"private, no-store","x-content-type-options":"nosniff"};
  if(download)headers["content-disposition"]=`attachment; filename="${download}"`;
  const range=request.headers.get("range")?.match(/^bytes=(\d+)-(\d*)$/);
  const start=range ? Number(range[1]) : 0,end=range && range[2] ? Math.min(Number(range[2]),metadata.size-1) : metadata.size-1;
  if(start>end || start>=metadata.size)return new Response(null,{status:416,headers:{"content-range":`bytes */${metadata.size}`}});
  headers["content-length"]=String(end-start+1);if(range)headers["content-range"]=`bytes ${start}-${end}/${metadata.size}`;
  return new Response(Readable.toWeb(createReadStream(path,{start,end})) as ReadableStream,{status:range ? 206 : 200,headers});
}
async function handle(request:Request,context:{params:Promise<{path:string[]}>}) {
  const {path}=await context.params;const [resource,id,action,...rest]=path;
  if(request.method!=="GET") {const origin=request.headers.get("origin");if(origin && (new URL(origin).host!==(request.headers.get("host") || new URL(request.url).host) || new URL(origin).protocol!==new URL(request.url).protocol))return json({error:"Cross-origin writes are not allowed"},403);}
  if(resource==="provenance" && request.method==="GET")return json(provenance);
  if(resource==='subjects' && request.method==='POST') {
    if(id==='image') {const raw=await request.text();if(raw.length>8100000)throw new Error('Use an image under 6 MB.');const input=z.object({name:z.string().min(2).max(80),kind:z.enum(['person','brand']),image:z.string().max(8100000)}).strict().parse(JSON.parse(raw));return json(await storeSubjectImage({id:entityId(input.name),name:input.name,kind:input.kind,mention:input.name,role:''},input.image));}
    const input=z.object({name:z.string().trim().min(2).max(80),kind:z.enum(['person','brand'])}).strict().parse(await body(request));
    return json(await resolveEntity({...input,id:entityId(input.name),mention:input.name,role:''},AbortSignal.timeout(30000)));
  }
  if(resource==='reference' && request.method==='POST') {const raw=await request.text();if(raw.length>4300000)throw new Error('Reference must be under 3 MB.');const input=z.object({image:z.string().max(4200000)}).strict().parse(JSON.parse(raw));return json(await referencePalette(input.image));}
  if(resource==="plans" && !id && request.method==="POST") {
    const input=createSchema.parse(await body(request));
    if(input.projectId)await requireSession();
    const project=input.projectId ? await getStoredProject(input.projectId) : undefined;
    if(input.projectId && !project)throw new Error("PROJECT_NOT_FOUND");
    const script=project ? (project.transcript || []).map(s=>s.text).join(" ") : input.script;
    if(!script)throw new Error("Provide a script or transcribed project");
    const sampled=project ? await footagePalette(resolveLocalObjectKey(project.assetKey),project.duration) : undefined;
    const planned=createPlan({...input,...(sampled?{palette:sampled.palette,paletteSource:sampled.source}:{}),id:`gp_${randomUUID()}`,script,project:project || undefined});
    // Local portraits and marks belong in the very first preview, before model latency.
    const plan=await saveNewPlan(await resolvePlanEntities(planned,AbortSignal.timeout(5000),{cachedOnly:true}));
    if(project)await updateStoredProject(project.id,{graphicsPlanId:plan.id});
    const job=await enqueue(plan,{kind:"plan",provider:input.provider});
    return json({plan,job:publicJob(job)},202);
  }
  if(resource==="plans" && id) {
    const plan=await ownedPlan(id);
    if(request.method==='POST' && action==='assets') {const input=z.object({revision:z.number().int()}).strict().parse(await body(request));if(input.revision!==plan.revision)throw new Error('REVISION_CONFLICT');const repaired=await resolvePlanEntities(plan,AbortSignal.timeout(45000));return json(await withPlanLock(id,async()=>{const current=await loadPlan(id);if(current?.revision!==input.revision)throw new Error('REVISION_CONFLICT');return saveNewPlan({...repaired,revision:current.revision+1,undoRevision:current.revision,updatedAt:new Date().toISOString()});}));}
    if(request.method==="GET" && !action)return json(plan);
    if(request.method==="GET" && action==="implementation")return json({files:await Promise.all(["Graphic.tsx","Explainer.tsx","Material.tsx","runtime.tsx","graphics.css","explainer.css","as-generator/profile.tsx","as-generator/card.tsx","as-generator/alert.tsx","as-generator/bridge.ts","as-generator/foundation.css","as-generator/motion.css"].map(async name=>({name,code:await readFile(resolve("packages/graphics",name),"utf8")})))});
    if(request.method==="POST" && action==="undo")return json(await undoPlan(id,z.object({revision:z.number().int()}).parse(await body(request)).revision));
    if(request.method==="PATCH" && action==="scenes" && rest.length===1) {const input=z.object({revision:z.number().int(),scene:graphicSchema}).strict().parse(await body(request));return json(await editScene(id,rest[0],input.revision,input.scene));}
    if(request.method==="POST" && action==="regenerate") {const input=z.object({sceneId:z.string(),provider:z.enum(["auto","preset","codex","claude"]).default("auto")}).strict().parse(await body(request));if(!plan.scenes.some(s=>s.id===input.sceneId))throw new Error("SCENE_NOT_FOUND");return json(publicJob(await enqueue(plan,{kind:"regenerate",...input})),202);}
    if(request.method==="POST" && action==="render") {const input=z.object({revision:z.number().int(),format:z.enum(["mp4","mov"]).default("mp4"),quality:z.enum(["draft","standard","high"]).default("standard")}).strict().parse(await body(request));if(input.revision!==plan.revision)throw new Error("REVISION_CONFLICT");return json(publicJob(await enqueue(plan,{kind:"render",format:input.format,quality:input.quality})),202);}
    if(request.method==="GET" && action==="preview") {
      const sceneId=new URL(request.url).searchParams.get("scene");
      const scene=sceneId ? plan.scenes.find(s=>s.id===sceneId) : undefined;
      if(sceneId && !scene)throw new Error("SCENE_NOT_FOUND");
      const snapshot=scene ? {...plan,scenes:[{...scene,start:0}],duration:scene.duration} : plan;
      // Scene-level fingerprints keep unchanged previews reusable after unrelated edits.
      const fingerprint=contentHash({scenes:snapshot.scenes,width:plan.width,height:plan.height,projectId:plan.projectId,build:await graphicsBuildHash()});
      const directory=join(planDirectory(id),"previews",fingerprint);
      const name=rest.join("/") || "index.html";
      if(!/^(index\.html|graphics\.(js|css)|explainer\.css|as-generator\/(foundation|motion)\.css|fonts\/(display|body)\.woff2|fonts\/(display|accent)\.ttf|assets\/idea-flight\.png|assets\/entities\/[a-f0-9]{24}\.png|vendor\/gsap\.min\.js)$/.test(name))return json({error:"File not found"},404);
      if(/^assets\/entities\/[a-f0-9]{24}\.png$/.test(name))return fileResponse(request,await entityAssetPath(name.split('/').at(-1)!),'image/png');
      try{await stat(join(directory,"index.html"));}catch{await compileGraphics(snapshot,directory,{preview:true,overlay:!!plan.projectId});}
      if(name==="index.html") {
        const html=await readFile(join(directory,name),"utf8");
        const base=`/api/graphics/plans/${id}/preview/`;
        // Carry scene selection to every locally served asset.
        const suffix=sceneId ? `?scene=${encodeURIComponent(sceneId)}` : "";
        return new Response(html.replace(/(href|src)="([^"/][^"]*)"/g,(_,attr,url)=>`${attr}="${base}${url}${suffix}"`).replace('<head>',`<head><base href="${base}">`),{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","content-security-policy":"default-src 'none'; base-uri 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'none'; frame-ancestors 'self'"}});
      }
      return fileResponse(request,join(directory,name),name.endsWith('.png')?'image/png':name.endsWith('.ttf')?'font/ttf':name.endsWith(".js") ? "text/javascript" : name.endsWith(".css") ? "text/css" : "font/woff2");
    }
  }
  if(resource==="jobs" && id) {
    const job=await loadJob(id);if(!job)throw new Error("JOB_NOT_FOUND");await ownedPlan(job.planId);
    if(request.method==="GET" && !action){if(job.status==="queued" || job.status==="running")await ensureWorker();return json(publicJob(job));}
    if(request.method==="POST" && action==="cancel"){await cancelJob(id);return json({requested:true});}
    if(request.method==="POST" && action==="retry"){if(!["failed","cancelled"].includes(job.status))throw new Error("Only failed or cancelled jobs can retry");return json(publicJob(await enqueue(job.snapshot,{kind:job.kind,format:job.format,quality:job.quality,sceneId:job.sceneId,provider:job.provider})),202);}
    if(request.method==="GET" && action==="file") {if(job.status!=="complete" || !job.output)throw new Error("Export is not ready");const bundle=new URL(request.url).searchParams.get("bundle")==="1";const name=bundle ? "editable-source.zip" : job.output;return fileResponse(request,join(graphicsRoot(),"artifacts",job.id,name),bundle ? "application/zip" : job.format==="mov" ? "video/quicktime" : "video/mp4",new URL(request.url).searchParams.has("download") || bundle ? name : undefined);}
  }
  return json({error:"Not found"},404);
}
async function route(request:Request,context:{params:Promise<{path:string[]}>}) {try{return await handle(request,context);}catch(error){const message=error instanceof Error ? error.message : "Graphics operation failed";const status=message==="UNAUTHORIZED" ? 401 : /NOT_FOUND/.test(message) ? 404 : /CONFLICT|BUSY/.test(message) ? 409 : 400;return json({error:message},status);}}
export { route as GET, route as POST, route as PATCH };

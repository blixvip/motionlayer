import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const base=process.env.MOTIONLAYER_TEST_URL||'http://127.0.0.1:3011';
async function request(path,method='GET',body){const response=await fetch(`${base}/api/graphics/${path}`,{method,headers:{'content-type':'application/json',origin:base},body:body?JSON.stringify(body):undefined});const payload=await response.json();assert.ok(response.ok,JSON.stringify(payload));return payload;}
const started=Date.now();
const initial=await request('plans','POST',{script:'[00:00 - 00:05] Bernie Sanders tweeted on Twitter: pause AI development now.\n[00:05 - 00:10] Grok, Claude and ChatGPT are all going down.',format:'short-form',provider:'preset'});
const initialImages=initial.plan.scenes.flatMap(scene=>scene.visual?.entities||[]).filter(entity=>['person','brand'].includes(entity.kind));assert.equal(initialImages.length,5);assert.ok(initialImages.every(entity=>entity.asset));
const firstResponseMs=Date.now()-started;
let job=initial.job;
for(let attempt=0;attempt<60&&['queued','running'].includes(job.status);attempt++){await new Promise(resolve=>setTimeout(resolve,1000));job=await request(`jobs/${job.id}`);}
assert.equal(job.status,'complete',job.error);
const directed=await request(`plans/${initial.plan.id}`);
const repaired=await request(`plans/${directed.id}/assets`,'POST',{revision:directed.revision});assert.equal(repaired.revision,directed.revision+1);
const actor=repaired.scenes[0].visual.entities.find(entity=>entity.kind==='person');
const image=await readFile(`public/motion-assets/entities/${actor.asset.file}`);
const uploaded=await request('subjects/image','POST',{name:actor.name,kind:'person',image:`data:image/png;base64,${image.toString('base64')}`});assert.ok(uploaded.asset?.sourceUrl.startsWith('urn:motionlayer:user-image:'));
const scene={...repaired.scenes[0],visual:{...repaired.scenes[0].visual,entities:repaired.scenes[0].visual.entities.map(entity=>entity.id===actor.id?{...entity,asset:uploaded.asset}:entity)}};
const saved=await request(`plans/${repaired.id}/scenes/${scene.id}`,'PATCH',{revision:repaired.revision,scene});assert.equal(saved.scenes[0].visual.entities.find(entity=>entity.id===actor.id).asset.file,uploaded.asset.file);
const restored=await request(`plans/${saved.id}/undo`,'POST',{revision:saved.revision});assert.equal(restored.scenes[0].visual.entities.find(entity=>entity.id===actor.id).asset.file,actor.asset.file);
const files=[...new Set(restored.scenes.flatMap(scene=>scene.visual?.entities.flatMap(entity=>entity.asset?[entity.asset.file]:[])||[]))];
for(const file of files){const imageResponse=await fetch(`${base}/api/graphics/plans/${restored.id}/preview/assets/entities/${file}`);assert.equal(imageResponse.status,200);assert.equal(imageResponse.headers.get('content-type'),'image/png');assert.ok((await imageResponse.arrayBuffer()).byteLength>100);}
const report={url:`${base}/?plan=${restored.id}`,planId:restored.id,firstResponseMs,imagesInFirstResponse:initialImages.length,allImagesReadyBeforeDirection:true,repairPassed:true,uploadSaveUndoPassed:true,allImageRequestsPassed:true};
await writeFile('data/as-generator-verification/api-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));

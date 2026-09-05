import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createPlan,sourceContent} from '../packages/graphics/planner';
import {compileGraphics} from '../lib/graphics/compiler';
import {saveNewPlan} from '../lib/graphics/store';
import type {GraphicSpec} from '../packages/graphics/spec';
async function main(){
  const copy=['Every idea begins with possibility.','Shape the thought; refine the details; share your work.','Make something worth remembering.'];
  for(const format of ['landscape','short-form']){
    const plan=createPlan({id:`gp_studio_v2_${format}`,script:copy.join(' '),format,direction:'reference-led cinematic restrained'});
    const durations=[4.2,4.8,4];let cursor=0;
    plan.scenes=copy.map((text,i):GraphicSpec=>{const scene={...plan.scenes[0],id:`gs_studio_${i}`,family:(i===1?'steps':'title') as GraphicSpec['family'],layout:i===2?2:0,start:cursor,duration:durations[i],source:{text,refs:['original-motion-study']},content:sourceContent(text)};cursor+=durations[i];return scene;});
    plan.scenes[1].content.title='Shape the thought';plan.scenes[1].content.items=['Shape the thought','Refine the details','Share your work'];
    plan.duration=cursor;plan.width=format==='landscape'?1920:1080;plan.height=format==='landscape'?1080:1920;plan.fps=30;
    await saveNewPlan(plan);const dir=resolve('data/motion-design-v2',format);await compileGraphics(plan,dir);await mkdir(join(dir,'04-design'),{recursive:true});
    await writeFile(join(dir,'04-design','palette.json'),JSON.stringify(plan.scenes[0].style.palette,null,2));
    await writeFile(join(dir,'04-design','frames.json'),JSON.stringify(plan.scenes.map(s=>({id:s.id,archetype:s.family==='steps'?'full-frame-ui':'typographic',zOrder:['ground','cast-shadow','hero','display-copy','edge-depth','post'],source:s.source})),null,2));
    console.log(dir);
  }
}
void main().catch(e=>{console.error(e);process.exitCode=1;});

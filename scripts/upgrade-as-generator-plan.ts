import {join} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {loadPlan,saveNewPlan,withPlanLock} from '../lib/graphics/store';
import {resolvePlanEntities} from '../lib/graphics/entity-assets';
import {compileGraphics} from '../lib/graphics/compiler';
import {materialForVisual} from '../packages/graphics/as-generator/bridge';
import {entitiesIn} from '../packages/graphics/semantics';

const id=process.argv[2];if(!id)throw new Error('Pass the storyboard plan ID.');
const original=await loadPlan(id);if(!original)throw new Error('Plan not found');
const scenes=original.scenes.map(scene=>{
  let visual=scene.visual;
  if(visual?.kind==='statement'&&!scene.locks.content){
    const platform=entitiesIn(scene.source.text).find(entity=>entity.id==='twitter');
    if(platform&&!visual.entities.some(entity=>entity.id===platform.id)&&visual.entities.length<6)visual={...visual,entities:[...visual.entities,platform]};
  }
  return {...scene,visual,style:scene.locks.style||!visual?scene.style:{...scene.style,finish:'glass' as const,radius:24,material:materialForVisual(visual.kind),intensity:.45}};
});
const hydrated=await resolvePlanEntities({...original,scenes},AbortSignal.timeout(60000));
const upgraded=await withPlanLock(id,async()=>{
  const current=await loadPlan(id);if(current?.revision!==original.revision)throw new Error('Plan changed during upgrade');
  return saveNewPlan({...hydrated,revision:original.revision+1,undoRevision:original.revision,updatedAt:new Date().toISOString()});
});
const directory=join('data/as-generator-verification',id);await compileGraphics(upgraded,directory);
const subjects=[...new Map(upgraded.scenes.flatMap(scene=>scene.visual?.entities||[]).filter(entity=>['person','brand'].includes(entity.kind)).map(entity=>[entity.id,entity])).values()];
const report={id,revision:upgraded.revision,previousRevision:original.revision,sourceUnchanged:upgraded.sourceText===original.sourceText,timingUnchanged:upgraded.scenes.every((scene,i)=>scene.start===original.scenes[i].start&&scene.duration===original.scenes[i].duration),scenes:upgraded.scenes.length,subjects:subjects.map(entity=>({name:entity.name,file:entity.asset?.file||null})),midpoints:upgraded.scenes.filter(scene=>scene.enabled).map(scene=>+(scene.start+scene.duration*.6).toFixed(2)),directory};
await mkdir('data/as-generator-verification',{recursive:true});await writeFile('data/as-generator-verification/upgrade-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));

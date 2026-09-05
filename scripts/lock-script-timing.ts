import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {loadPlan,saveNewPlan,withPlanLock} from '../lib/graphics/store';
import {parseTimestampedScript} from '../lib/script-understanding';
import {sceneAt} from '../packages/graphics/spec';

const id=process.argv[2];if(!id)throw new Error('Pass the saved script plan ID.');
const original=await loadPlan(id);if(!original||original.projectId)throw new Error('A saved script storyboard is required.');
const cues=parseTimestampedScript(original.sourceText);assert.equal(cues.length,original.scenes.length,'Every scene must map to a supplied script interval');
const scenes=original.scenes.map(scene=>{
  const cue=cues.find(c=>scene.source.refs.includes(c.id)||scene.id===c.id);assert.ok(cue,'Scene has no source interval');
  assert.equal(scene.source.text,cue.originalText,'Source text changed');
  assert.equal(scene.start,cue.startSeconds,'Existing cue start differs from source');assert.equal(scene.start+scene.duration,cue.endSeconds,'Existing cue end differs from source');
  return {...scene,locks:{...scene.locks,timing:true}};
});
const plan=await withPlanLock(id,async()=>{
  const current=await loadPlan(id);assert.equal(current?.revision,original.revision,'The plan changed during verification');
  return saveNewPlan({...original,scenes,revision:original.revision+1,undoRevision:original.revision,updatedAt:new Date().toISOString()});
});
const intervals=cues.map(cue=>({id:cue.id,start:cue.startSeconds,end:cue.endSeconds,firstFrame:Math.ceil(cue.startSeconds*plan.fps),endFrameExclusive:Math.ceil(cue.endSeconds*plan.fps)}));
for(const cue of intervals){assert.equal(sceneAt(plan,cue.start+1/plan.fps)?.id,cue.id);assert.notEqual(sceneAt(plan,cue.end)?.id,cue.id);}
const report={planId:plan.id,revision:plan.revision,sourceUnchanged:plan.sourceText===original.sourceText,allCuesMatch:true,timingLocked:true,fps:plan.fps,duration:plan.duration,expectedFrames:Math.ceil(plan.duration*plan.fps),intervals};
await mkdir('data/script-timing-verification',{recursive:true});await writeFile('data/script-timing-verification/timing-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));

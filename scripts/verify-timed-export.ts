import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {join,resolve} from 'node:path';
import {unzipSync,strFromU8} from 'fflate';
import {loadJob,graphicsRoot} from '../lib/graphics/store';
import {parseTimestampedScript} from '../lib/script-understanding';
import {getLocalFfmpegPaths} from '../lib/local-transcription';

const job=await loadJob(process.argv[2]);assert.equal(job?.status,'complete',job?.error||'Export is not complete');assert.ok(job!.output&&job!.bundle);
const root=resolve('data/script-timing-verification'),artifact=join(graphicsRoot(),'artifacts',job!.id),video=join(artifact,job!.output!);
const tools=getLocalFfmpegPaths();assert.ok(tools,'FFmpeg is required for output verification');
const run=promisify(execFile);
const result=await run(tools.ffprobe,['-v','error','-show_entries','stream=codec_name,width,height,r_frame_rate,nb_frames','-show_entries','format=duration,size','-of','json',video],{windowsHide:true,timeout:30000});
const probe=JSON.parse(result.stdout),stream=probe.streams.find((s:{codec_name:string})=>s.codec_name==='h264');assert.ok(stream);
assert.ok(Math.abs(Number(probe.format.duration)-job!.snapshot.duration)<1/job!.snapshot.fps);
assert.equal(Number(stream.nb_frames),Math.ceil(job!.snapshot.duration*job!.snapshot.fps));
const bundle=unzipSync(await readFile(join(artifact,job!.bundle!)));
const exportedPlan=JSON.parse(strFromU8(bundle['plan.json'])),cues=parseTimestampedScript(exportedPlan.sourceText);
assert.equal(exportedPlan.sourceText,job!.snapshot.sourceText);assert.equal(cues.length,exportedPlan.scenes.length);
for(const cue of cues){const scene=exportedPlan.scenes.find((s:{id:string})=>s.id===cue.id);assert.ok(scene);assert.equal(scene.start,cue.startSeconds);assert.equal(scene.start+scene.duration,cue.endSeconds);assert.equal(scene.locks.timing,true);}
await mkdir(root,{recursive:true});
await copyFile(video,join(root,'full-script-150s.mp4'));
await copyFile(join(artifact,job!.bundle!),join(root,'full-script-editable-source.zip'));
for(const seconds of [34.5,149])await run(tools.ffmpeg,['-hide_banner','-loglevel','error','-ss',String(seconds),'-i',video,'-frames:v','1','-y',join(root,`export-at-${seconds}s.png`)],{windowsHide:true,timeout:30000});
const report={jobId:job!.id,planId:exportedPlan.id,revision:exportedPlan.revision,durationSeconds:Number(probe.format.duration),frames:Number(stream.nb_frames),width:stream.width,height:stream.height,frameRate:stream.r_frame_rate,cues:cues.length,allExportedIntervalsMatchScript:true,sourceTextUnchanged:true,timingLocked:true,video:'full-script-150s.mp4',source:'full-script-editable-source.zip'};
await writeFile(join(root,'export-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));

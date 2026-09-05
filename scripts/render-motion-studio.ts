import {readFile,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createRenderJob,executeRenderJob} from '@hyperframes/producer';
import {validateComposition} from '../lib/graphics/validation';
import {getLocalFfmpegPaths} from '../lib/local-transcription';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
async function main(){
  const ffmpeg=getLocalFfmpegPaths();if(!ffmpeg)throw new Error('FFmpeg missing');
  process.env.HYPERFRAMES_FFMPEG_PATH=ffmpeg.ffmpeg;process.env.HYPERFRAMES_FFPROBE_PATH=ffmpeg.ffprobe;
  for(const format of ['landscape','short-form']){
    const dir=resolve('data/motion-design-v2',format),plan=JSON.parse(await readFile(join(dir,'plan.json'),'utf8'));console.log('Checking',format);
    await validateComposition(plan,dir,new AbortController().signal);
    console.log('Rendering',format);const output=resolve('data/motion-design-v2',`${format}.mp4`);
    const job=createRenderJob({fps:{num:30,den:1},format:'mp4',quality:'high',workers:1,strictness:'strict',entryFile:'index.html',hdrMode:'force-sdr'});
    let last=-1;await executeRenderJob(job,dir,output,async p=>{const mark=Math.floor(p.progress/20);if(mark!==last){last=mark;console.log(format,p.progress);}},new AbortController().signal);
    if(format==='landscape'){await copyFile(output,resolve('public/motion-assets/studio-reel.mp4'));await promisify(execFile)(ffmpeg.ffmpeg,['-y','-ss','2','-i',output,'-frames:v','1','-q:v','2',resolve('public/motion-assets/studio-poster.jpg')],{windowsHide:true});}
    console.log('Saved',output);
  }
}
void main().catch(e=>{console.error(e);process.exitCode=1;});

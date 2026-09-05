import sharp from 'sharp';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { paletteFromAccent, REFERENCE_ACCENT } from '../../packages/graphics/design';
import { graphicsRoot } from './store';
import { getLocalFfmpegPaths } from '../local-transcription';

/** Weighted chroma histogram excludes neutral pixels and likely warm skin tones. */
export function samplePixels(data:Uint8Array) {
  const bins=new Map<number,{weight:number;r:number;g:number;b:number}>();let exposure=0,count=0;
  for(let i=0;i+2<data.length;i+=3){const [r,g,b]=[data[i],data[i+1],data[i+2]],max=Math.max(r,g,b),min=Math.min(r,g,b);exposure+=(r*.2126+g*.7152+b*.0722)/255;count++;
    if(max-min<28 || max<45 || min>225 || (r>g*1.13 && g>b*1.1 && r>90))continue;
    const id=(r>>5)*64+(g>>5)*8+(b>>5),weight=(max-min)/255;
    const bin=bins.get(id)||{weight:0,r:0,g:0,b:0};bin.weight+=weight;bin.r+=r*weight;bin.g+=g*weight;bin.b+=b*weight;bins.set(id,bin);
  }
  const best=[...bins.values()].sort((a,b)=>b.weight-a.weight)[0];
  const accent=best?'#'+[best.r,best.g,best.b].map(v=>Math.round(v/best.weight).toString(16).padStart(2,'0')).join(''):REFERENCE_ACCENT;
  return {palette:paletteFromAccent(accent,exposure/Math.max(1,count)>.57),accent,light:exposure/Math.max(1,count)>.57,fallback:!best};
}
async function pixels(buffer:Buffer){return sharp(buffer,{limitInputPixels:20000000}).rotate().resize(96,96,{fit:'cover'}).removeAlpha().raw().toBuffer();}
export async function referencePalette(image:string) {
  if(!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image))throw new Error('Choose a PNG, JPEG, or WebP reference image.');
  const buffer=Buffer.from(image.split(',')[1],'base64');if(buffer.length>3*1024*1024)throw new Error('Reference must be under 3 MB.');
  const normalized=await sharp(buffer,{limitInputPixels:20000000}).rotate().resize(1200,1200,{fit:'inside',withoutEnlargement:true}).png().toBuffer();
  const id=createHash('sha256').update(normalized).digest('hex').slice(0,24);const dir=join(graphicsRoot(),'references');await mkdir(dir,{recursive:true});await writeFile(join(dir,`${id}.png`),normalized);
  return {...samplePixels(await pixels(normalized)),source:`reference ${id}`,id};
}
export async function footagePalette(source:string,duration:number) {
  const ffmpeg=getLocalFfmpegPaths();if(!ffmpeg)throw new Error('FFmpeg is required to sample the footage palette.');
  const buffers:Buffer[]=[];
  for(const fraction of [.15,.5,.85]){const {stdout}=await promisify(execFile)(ffmpeg.ffmpeg,['-v','error','-ss',String(duration*fraction),'-i',source,'-frames:v','1','-vf','scale=96:96','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{encoding:'buffer',windowsHide:true,timeout:20000,maxBuffer:1000000});buffers.push(stdout);}
  return {...samplePixels(Buffer.concat(buffers)),source:'three sampled source-video frames'};
}

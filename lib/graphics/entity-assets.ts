import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { entityAssetSchema, type GraphicsPlan, type VisualEntity } from '../../packages/graphics/spec';
import { graphicsRoot } from './store';

type Asset = NonNullable<VisualEntity['asset']>;
const cache=()=>join(graphicsRoot(),'entity-cache');
const bundled=()=>resolve('public/motion-assets/entities');
const userAgent='MotionLayer/1.0 (local motion graphics; public entity image lookup)';
const plain=(text:string)=>text.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#\d+;/g,'').trim();
const normalize=(text:string)=>text.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const fileChecks=new Map<string,{mtime:number;size:number;valid:boolean}>();

export function reusableLicense(license:string) {
  return /^(?:public domain|cc0(?: 1\.0)?|cc[ -]by(?:[ -]sa)?(?:[ -]\d(?:\.\d)?)?)$/i.test(license.trim());
}
export async function entityAssetPath(file:string) {
  if(!/^[a-f0-9]{24}\.png$/.test(file))throw new Error('INVALID_ENTITY_ASSET');
  for(const root of [bundled(),cache()]) {
    const path=join(root,file),metadata=await stat(path).catch(()=>null);if(!metadata?.isFile() || !metadata.size)continue;
    const previous=fileChecks.get(path);let valid=previous?.mtime===metadata.mtimeMs&&previous.size===metadata.size?previous.valid:undefined;
    if(valid===undefined){valid=createHash('sha256').update(await readFile(path)).digest('hex').slice(0,24)===file.slice(0,24);fileChecks.set(path,{mtime:metadata.mtimeMs,size:metadata.size,valid});}
    if(valid)return path;
  }
  throw new Error('ENTITY_ASSET_NOT_FOUND');
}

export async function storeSubjectImage(entity:VisualEntity,dataUrl:string):Promise<VisualEntity> {
  const match=dataUrl.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);if(!match)throw new Error('Use a PNG, JPEG, or WebP image.');
  const bytes=Buffer.from(match[2],'base64');if(bytes.length>6000000)throw new Error('Use an image under 6 MB.');
  const png=await sharp(bytes,{limitInputPixels:40000000}).rotate().resize({width:1200,height:1500,fit:'inside',withoutEnlargement:true}).png().toBuffer();
  const file=`${createHash('sha256').update(png).digest('hex').slice(0,24)}.png`;await mkdir(cache(),{recursive:true});await writeFile(join(cache(),file),png);
  return {...entity,asset:{file,sourceUrl:`urn:motionlayer:user-image:${file}`,license:'User supplied',credit:'User supplied image'}};
}
async function json(url:URL,signal:AbortSignal) {
  const response=await fetch(url,{headers:{'User-Agent':userAgent},signal:AbortSignal.any([signal,AbortSignal.timeout(8000)])});
  if(!response.ok)throw new Error(`Image lookup returned ${response.status}`);
  return response.json();
}
async function wiki(host:string,params:Record<string,string>,signal:AbortSignal) {
  const url=new URL(`https://${host}/w/api.php`);url.search=new URLSearchParams({action:'query',format:'json',formatversion:'2',...params}).toString();return json(url,signal);
}

/** Resolve an exact public identity; never choose a fuzzy search hit or invent a face. */
async function wikimedia(entity:VisualEntity,signal:AbortSignal):Promise<Asset|undefined> {
  const data=await wiki('en.wikipedia.org',{prop:'pageimages|pageprops',titles:entity.name,redirects:'1',piprop:'name'},signal);
  const page=data.query?.pages?.[0];
  if(!page || page.missing || page.pageprops?.disambiguation!==undefined || !page.pageprops?.wikibase_item)return;
  const matching=[page.title,...(data.query?.redirects || []).map((r:{from:string})=>r.from)].some(title=>normalize(title)===normalize(entity.name));
  if(!matching)return;
  const itemId=page.pageprops.wikibase_item;
  if(!/^Q\d+$/.test(itemId))return;
  const item=await json(new URL(`https://www.wikidata.org/wiki/Special:EntityData/${itemId}.json`),signal);
  const claims=item.entities?.[itemId]?.claims;
  const human=claims?.P31?.some((v:{mainsnak?:{datavalue?:{value?:{id?:string}}}})=>v.mainsnak?.datavalue?.value?.id==='Q5');
  if(entity.kind==='person' && !human)return;
  // Brand identification uses an actual logo property, never a headquarters photo.
  const image=entity.kind==='brand' ? claims?.P154?.[0]?.mainsnak?.datavalue?.value : page.pageimage;
  if(typeof image!=='string')return;
  const media=await wiki('commons.wikimedia.org',{prop:'imageinfo',titles:`File:${image}`,iiprop:'url|extmetadata|mime',iiurlwidth:'900'},signal);
  const info=media.query?.pages?.[0]?.imageinfo?.[0];if(!info)return;
  const metadata=info.extmetadata || {};
  const license=plain(metadata.LicenseShortName?.value || '');
  if(!reusableLicense(license))return;
  const remote=new URL(info.thumburl || info.url);
  if(remote.protocol!=='https:' || !['upload.wikimedia.org','thumb.wikimedia.org'].includes(remote.hostname))return;
  const response=await fetch(remote,{headers:{'User-Agent':userAgent},redirect:'error',signal:AbortSignal.any([signal,AbortSignal.timeout(12000)])});
  if(!response.ok || Number(response.headers.get('content-length'))>12000000)return;
  // Read through a bounded stream so missing Content-Length cannot exhaust memory.
  const reader=response.body?.getReader();if(!reader)return;
  const chunks:Uint8Array[]=[];let size=0;
  for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>12000000){await reader.cancel();return;}chunks.push(part.value);}
  const png=await sharp(Buffer.concat(chunks),{limitInputPixels:40000000}).rotate().resize({width:900,height:1100,fit:'inside',withoutEnlargement:true}).png().toBuffer();
  const file=`${createHash('sha256').update(png).digest('hex').slice(0,24)}.png`;
  await mkdir(cache(),{recursive:true});await writeFile(join(cache(),file),png);
  return entityAssetSchema.parse({file,sourceUrl:info.descriptionurl,license,credit:`${plain(metadata.Artist?.value || 'Wikimedia Commons').slice(0,450)} · ${license} · resized for layout`});
}

export async function resolveEntity(entity:VisualEntity,signal:AbortSignal,options:{cachedOnly?:boolean}={}):Promise<VisualEntity> {
  if(!['person','brand'].includes(entity.kind))return entity;
  if(entity.asset && await entityAssetPath(entity.asset.file).then(()=>true).catch(()=>false))return entity;
  // A persisted receipt is not proof that its file still exists.
  const {asset:stale,...withoutAsset}=entity;void stale;entity=withoutAsset;
  const key=createHash('sha256').update(`${entity.kind}:${entity.name.toLowerCase()}`).digest('hex').slice(0,24);
  const catalog=await readFile(join(bundled(),'catalog.json'),'utf8').then(JSON.parse).catch(()=>({}));
  const seeded=catalog[entity.id] || (entity.id==='chatgpt' ? catalog.openai : undefined);
  const stored=seeded || await readFile(join(cache(),`${key}.json`),'utf8').then(JSON.parse).catch(()=>null);
  const parsed=entityAssetSchema.safeParse(stored);
  if(parsed.success && await entityAssetPath(parsed.data.file).then(()=>true).catch(()=>false))return {...entity,asset:parsed.data};
  if(options.cachedOnly)return entity;
  try {
    const asset=await wikimedia(entity,signal);if(!asset)return entity;
    await writeFile(join(cache(),`${key}.json`),JSON.stringify(asset,null,2));return {...entity,asset};
  } catch(error) {if(signal.aborted)throw error;return entity;}
}

export async function resolvePlanEntities(plan:GraphicsPlan,signal:AbortSignal,options:{cachedOnly?:boolean}={}):Promise<GraphicsPlan> {
  // A selected photo belongs to its scene. Repeated mentions may deliberately
  // use different crops or uploads; deduplicate lookup work without replacing them.
  const key=(entity:VisualEntity)=>`${entity.kind}:${entity.id}:${entity.asset?.file||''}`;
  const entities=[...new Map(plan.scenes.flatMap(s=>s.visual?.entities || []).filter(e=>['person','brand'].includes(e.kind)).map(e=>[key(e),e])).values()];
  const resolved=new Map<string,VisualEntity>();
  let next=0;
  await Promise.all(Array.from({length:Math.min(3,entities.length)},async()=>{while(next<entities.length){const entity=entities[next++];resolved.set(key(entity),await resolveEntity(entity,signal,options));}}));
  return {...plan,scenes:plan.scenes.map(scene=>scene.visual?{...scene,visual:{...scene.visual,entities:scene.visual.entities.map(e=>{const result=resolved.get(key(e));if(!result)return e;const {asset,...content}=e;void asset;return {...content,...(result.asset?{asset:result.asset}:{})};})}}:scene)};
}

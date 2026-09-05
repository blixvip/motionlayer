import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {resolveEntity,entityAssetPath} from '../lib/graphics/entity-assets';

const directory=resolve('public/motion-assets/entities');
await mkdir(directory,{recursive:true});
const catalog:Record<string,unknown>=JSON.parse(await readFile(join(directory,'catalog.json'),'utf8').catch(()=>'{}'));
const records=(await readFile('.media/manifest.jsonl','utf8')).trim().split(/\r?\n/).map(line=>JSON.parse(line));
for(const name of ['openai','claude','grok','twitter','discord']) {
  const record=records.findLast(r=>r.entity===name);if(!record)continue;
  const png=await sharp(resolve(record.path),{density:240}).resize({width:900,height:700,fit:'inside'}).png().toBuffer();
  const file=`${createHash('sha256').update(png).digest('hex').slice(0,24)}.png`;
  await writeFile(join(directory,file),png);
  catalog[name]={file,sourceUrl:record.provenance.route || `https://github.com/simple-icons/simple-icons/blob/16.25.0/icons/${name}.svg`,license:'Brand mark · editorial identification',credit:`${record.description} · ${record.provenance.provider}; trademarks belong to their owners.`};
}
const bernie=await resolveEntity({id:'bernie-sanders',name:'Bernie Sanders',mention:'Bernie Sanders',kind:'person',role:'U.S. senator'},AbortSignal.timeout(45000));
if(!bernie.asset)throw new Error('Bernie Sanders portrait could not be verified.');
await copyFile(await entityAssetPath(bernie.asset.file),join(directory,bernie.asset.file));
catalog['bernie-sanders']=bernie.asset;
await writeFile(join(directory,'catalog.json'),JSON.stringify(catalog,null,2));
console.log(JSON.stringify(catalog,null,2));

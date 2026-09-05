import { build } from "esbuild";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { planSchema, type GraphicsPlan } from "../../packages/graphics/spec";
import { provenance } from "../../packages/graphics/provenance";
import { entityAssetPath } from './entity-assets';

export function contentHash(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0,24); }
export async function graphicsBuildHash() { return contentHash(await Promise.all(["Graphic.tsx","Explainer.tsx","Material.tsx","runtime.tsx","spec.ts","design.ts","graphics.css","explainer.css","as-generator/engine.ts","as-generator/bridge.ts","as-generator/profile.tsx","as-generator/card.tsx","as-generator/alert.tsx","as-generator/badge.tsx","as-generator/foundation.css","as-generator/motion.css"].map(file=>readFile(resolve("packages/graphics",file),"utf8")))); }
const json = (value:unknown) => JSON.stringify(value).replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");
async function exportLock(dependencies:Record<string,string>) {
  type Entry={dependencies?:Record<string,string>;optionalDependencies?:Record<string,string>;peerDependencies?:Record<string,string>;dev?:boolean;devOptional?:boolean;link?:boolean;[key:string]:unknown};
  const lock=JSON.parse(await readFile(resolve("package-lock.json"),"utf8")) as {packages:Record<string,Entry>};
  const packages:Record<string,Entry>={"":{name:"motionlayer-editable-graphics",dependencies}};
  const find=(from:string,name:string)=>{let parent=from;for(;;){const path=`${parent ? `${parent}/` : ""}node_modules/${name}`;if(lock.packages[path] && !lock.packages[path].link)return path;if(!parent)return null;const i=parent.lastIndexOf("/node_modules/");parent=i<0 ? "" : parent.slice(0,i);}};
  const queue=Object.keys(dependencies).map(name=>find("",name)).filter((p):p is string=>!!p);
  while(queue.length){const path=queue.shift()!;if(packages[path])continue;const entry={...lock.packages[path]};delete entry.dev;delete entry.devOptional;packages[path]=entry;for(const name of Object.keys({...entry.dependencies,...entry.optionalDependencies,...entry.peerDependencies})){const child=find(path,name);if(child && !packages[child])queue.push(child);}}
  return {name:"motionlayer-editable-graphics",lockfileVersion:3,requires:true,packages};
}
export async function compileGraphics(planInput:GraphicsPlan, directory:string, options:{preview?:boolean;overlay?:boolean;sourceFile?:string;sourceHasAudio?:boolean}={}) {
  const plan=planSchema.parse(planInput);
  await Promise.all(["fonts","vendor","source","licenses","assets"].map(dir=>mkdir(join(directory,dir),{recursive:true})));
  const result=await build({ stdin:{contents:`import { mount } from './packages/graphics/runtime'; mount(${json(plan)},${json({preview:!!options.preview,overlay:!!options.overlay})}).catch(error=>{window.__graphics.error=error.message;console.error(error);});`,resolveDir:process.cwd(),loader:"tsx"},jsx:"automatic",bundle:true,write:false,format:"iife",platform:"browser",target:"es2022",minify:true,define:{"process.env.NODE_ENV":'"production"'},legalComments:"inline" });
  await writeFile(join(directory,"graphics.js"),result.outputFiles[0].contents);
  const css=await readFile(resolve("packages/graphics/graphics.css"),"utf8");
  await writeFile(join(directory,"graphics.css"),css);
  await cp(resolve('packages/graphics/explainer.css'),join(directory,'explainer.css'));
  await cp(resolve('packages/graphics/as-generator'),join(directory,'as-generator'),{recursive:true});
  await cp(resolve('packages/graphics/as-generator'),join(directory,'source/as-generator'),{recursive:true});
  const entities=plan.scenes.flatMap(scene=>scene.visual?.entities || []).filter(entity=>entity.asset);
  await mkdir(join(directory,'assets/entities'),{recursive:true});
  await Promise.all([...new Map(entities.map(entity=>[entity.asset!.file,entity.asset!])).values()].map(async asset=>cp(await entityAssetPath(asset.file),join(directory,'assets/entities',asset.file))));
  await writeFile(join(directory,'assets/entities/credits.json'),JSON.stringify(entities.map(({name,asset})=>({name,...asset})),null,2));
  const files = [
    ['public/motion-assets/display.ttf','fonts/display.ttf'],['public/motion-assets/accent.ttf','fonts/accent.ttf'],['public/motion-assets/idea-flight.png','assets/idea-flight.png'],
    ['03-assets/brand/Barlow-OFL.txt','licenses/Barlow-OFL.txt'],['03-assets/brand/InstrumentSerif-OFL.txt','licenses/InstrumentSerif-OFL.txt'],['03-assets/NOTES.md','assets/NOTES.md'],
    ["node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2","fonts/display.woff2"],
    ["node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2","fonts/body.woff2"],
    ["fixtures/hyperframes/demo/vendor/gsap.min.js","vendor/gsap.min.js"],
    ["node_modules/@paper-design/shaders/LICENSE","licenses/Paper-LICENSE"], ["node_modules/@paper-design/shaders/NOTICE","licenses/Paper-NOTICE"],
    ["node_modules/react/LICENSE","licenses/React-LICENSE"], ["node_modules/lucide-react/LICENSE","licenses/Lucide-LICENSE"], ["node_modules/react-dom/LICENSE","licenses/ReactDOM-LICENSE"],
    ["node_modules/@fontsource-variable/manrope/LICENSE","licenses/Manrope-LICENSE"], ["node_modules/@fontsource-variable/space-grotesk/LICENSE","licenses/SpaceGrotesk-LICENSE"],
  ];
  await Promise.all(files.map(([src,dst])=>cp(resolve(src),join(directory,dst))));
  await Promise.all(["Graphic.tsx","Explainer.tsx","Material.tsx","runtime.tsx","spec.ts","design.ts","graphics.css","explainer.css","provenance.ts"].map(file=>cp(resolve("packages/graphics",file),join(directory,"source",file))));
  const source=options.sourceFile ? `<video id="locked-source-video" class="clip" ${options.sourceHasAudio===false ? "muted" : 'data-has-audio="true"'} data-start="0" data-duration="${plan.duration}" data-track-index="0" src="source-video${options.sourceFile.endsWith(".mov") ? ".mov" : ".mp4"}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain"></video>` : "";
  if(options.sourceFile) await cp(options.sourceFile,join(directory,`source-video${options.sourceFile.endsWith(".mov") ? ".mov" : ".mp4"}`));
  const html=`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="graphics.css"><style>body{background:transparent}#stage{width:${plan.width}px;height:${plan.height}px}</style></head><body><div id="stage" data-composition-id="motionlayer-graphics" data-start="0" data-duration="${plan.duration}" data-width="${plan.width}" data-height="${plan.height}" data-fps="${plan.fps}">${source}<div id="graphics-root" class="clip" data-start="0" data-duration="${plan.duration}" data-track-index="1"></div></div><script src="vendor/gsap.min.js"></script><script>window.__timelines=window.__timelines||{};</script><script src="graphics.js"></script></body></html>`;
  await writeFile(join(directory,"index.html"),html);
  await writeFile(join(directory,"plan.json"),JSON.stringify(plan,null,2));
  await writeFile(join(directory,"provenance.json"),JSON.stringify(provenance,null,2));
  await writeFile(join(directory,"hyperframes.json"),JSON.stringify({$schema:"https://hyperframes.heygen.com/schema/hyperframes.json",paths:{blocks:"compositions",components:"source",assets:"fonts"}},null,2));
  // The exported edit/rebuild loop consumes the same TSX and same plan, not a second template.
  const deps:Record<string,string>={};
  for(const name of ["react","react-dom","zod","@paper-design/shaders","@paper-design/shaders-react","esbuild","hyperframes","lucide-react"]) deps[name]=JSON.parse(await readFile(resolve("node_modules",name,"package.json"),"utf8")).version;
  await writeFile(join(directory,"package.json"),JSON.stringify({name:"motionlayer-editable-graphics",private:true,type:"module",scripts:{build:"node rebuild.mjs",preview:"hyperframes preview .",render:"hyperframes render . --output output.mp4"},dependencies:deps},null,2));
  await writeFile(join(directory,"package-lock.json"),JSON.stringify(await exportLock(deps),null,2));
  await writeFile(join(directory,"rebuild.mjs"),`import {build} from 'esbuild';import {readFile,copyFile,cp} from 'node:fs/promises';const plan=JSON.parse(await readFile('plan.json','utf8'));await build({stdin:{contents:'import {mount} from "./source/runtime";mount('+JSON.stringify(plan)+',${JSON.stringify({overlay:!!options.overlay})});',resolveDir:process.cwd(),loader:'tsx'},jsx:'automatic',bundle:true,outfile:'graphics.js',format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});await copyFile('source/graphics.css','graphics.css');await copyFile('source/explainer.css','explainer.css');await cp('source/as-generator','as-generator',{recursive:true});`);
  await writeFile(join(directory,"README.md"),"# Editable MotionLayer graphics\n\nInstall with `npm install`, edit plan.json or source/Graphic.tsx, then `npm run build`. `npm run preview` and `npm run render` use the same component and fixed local assets. WebGL2 is required for shader exports. Fonts and Paper license/notice files are included. Product actions are timed illustrations. No credentials, remote resources, model-produced code, or asGenerator checkout are required. Source video is included only for a composited project export; never overwrite it.\n");
  return {directory,html,hash:contentHash(plan)};
}

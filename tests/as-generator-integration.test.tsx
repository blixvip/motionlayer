import {describe,it,expect,vi} from 'vitest';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import sharp from 'sharp';
import {renderToStaticMarkup} from 'react-dom/server';
import {createPlan} from '../packages/graphics/planner';
import {resolvePlanEntities,resolveEntity,storeSubjectImage,entityAssetPath} from '../lib/graphics/entity-assets';
import {AsProfile} from '../packages/graphics/as-generator/profile';
import {AsCard} from '../packages/graphics/as-generator/card';
import {AsAlert} from '../packages/graphics/as-generator/alert';
import {generatedSceneRecipe} from '../packages/graphics/as-generator/bridge';
import receipt from '../packages/graphics/as-generator/receipt.json';

describe('real asGenerator integration and image readiness',()=>{
  it('fills known portraits and logos before any model or network call',async()=>{
    const fetch=vi.spyOn(globalThis,'fetch').mockRejectedValue(new Error('offline'));
    try {
      const plan=createPlan({id:'gp_immediate_images',script:'Bernie Sanders tweeted about AI. Claude, Grok and ChatGPT are going down.'});
      const ready=await resolvePlanEntities(plan,AbortSignal.timeout(5000),{cachedOnly:true});
      const subjects=ready.scenes.flatMap(scene=>scene.visual?.entities||[]).filter(entity=>['person','brand'].includes(entity.kind));
      expect(subjects.length).toBeGreaterThanOrEqual(4);expect(subjects.every(entity=>entity.asset)).toBe(true);expect(fetch).not.toHaveBeenCalled();
    }finally{fetch.mockRestore();}
  });
  it('recovers a missing stored portrait from its verified local catalog',async()=>{
    const result=await resolveEntity({id:'bernie-sanders',name:'Bernie Sanders',mention:'Bernie Sanders',role:'U.S. senator',kind:'person',asset:{file:'000000000000000000000000.png',sourceUrl:'https://example.com/old',license:'CC BY-SA 4.0',credit:'Old unavailable file'}},AbortSignal.timeout(5000),{cachedOnly:true});
    expect(result.asset?.file).not.toBe('000000000000000000000000.png');expect(result.asset?.sourceUrl).toContain('commons.wikimedia.org');
  });
  it('does not let earlier concepts consume the image lookup budget',async()=>{
    const plan=createPlan({id:'gp_late_subject',script:'Bernie Sanders said pause AI development.'});
    const template=plan.scenes[0];
    plan.scenes=[...Array.from({length:7},(_,i)=>({...template,id:`concept_${i}`,visual:{...template.visual!,entities:Array.from({length:6},(_,j)=>({id:`concept-${i}-${j}`,name:`Concept ${i} ${j}`,kind:'concept' as const,mention:'AI',role:''}))}})),template];
    const ready=await resolvePlanEntities(plan,AbortSignal.timeout(5000),{cachedOnly:true});
    expect(ready.scenes.at(-1)?.visual?.entities.find(entity=>entity.name==='Bernie Sanders')?.asset).toBeDefined();
  });
  it('mounts the actual sourceBundle modules without demo identities or empty actions',()=>{
    const profile=renderToStaticMarkup(<AsProfile title="Bernie Sanders" media={<img src="portrait.png" alt="Bernie Sanders"/>}/>);
    expect(profile).toContain('data-as-generator-recipe="profile"');expect(profile).toContain('portrait.png');expect(profile).not.toContain('>MC<');expect(profile).not.toContain('<button');
    const card=renderToStaticMarkup(<AsCard title="Shared messages"><span>Message contents</span></AsCard>);
    expect(card).toContain('Message contents');expect(card).not.toContain('<button');
    expect(renderToStaticMarkup(<AsAlert title="Access restricted" icon={<span>Shield</span>}/>)).toContain('Shield');
    expect(receipt.sha256).toMatch(/^[a-f0-9]{64}$/);
  });
  it('routes the scene through the imported generator and preserves editable material tokens',()=>{
    const scene=createPlan({id:'gp_real_generator',script:'Bernie Sanders said pause AI development.'}).scenes[0];
    scene.style.radius=12;scene.style.finish='outline';const {recipe}=generatedSceneRecipe(scene);
    expect(recipe.kind).toBe('profile');expect(recipe.title).toBe(scene.content.title);expect(recipe.radius).toBe(12);expect(recipe.finish).toBe('outline');expect(recipe.colors[0]).toBe(scene.style.palette.accent);expect(recipe.shader).toBe('smoke');
  });
  it('rejects unsupported uploads before decoding or storing them',async()=>{
    await expect(storeSubjectImage({id:'person',name:'Person',mention:'Person',kind:'person',role:''},'data:text/html;base64,SGVsbG8=')).rejects.toThrow('PNG');
  });
  it('keeps a replacement photo on its own scene when the same person appears again',async()=>{
    const directory=await mkdtemp(join(tmpdir(),'motionlayer-image-test-'));vi.stubEnv('MOTIONLAYER_GRAPHICS_DATA',directory);
    try{
      const plan=await resolvePlanEntities(createPlan({id:'gp_chosen_photo',script:'Bernie Sanders said pause AI development.'}),AbortSignal.timeout(5000),{cachedOnly:true});
      const first=plan.scenes[0],person=first.visual!.entities.find(entity=>entity.kind==='person')!;
      const bytes=await sharp(await readFile(await entityAssetPath(person.asset!.file))).resize({width:600}).png().toBuffer();
      const uploaded=await storeSubjectImage(person,`data:image/png;base64,${bytes.toString('base64')}`);
      plan.scenes=[{...first,visual:{...first.visual!,entities:first.visual!.entities.map(entity=>entity.id===person.id?uploaded:entity)}},{...first,id:'second_mention'}];
      const resolved=await resolvePlanEntities(plan,AbortSignal.timeout(5000),{cachedOnly:true});
      expect(resolved.scenes[0].visual!.entities.find(entity=>entity.id===person.id)!.asset).toEqual(uploaded.asset);
      expect(resolved.scenes[1].visual!.entities.find(entity=>entity.id===person.id)!.asset).toEqual(person.asset);
      expect(uploaded.asset!.file).not.toBe(person.asset!.file);
    }finally{vi.unstubAllEnvs();await rm(directory,{recursive:true,force:true});}
  });
});

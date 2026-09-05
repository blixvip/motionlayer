import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createPlan} from '../packages/graphics/planner';
import {directWithModel} from '../lib/graphics/provider';
import {resolvePlanEntities} from '../lib/graphics/entity-assets';
import {compileGraphics} from '../lib/graphics/compiler';
import {saveNewPlan} from '../lib/graphics/store';

const root=resolve('data/semantic-story');
const script=await readFile(join(root,'original-script.txt'),'utf8');
const plan=createPlan({id:'gp_user_semantic_story_v3',script,format:'short-form',direction:'editorial-proof balanced expressive'});
const directed=await directWithModel(plan,'auto',join(root,'model-final'),AbortSignal.timeout(160000));
const ready=await resolvePlanEntities(directed,AbortSignal.timeout(60000));
await saveNewPlan(ready);
await compileGraphics(ready,join(root,'full-script'));
await writeFile(join(root,'full-script-result.json'),JSON.stringify({id:ready.id,generation:ready.generation,scenes:ready.scenes.length,explanations:ready.scenes.filter(s=>s.visual).length},null,2));
console.log(JSON.stringify({id:ready.id,generation:ready.generation,scenes:ready.scenes.length,explanations:ready.scenes.filter(s=>s.visual).length}));

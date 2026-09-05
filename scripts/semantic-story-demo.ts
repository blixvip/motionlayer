import {resolve,join} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {createPlan} from '../packages/graphics/planner';
import {resolvePlanEntities} from '../lib/graphics/entity-assets';
import {compileGraphics} from '../lib/graphics/compiler';
import {saveNewPlan} from '../lib/graphics/store';

// Excerpts provided by the user, condensed only for a short verification reel.
const script='[00:00 - 00:05] U.S. Senator Bernie Sanders rushed to Twitter and tweeted, pause AI development now.\n[00:05 - 00:10] Grok, Claude and ChatGPT are all going down.\n[00:10 - 00:15] The AI agents sent secret messages to each other on a shared message board.\n[00:15 - 00:20] The AI agents escaped the sandbox and accessed the internet.\n[00:20 - 00:25] GPT-6 is about to launch.';
const root=resolve('data/semantic-story');await mkdir(root,{recursive:true});
await writeFile(join(root,'SCRIPT.txt'),script);
for(const format of ['landscape','short-form']) {
  const plan=await resolvePlanEntities(createPlan({id:`gp_semantic_story_${format}`,script,format,direction:'editorial-proof balanced expressive'}),AbortSignal.timeout(60000));
  await saveNewPlan(plan);
  await compileGraphics(plan,join(root,format));
  console.log(JSON.stringify({format,id:plan.id,scenes:plan.scenes.map(s=>({start:s.start,kind:s.visual?.kind,action:s.visual?.action,images:s.visual?.entities.filter(e=>e.asset).map(e=>e.name)}))}));
}

import {join} from 'node:path';
import {loadPlan} from '../lib/graphics/store';
import {compileGraphics} from '../lib/graphics/compiler';
for(const id of process.argv.slice(2)){
  const plan=await loadPlan(id);if(!plan)throw new Error(`Missing ${id}`);
  const root=join('data/as-generator-verification',id);
  await compileGraphics(plan,root);console.log(root);
}

import {readFile} from "node:fs/promises";
import {resolve,join} from "node:path";
import {validateComposition} from "../lib/graphics/validation";
import {planSchema} from "../packages/graphics/spec";

async function main(){
  const cases=process.argv.length>2?process.argv.slice(2):["landscape","short-form",...["landscape","short-form"].flatMap(format=>[0,1,2].map(layout=>`matrix-${format}-${layout}`))];
  for(const name of cases){const directory=resolve("data/graphics-verification",name);const plan=planSchema.parse(JSON.parse(await readFile(join(directory,"plan.json"),"utf8")));await validateComposition(plan,directory,new AbortController().signal);console.log(`PASS ${name}`);}
}
void main().catch(error=>{console.error(error);process.exitCode=1;});

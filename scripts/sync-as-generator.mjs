import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

// User-owned source is imported once, then runs independently in MotionLayer.
const upstream=resolve(process.env.AS_GENERATOR_SOURCE || join(process.env.USERPROFILE,'as-generator'),'src/generator.ts');
const target=resolve('packages/graphics/as-generator');
await mkdir(target,{recursive:true});
const original=await readFile(upstream,'utf8');
await copyFile(upstream,join(target,'engine.ts'));
const engine=await import(pathToFileURL(upstream).href);
const receipt={upstream:'as-generator/src/generator.ts',sha256:createHash('sha256').update(original).digest('hex'),acquisition:'Vendored exact sourceBundle engine; exported modules adapted with media/material slots and seek-driven Paper rendering.',recipes:{},license:'User-owned local asGenerator source. Preserve upstream ownership.'};
for(const kind of ['profile','card','alert','badge']) {
  const spec={...engine.generateSpec(`A ${kind} component`,1),kind,shader:'plasma',label:'',secondaryLabel:'',title:'',description:'',eyebrow:'',speed:0,state:'default',colors:['#8f8fd6','#212159','#efeff3','#111122']};
  const bundle=engine.sourceBundle(spec);
  let code=bundle.files['GeneratedComponent.tsx'];
  code=code.replace(/import \{ NeuroNoise \} from '@paper-design\/shaders-react'\r?\n/,'').replace("import './generated-component.css'",'');
  code=code.replace('  label?: string','  material?: ReactNode\n  media?: ReactNode\n  children?: ReactNode\n  label?: string');
  code=code.replace("  className = '', style, disabled", "  material, media, children, className = '', style, disabled");
  code=code.replace(/  const shader = [\s\S]*?\n  return \(/,'  const shader = material\n  return (');
  code=code.replaceAll('>MC</div>','>{media}</div>');
  // The exported video component has no fake action when no action was supplied.
  code=code.replace(/(<button type="button"[^>]*onClick=\{onAction\}>[\s\S]*?<\/button>)/g,'{label && $1}');
  code=code.replace('<Bell size={19} />','{leadingIcon}');
  code=code.replace('className={["generated',`data-as-generator-recipe="${kind}" className={["generated`);
  code=code.replace('className="avatar" aria-hidden="true"','className="avatar"');
  code=code.replace('<p>{description}</p>','{description && <p>{description}</p>}{children}');
  code=code.replace(/GeneratedComponent/g,`As${kind[0].toUpperCase()+kind.slice(1)}`);
  await writeFile(join(target,`${kind}.tsx`),`// Generated from the user's asGenerator sourceBundle. See receipt.json.\n${code}`);
  if(kind==='card')await writeFile(join(target,'foundation.css'),bundle.files['generated-component.css']);
  receipt.recipes[kind]={...engine.componentSourceFor(spec),acquisition:'Actual local asGenerator sourceBundle output; catalog anatomy is reference, not an installed shadcn component.'};
}
await writeFile(join(target,'receipt.json'),JSON.stringify(receipt,null,2));
console.log('Imported asGenerator source factory and four real exported component modules.');

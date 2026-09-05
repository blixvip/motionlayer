import {describe,it,expect} from 'vitest';
import {createPlan} from '../packages/graphics/planner';
import {explainBeat,entitiesIn} from '../packages/graphics/semantics';
import {graphicSchema,enforceLocks} from '../packages/graphics/spec';
import {applyModelDesign,modelDesignJsonSchema} from '../lib/graphics/provider';
import {reusableLicense,entityAssetPath} from '../lib/graphics/entity-assets';
import {phase} from '../packages/graphics/Explainer';

describe('meaningful visual stories',()=>{
  it('identifies Bernie and carries the speaker into the next timed cue',()=>{
    const plan=createPlan({id:'gp_context_test',script:'[00:00 - 00:05] Senator Bernie Sanders tweeted, pause AI development now.\n[00:05 - 00:09] He says the companies should pause development.'});
    expect(plan.scenes.map(s=>s.visual?.kind)).toEqual(['statement','statement']);
    expect(plan.scenes[0].visual?.entities.find(e=>e.kind==='person')?.name).toBe('Bernie Sanders');
    expect(plan.scenes[1].visual?.entities.some(e=>e.name==='Bernie Sanders')).toBe(true);
    expect(plan.scenes.map(s=>[s.start,s.duration])).toEqual([[0,5],[5,4]]);
  });
  it('recognizes additional public names without a person-specific template',()=>{
    expect(entitiesIn('Senator Elizabeth Warren called for more AI oversight.').some(e=>e.name==='Elizabeth Warren'&&e.kind==='person')).toBe(true);
    expect(entitiesIn('Marie Curie said the experiment was important.').some(e=>e.name==='Marie Curie')).toBe(true);
    expect(explainBeat('Marie Curie said the experiment was important.')?.visual.steps[2].label).toBe('The idea');
  });
  it('illustrates different actions instead of using text-card layouts',()=>{
    expect(explainBeat('The AI agents sent secret messages to each other.')?.visual).toMatchObject({kind:'network',action:'exchange'});
    expect(explainBeat('The AI agents escaped the sandbox and accessed the internet.')?.visual).toMatchObject({kind:'boundary',action:'escape'});
    expect(explainBeat('Grok, Claude and ChatGPT are going down.')?.visual).toMatchObject({kind:'ecosystem',action:'decline'});
    expect(explainBeat('A neural model learns from examples.')?.visual).toMatchObject({kind:'flow',action:'learn'});
  });
  it('honors negation and keeps hypothetical diagrams labeled',()=>{
    expect(explainBeat('The AI agents did not escape the sandbox.')?.visual.action).toBe('restrict');
    expect(explainBeat('AI agents cannot send messages to each other.')?.visual.action).toBe('restrict');
    expect(explainBeat('What if AI agents escaped the sandbox?')?.visual.qualifier).toBe('Hypothetical');
  });
  it('does not interpret a model version as a measured statistic',()=>{
    const scene=createPlan({id:'gp_model_version',script:'GPT-6 is about to launch.'}).scenes[0];
    expect(scene.family).toBe('explainer');expect(scene.visual?.steps.some(s=>s.label==='GPT-6')).toBe(true);
  });
  it('does not turn a platform mention into an outage or an unnamed group into a public figure',()=>{
    const scene=createPlan({id:'gp_platform_context',script:'On Twitter, Grok, Claude and ChatGPT are going down.'}).scenes[0];
    expect(scene.visual?.entities.some(e=>e.name==='Twitter')).toBe(false);
    const plan=createPlan({id:'gp_generic_people',script:'Was it a group of heroic soldiers acting for the greater good?'});
    const result=applyModelDesign(plan,{scenes:[{id:plan.scenes[0].id,family:'explainer',layout:0,material:'none',visual:{kind:'flow',action:'compare',entities:[{name:'Hypothetical soldiers',kind:'person',mention:'a group of heroic soldiers'}],steps:[{label:'Could it be soldiers?',icon:'person',evidence:'Was it a group of heroic soldiers'}],reason:'A questioned comparison.'}}]},'test');
    expect(result.scenes[0].visual?.entities[0].kind).toBe('concept');
    expect(result.scenes[0].visual?.steps[0].label).toBe('Could it be soldiers?');
  });
  it('provides a strict model schema with every field required, including nullable visuals',()=>{
    const visit=(value:unknown)=>{if(!value || typeof value!=='object')return;const schema=value as Record<string,any>;if(schema.type==='object'){expect(schema.additionalProperties).toBe(false);expect(new Set(schema.required)).toEqual(new Set(Object.keys(schema.properties)));}Object.values(schema).forEach(visit);};
    visit(modelDesignJsonSchema);
  });
  it('rejects model-invented people, numbers and inverted restrictions',()=>{
    const plan=createPlan({id:'gp_grounded_test',script:'Bernie Sanders said AI agents did not escape the sandbox.'});
    const before=plan.scenes[0];
    const forged={scenes:[{id:before.id,family:'explainer',layout:0,material:'none',visual:{kind:'portrait',action:'identify',entities:[{name:'Donald Trump',kind:'person',mention:'Bernie Sanders'}],steps:[],reason:'unsupported identity'}}]};
    expect(applyModelDesign(plan,forged,'test').scenes[0].visual).toEqual(before.visual);
    const restricted=createPlan({id:'gp_negation_test',script:'AI agents did not escape the sandbox.'});
    forged.scenes[0]={...forged.scenes[0],id:restricted.scenes[0].id,visual:{kind:'boundary',action:'escape',entities:[],steps:[],reason:'inverted'}};
    expect(applyModelDesign(restricted,forged,'test').scenes[0].visual?.action).toBe('restrict');
  });
  it('locks the explanation with its source content and rejects unsafe asset paths',async()=>{
    const scene=createPlan({id:'gp_visual_locks',script:'AI agents share messages.'}).scenes[0];scene.locks.content=true;
    expect(enforceLocks(scene,{...scene,visual:undefined}).visual).toEqual(scene.visual);
    expect(graphicSchema.safeParse({...scene,visual:{...scene.visual,entities:[{id:'person',name:'Someone',kind:'person',mention:'Someone',role:'',asset:{file:'../../secrets.png',sourceUrl:'https://commons.wikimedia.org/',license:'Public domain',credit:''}}]}}).success).toBe(false);
    await expect(entityAssetPath('../secret.png')).rejects.toThrow();
    expect(reusableLicense('CC BY-SA 4.0')).toBe(true);expect(reusableLicense('Public domain')).toBe(true);expect(reusableLicense('Unknown')).toBe(false);expect(reusableLicense('CC BY-NC 4.0')).toBe(false);
  });
  it('keeps animation phases stable when sampled out of order',()=>{
    const first=phase(1.3,.4,1.5);phase(4,.4,1.5);phase(0,.4,1.5);expect(phase(1.3,.4,1.5)).toBe(first);expect(phase(0,.4,1.5)).toBe(0);expect(phase(5,.4,1.5)).toBe(1);
  });
});

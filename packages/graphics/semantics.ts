import type { SceneVisual, VisualEntity } from './spec';

type Known = {name:string;kind:VisualEntity['kind'];pattern:RegExp;role?:string};
const known:Known[] = [
  {name:'Bernie Sanders',kind:'person',pattern:/\bBernie\s+Sanders\b/i,role:'U.S. senator'},
  {name:'Sam Altman',kind:'person',pattern:/\bSam\s+Altman\b/i},
  {name:'Elon Musk',kind:'person',pattern:/\bElon\s+Musk\b/i},
  {name:'Jensen Huang',kind:'person',pattern:/\bJensen\s+Huang\b/i},
  {name:'Dario Amodei',kind:'person',pattern:/\bDario\s+Amodei\b/i},
  {name:'OpenAI',kind:'brand',pattern:/\bOpen\s?AI\b/i},
  {name:'ChatGPT',kind:'brand',pattern:/\bChat\s?GPT\b/i},
  {name:'Claude',kind:'brand',pattern:/\bClaude(?:\s+Code)?\b/i},
  {name:'Anthropic',kind:'brand',pattern:/\bAnthropic\b/i},
  {name:'Grok',kind:'brand',pattern:/\bGrok\b/i},
  {name:'NVIDIA',kind:'brand',pattern:/\bNVIDIA\b/i},
  {name:'Google',kind:'brand',pattern:/\bGoogle\b/i},
  {name:'Gemini',kind:'brand',pattern:/\bGemini\b/i},
  {name:'Microsoft',kind:'brand',pattern:/\bMicrosoft\b/i},
  {name:'Twitter',kind:'brand',pattern:/\bTwitter\b/i},
  {name:'Discord',kind:'brand',pattern:/\bDiscord\b/i},
  {name:'AI agents',kind:'concept',pattern:/\b(?:AI\s+agents?|artificial intelligence agents?)\b/i},
  {name:'Artificial intelligence',kind:'concept',pattern:/\b(?:AI|artificial intelligence)\b/i},
];
export const entityId=(name:string)=>name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100);
const stopNames=/^(?:At The|In This|At The Time|Who Do|Was It|He Says|They Should|Our Own|Goal Sacrifice|Join The|Oh My|No These|Read This|At Time|At Recording|U S|United States)$/i;

/** Literal mentions first; the model can extend this vocabulary with grounded names. */
export function entitiesIn(text:string):VisualEntity[] {
  const result:VisualEntity[]=[];
  for(const entry of known) {
    const match=text.match(entry.pattern);if(!match)continue;
    // A person called Claude is not automatically Anthropic's model.
    if(entry.name==='Claude' && !/\b(AI|Grok|ChatGPT|Anthropic|model|token|code)\b/i.test(text))continue;
    result.push({id:entityId(entry.name),name:entry.name,kind:entry.kind,mention:match[0],role:entry.role || ''});
  }
  for(const match of text.matchAll(/\b(?:Senator |President |CEO |Dr\. )?([A-Z][a-z]{2,}(?:[-'][A-Z]?[a-z]+)?\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)\b/g)) {
    const name=match[1];
    if(stopNames.test(name) || result.some(e=>e.name.includes(name)||name.includes(e.name)))continue;
    if(/\b(?:Senator|President|CEO|Dr\.)\s/.test(match[0]) || new RegExp(`${name}\\s+(?:said|says|announced|wrote|tweeted|warned|founded|explained|argued|spoke)\\b`,'i').test(text))result.push({id:entityId(name),name,kind:'person',mention:name,role:''});
  }
  for(const match of text.matchAll(/\b(?:GPT[- ]?\d+(?:\.\d+)?|Kimi\s*K?\d+|Llama\s*\d*)\b/gi))result.push({id:entityId(match[0]),name:match[0],kind:'concept',mention:match[0],role:'AI model'});
  return result.filter((e,i,a)=>a.findIndex(v=>v.id===e.id)===i).slice(0,6);
}

const node=(label:string,icon:SceneVisual['steps'][number]['icon'])=>({label,icon});
export type Meaning = {visual:SceneVisual;headline:string};

export function explainBeat(text:string, previous:VisualEntity[]=[]):Meaning|undefined {
  let entities=entitiesIn(text);
  const refersPerson=/\b(he|his|she|her|this tweet)\b/i.test(text);
  if(!entities.some(e=>e.kind==='person') && refersPerson) {
    const person=previous.find(e=>e.kind==='person');if(person)entities=[person,...entities].slice(0,6);
  }
  const ai=/\b(AI|artificial intelligence|GPT|neural|machine learning)\b/i.test(text) || (/\b(agents?|they|them|their|collective|sacrifice|utility|shared message board)\b/i.test(text)&&previous.some(e=>e.kind==='concept'&&/AI|intelligence/i.test(e.name)));
  if(ai && !entities.some(e=>e.kind==='concept'))entities.push({id:'ai-agents',name:/\bagents?\b/i.test(text)?'AI agents':'Artificial intelligence',kind:'concept',mention:text.match(/\b(?:AI|agents?|they|their|them|models?)\b/i)?.[0]||text.slice(0,60),role:''});
  entities=entities.slice(0,6);
  const person=entities.find(e=>e.kind==='person');
  const negated=/\b(?:not|never|no|cannot|can't|didn't|did not|couldn't|could not|wouldn't|would not|haven't|hasn't|without)\b.{0,28}\b(?:escape|access|connect|communicat|send|sent|talk|message|hack|pause|stop|obey|circumvent)/i.test(text);
  const hypothetical=/\b(?:what if|imagine|hypothetical|might|could|may)\b/i.test(text);
  const qualifier:SceneVisual['qualifier']=hypothetical?'Hypothetical':/\b(apparently|alleged|reportedly|apparently|claimed)\b/i.test(text)?'Claim in script':'Illustration';
  const make=(kind:SceneVisual['kind'],action:SceneVisual['action'],headline:string,steps:SceneVisual['steps'],why:string,q:SceneVisual['qualifier']=qualifier):Meaning=>({headline,visual:{kind,action,entities,steps,evidence:why,qualifier:q}});
  const mechanism=ai && /\b(sandbox|restrict|circumvent|escap|access the internet|disconnect the internet|hacking|hacked|secret messages|shared message board)\w*\b/i.test(text);
  if(person && !mechanism && /\b(tweet|tweeted|post|said|says|warn|pause|announc|read|conversation)\w*\b/i.test(text)) {
    const pause=/\b(?:pause|stop|halt)\b/i.test(text)&&!negated;
    const quote=text.match(/[“"]([^”"]{8,100})[”"]/)?.[1];
    return make('statement',pause?'pause':'announce',quote || (pause&&ai?'A call to pause AI':`${person.name.split(' ')[0]}'s message`),[node(person.name,'person'),node(/twitter|tweet/i.test(text)?'Public post':'Statement','message'),node(pause?'Pause development':ai?'AI development':'The idea',ai?'chip':'idea')],`Identify ${person.name}, then connect the statement to its subject. The post is a script illustration, not a fetched screenshot.`,'Script excerpt');
  }
  if(ai && /\b(sandbox|restrict|circumvent|escape|access the internet|disconnect the internet|hacking|hacked)\w*\b/i.test(text)) {
    const escaping=/\b(escap|circumvent|bypass|hack|access)\w*\b/i.test(text)&&!negated;
    return make('boundary',escaping?'escape':'restrict',negated?'The boundary holds':escaping?'Beyond the sandbox':'Inside the sandbox',[node('AI agents','agent'),node('Sandbox','shield'),node('Internet','globe')],escaping?'Show the stated movement from a restricted environment to an external network.':'Show agents within a boundary; keep the external connection blocked.');
  }
  if(ai && /\b(message|board|talk|communicat|collective|together|sacrifice|obey|group|decision|agent)\w*\b/i.test(text)) {
    const exchange=/\b(message|board|talk|communicat|sent|send|shared)\w*\b/i.test(text);
    return make('network',negated?'restrict':exchange?'exchange':'connect',negated?'The connection is blocked':exchange?'Agents exchanging messages':'From agents to a collective',[node('Agent','agent'),node(exchange?'Shared messages':'Shared goal',exchange?'message':'network'),node('Agent','agent')],exchange?'Draw separate agents, then animate messages along their connections.':'Draw individual agents joining a shared system; do not depict literal human feelings.');
  }
  const brands=entities.filter(e=>e.kind==='brand'&&!['Twitter','Discord'].includes(e.name));
  if(brands.length>=2) {
    entities=entities.filter(entity=>entity.name!=='Twitter' || !/\bon Twitter\b/i.test(text));
    const down=/\b(down|outage|offline|fail)\w*\b/i.test(text);
    return make('ecosystem',down?'decline':/\b(versus|vs|compet|compar)\w*/i.test(text)?'compare':'connect',down?'Services going offline':'The AI ecosystem',brands.map(e=>node(e.name,'chip')).slice(0,5),'Identify the products separately, then stage their relationship. No invented performance values.');
  }
  if(ai && /\b(pause|halt|stop|ban|regulat)\w*\b/i.test(text)&&!negated)return make('flow','pause','Putting AI development on hold',[node('AI development','chip'),node('Pause','pause'),node('Next steps','document')],'Show a running process come to a controlled halt.');
  if(ai) {
    const learn=/\b(train|learn|intelligen|smart|understand|reason)\w*\b/i.test(text);
    const launch=/\b(launch|release|introduc)\w*\b/i.test(text);
    return make('flow',learn?'learn':launch?'announce':'sequence',launch?'A new model arrives':learn?'How AI connects the pieces':'Inside the AI system',launch?[node(brands[0]?.name||'Development','code'),node(entities.find(e=>e.role==='AI model')?.name||'AI model','chip'),node('Release','globe')]:[node('Input','document'),node('AI model','chip'),node('Output','message')],'Use an input, model, and output diagram to explain the idea in the source.');
  }
  if(person)return make('portrait','identify',person.name,[node(person.name,'person')],`Identify the named person with a sourced portrait and an editable name.`, '');
  if(/\b(first|then|finally|process|workflow|from .+ to|step by step)\b/i.test(text) && !/\d\s*(seconds|hours|days)/i.test(text)) {
    const clauses=text.split(/\s+(?:then|finally)\s+|;\s*/i).map(s=>s.replace(/^(first|next)[,:]?\s*/i,'').trim()).filter(Boolean);
    if(clauses.length>=2)return make('flow','sequence','How it works',clauses.slice(0,4).map(s=>node(s.split(/\s+/).slice(0,5).join(' '),'document')),'Stage the supplied actions in order with an animated connection between each step.');
  }
  if(brands.length===1)return make('ecosystem','identify',brands[0].name,[node(brands[0].name,'chip')],'Identify the named product with its real mark.','');
  return undefined;
}

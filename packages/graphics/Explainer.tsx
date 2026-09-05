import {useState,useEffect,type CSSProperties,type ReactNode} from 'react';
import { AsProfile } from './as-generator/profile';
import { AsCard } from './as-generator/card';
import { AsAlert } from './as-generator/alert';
import { componentTokens,componentClasses } from './as-generator/bridge';
import { Material } from './Material';
import { motionAt, type GraphicSpec, type SceneVisual, type VisualEntity } from './spec';

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export const phase=(t:number,start:number,duration:number)=>1-Math.pow(1-clamp((t-start)/duration),3);
const enter=(t:number,delay=0):CSSProperties=>({opacity:phase(t,delay,.48),transform:`translateY(${(1-phase(t,delay,.8))*42}px) scale(${.93+.07*phase(t,delay,.7)})`});
const paths:Record<string,string>={
  person:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 22v-3a8 8 0 0 1 16 0v3',
  chip:'M6 6h12v12H6ZM9 1v5m6-5v5M9 18v5m6-5v5M1 9h5m-5 6h5m12-6h5m-5 6h5M10 10h4v4h-4Z',
  agent:'M5 7h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2ZM12 2v5M8 12v2m8-2v2m-7 3h6M0 12h3m18 0h3',
  message:'M3 3h18v13H9l-6 5V3ZM7 7h10M7 11h6',
  globe:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M2 12h20M12 2c-6 5-6 15 0 20 6-5 6-15 0-20Z',
  shield:'M12 2 3 6v7c0 5 9 9 9 9s9-4 9-9V6ZM8 12l3 3 5-6',
  document:'M5 2h9l5 5v15H5ZM14 2v6h5M8 12h8m-8 4h6',
  network:'M12 4v7M4 20v-9h16v9M9 1h6v6H9ZM1 17h6v6H1Zm16 0h6v6h-6Z',
  chart:'M3 2v19h19M7 16l4-5 4 2 6-8',
  check:'M3 12l6 6L21 5',search:'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0m-2 5 7 7',
  pause:'M7 3v18M17 3v18',code:'m8 5-6 7 6 7m8-14 6 7-6 7m-3-16-2 20',
  idea:'M9 18v4h6v-4M8 15a7 7 0 1 1 8 0l-1 3H9Z',
};
function Icon({name,size=42}:{name:string;size?:number}) {return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] || paths.chip}/></svg>;}
function Subject({entity,large=false}:{entity:VisualEntity;large?:boolean}) {
  const [failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[entity.asset]);
  return <div className={`ex-subject ${entity.kind}${large?' ex-large':''}`}>
    {entity.asset && !failed ? <img src={`assets/entities/${entity.asset.file}`} alt={entity.name} draggable={false} onError={()=>setFailed(true)}/> : entity.kind==='person'||entity.kind==='brand'?<span className="ex-image-missing"><strong>{entity.name.split(/\s+/).slice(0,2).map(s=>s[0]).join('')}</strong><small>Image unavailable</small></span>:<Icon name="chip" size={large?120:60}/>}
  </div>;
}
const conceptualAgent:VisualEntity={id:'agent',name:'AI agent',kind:'concept',mention:'AI agent',role:''};

function Speaker({spec,entity,t,material}:{spec:GraphicSpec;entity:VisualEntity;t:number;material?:ReactNode}) {
  return <AsProfile className={`ag-speaker finish-${spec.style.finish||'glass'}`} title={entity.name} eyebrow={entity.role||'In this story'} description={entity.asset?.credit||'Photo unavailable'} media={<Subject entity={entity} large/>} material={material} style={{...componentTokens(spec),...enter(t,.05)}}/>;
}
function Statement({spec,t,material}:{spec:GraphicSpec;t:number;material?:ReactNode}) {
  const v=spec.visual!,person=v.entities.find(e=>e.kind==='person') || conceptualAgent;
  const logo=v.entities.find(e=>e.kind==='brand'&&/twitter/i.test(e.name));
  const isPause=v.action==='pause',arrived=phase(t,1.6,.6),last=v.steps.at(-1);
  return <div className="ex-statement-layout ag-statement-layout">
    <Speaker spec={spec} entity={person} t={t} material={material}/>
    <div className="ag-message-group">
      <div className="ag-message-byline" style={enter(t,.3)}>{logo?<Subject entity={logo}/>:<Icon name="message" size={24}/>}<span>{person.name}</span><i/>{v.qualifier||'Script excerpt'}</div>
      <AsCard className="ag-quote" title={spec.content.title} eyebrow={isPause?'The request':'The statement'} style={{...componentTokens(spec),...enter(t,.45)}}><div className="ag-quote-rule" style={{transform:`scaleX(${phase(t,.6,1)})`}}/></AsCard>
      <div className="ag-action-connection" aria-hidden="true" style={{opacity:phase(t,.8,.4)}}><svg viewBox="0 0 420 40"><path d="M12 20H408" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 8"/><circle cx={12+Math.min(1,Math.max(0,t-.9)/1.1)*396} cy="20" r="4" fill="currentColor"/></svg></div>
      <AsAlert className={componentClasses(spec,'ag-request')} title={isPause?'Call to pause':last?.label||'The idea'} eyebrow={isPause?'AI development':'What it means'} icon={<Icon name={isPause&&arrived>.5?'pause':last?.icon||'idea'} size={50}/>} style={{...componentTokens(spec),...enter(t,1.05)}}/>
    </div>
  </div>;
}

function MechanismSteps({visual,t}:{visual:SceneVisual;t:number}) {return <div className="ex-mechanism-steps">{visual.steps.slice(0,3).map((step,i)=><span key={i} style={enter(t,.6+i*.45)}><Icon name={step.icon} size={22}/>{step.label}</span>)}</div>;}

function Network({spec,visual,t,portrait,material}:{spec:GraphicSpec;visual:SceneVisual;t:number;portrait:boolean;material?:ReactNode}) {
  const blocked=visual.action==='restrict';
  const ai=visual.entities.some(entity=>/AI|artificial intelligence|agent/i.test(entity.name)) || /\bAI\b/i.test(visual.evidence);
  const actors=visual.entities.filter(entity=>entity.kind==='person'||entity.kind==='brand');
  const points=portrait?[[140,130],[580,130],[95,490],[625,490],[140,850],[580,850]]:[[155,128],[600,84],[1045,128],[155,522],[600,566],[1045,522]];
  const cx=portrait?360:600,cy=portrait?490:325;
  return <div className="ex-diagram ex-network"><svg viewBox={portrait?'0 0 720 980':'0 0 1200 650'} role="img" aria-label={blocked?'AI agents with blocked connections':'Individual AI agents exchanging messages through a shared board'}>
    <defs><linearGradient id="network-line"><stop stopColor="var(--mg-accent)"/><stop offset="1" stopColor="var(--mg-ink)"/></linearGradient></defs>
    {points.map(([x,y],i)=><g key={`link-${i}`} opacity={phase(t,.45+i*.11,.55)}><path d={`M${x} ${y} Q${cx+(x-cx)*.25} ${y} ${cx} ${cy}`} pathLength="1" fill="none" stroke="var(--mg-accent)" strokeWidth="2" strokeOpacity=".5" strokeDasharray="1" strokeDashoffset={1-phase(t,.6+i*.12,.8)}/>{!blocked && [0,1].map(k=>{const p=clamp(((Math.max(0,t-1.15-i*.11)*.3+k*.5)%1)),control=cx+(x-cx)*.25;const px=(1-p)**2*x+2*(1-p)*p*control+p*p*cx,py=(1-p)**2*y+2*(1-p)*p*y+p*p*cy;return <g key={k} opacity={phase(t,1.2+i*.1,.25)} transform={`translate(${px},${py}) rotate(${Math.atan2(2*p*(cy-y),2*(1-p)*(control-x)+2*p*(cx-control))*180/Math.PI})`}><rect x="-10" y="-4" width="20" height="8" rx="4" fill="var(--mg-accent)"/></g>;})}</g>)}
    <foreignObject x={cx-170} y={cy-110} width="340" height="220" opacity={phase(t,.35,.6)}><AsCard className={componentClasses(spec,'ag-network-core')} eyebrow={blocked?'Restricted':'Agent network'} title={blocked?'Connection blocked':visual.action==='exchange'?'Shared messages':'Shared goal'} style={componentTokens(spec)} material={material}><div className="ag-core-ledger">{[0,1,2].map(i=><span key={i} style={{opacity:phase(t,1+i*.28,.4)}}><i/><b/></span>)}</div></AsCard></foreignObject>
    {points.map(([x,y],i)=><g key={i} opacity={phase(t,i*.1,.4)} transform={`translate(${x},${y}) scale(${.8+.2*phase(t,i*.1,.6)})`}><rect x="-70" y="-58" width="140" height="116" rx="24" fill="var(--mg-bg)" stroke="var(--mg-accent)" strokeWidth="2"/><svg x="-29" y="-34" width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="var(--mg-ink)" strokeWidth="1.5"><path d={paths[ai?'agent':'person']}/></svg><text y="44" textAnchor="middle" className="ex-svg-small">{ai?'AI AGENT':actors[i]?.name || 'ACTOR'}</text></g>)}
  </svg><MechanismSteps visual={visual} t={t}/></div>;
}

function Boundary({spec,visual,t,portrait,material}:{spec:GraphicSpec;visual:SceneVisual;t:number;portrait:boolean;material?:ReactNode}) {
  const escape=visual.action==='escape',progress=phase(t,1.35,1.6),x=escape?290+progress*510:290;
  if(portrait)return <div className="ex-diagram ex-boundary"><svg viewBox="0 0 720 1040" role="img" aria-label={escape?'An AI agent crosses a sandbox boundary toward the internet':'An agent remains in a restricted sandbox'}>
    <g opacity={phase(t,0,.5)}><path d="M100 100 520 65 620 125V470L200 520 100 455Z" fill="var(--mg-secondary)" fillOpacity=".4" stroke="var(--mg-accent)" strokeWidth="2"/><path d="M100 100 200 155 620 125M200 155V520" stroke="var(--mg-accent)" strokeOpacity=".35" strokeWidth="2" fill="none"/>{[0,1,2,3,4].map(i=><path key={i} d={`M${265+i*65} ${150-i*4}V${510-i*8}`} stroke="var(--mg-accent)" strokeOpacity=".15" strokeWidth="2"/>)}<text x="360" y="35" textAnchor="middle" className="ex-svg-title">Sandbox</text></g>
    <path d="M360 275V820" fill="none" stroke="var(--mg-accent)" strokeWidth="3" strokeDasharray="10 10" opacity={phase(t,.8,.5)}/>
    <g transform="translate(360,865)" opacity={phase(t,.4,.6)}><circle r="95" fill="var(--mg-bg)" stroke="var(--mg-accent)" strokeWidth="2"/><svg x="-45" y="-45" width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="var(--mg-ink)" strokeWidth="1"><path d={paths.globe}/></svg><text y="143" textAnchor="middle" className="ex-svg-title">Internet</text></g>
    <g transform={`translate(360,${escape?275+progress*395:275})`} opacity={phase(t,.2,.5)}><rect x="-66" y="-67" width="132" height="134" rx="22" fill="var(--mg-secondary)" stroke="var(--mg-ink)" strokeWidth="2"/><svg x="-37" y="-43" width="74" height="74" viewBox="0 0 24 24" fill="none" stroke="var(--mg-ink)" strokeWidth="1.3"><path d={paths.agent}/></svg><text y="48" textAnchor="middle" className="ex-svg-small">AGENT</text></g>
    <g transform="translate(360,502)" opacity={escape?1-progress:phase(t,1,.4)}><rect x="-58" y="-19" width="116" height="38" rx="9" fill="var(--mg-accent)"/></g>
  </svg><AsAlert className={componentClasses(spec,'ag-boundary-status')} title={escape?'Beyond the restriction':'Access restricted'} eyebrow="Account in script" icon={<Icon name={escape?'globe':'shield'} size={38}/>} material={material} style={{...componentTokens(spec),...enter(t,1)}}/></div>;
  return <div className="ex-diagram ex-boundary"><svg viewBox="0 0 1200 650" role="img" aria-label={escape?'An AI agent crosses a sandbox boundary toward an external network':'An AI agent remains within a sandbox boundary'}>
    <g opacity={phase(t,0,.5)}><path d="M110 120 560 70 650 128V516L200 570 110 510Z" fill="var(--mg-secondary)" fillOpacity=".4" stroke="var(--mg-accent)" strokeWidth="2"/><path d="M110 120 200 178 650 128M200 178V570" stroke="var(--mg-accent)" strokeOpacity=".35" strokeWidth="2" fill="none"/>{[0,1,2,3,4].map(i=><path key={i} d={`M${275+i*66} ${169-i*7}V${560-i*8}`} stroke="var(--mg-accent)" strokeOpacity=".15" strokeWidth="2"/>)}<text x="290" y="92" textAnchor="middle" className="ex-svg-small">SANDBOX</text></g>
    <path d="M330 338H950" fill="none" stroke="var(--mg-accent)" strokeWidth="3" pathLength="1" strokeDasharray=".018 .014" strokeDashoffset={-Math.min(t,escape?100:1.4)*.05} opacity={phase(t,.8,.5)}/>
    <g opacity={phase(t,.4,.6)} transform="translate(990,338)"><circle r="105" fill="var(--mg-bg)" stroke="var(--mg-accent)" strokeWidth="2"/><svg x="-50" y="-50" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="var(--mg-ink)" strokeWidth="1"><path d={paths.globe}/></svg><text y="148" textAnchor="middle" className="ex-svg-title">Internet</text></g>
    <g transform={`translate(${x},338)`} opacity={phase(t,.2,.5)}><rect x="-66" y="-67" width="132" height="134" rx="22" fill="var(--mg-secondary)" stroke="var(--mg-ink)" strokeWidth="2"/><svg x="-37" y="-43" width="74" height="74" viewBox="0 0 24 24" fill="none" stroke="var(--mg-ink)" strokeWidth="1.3"><path d={paths.agent}/></svg><text y="48" textAnchor="middle" className="ex-svg-small">AGENT</text></g>
    <g transform="translate(652,338)" opacity={escape?1-progress:phase(t,1,.4)}><rect x="-19" y="-58" width="38" height="116" rx="9" fill="var(--mg-accent)"/><path d="M-8-27v54m16-54v54" stroke="var(--mg-bg)" strokeWidth="5"/></g>
    <g opacity={phase(t,2,.6)}><text x="600" y="620" textAnchor="middle" className="ex-svg-title">{escape?'Restricted environment → external access':'External access stays restricted'}</text></g>
  </svg><AsAlert className={componentClasses(spec,'ag-boundary-status')} title={escape?'Beyond the restriction':'Access restricted'} eyebrow="Account in script" icon={<Icon name={escape?'globe':'shield'} size={38}/>} material={material} style={{...componentTokens(spec),...enter(t,1)}}/></div>;
}

function Ecosystem({spec,visual,t,material}:{spec:GraphicSpec;visual:SceneVisual;t:number;material?:ReactNode}) {
  const brands=visual.entities.filter(e=>e.kind==='brand');const entities=brands.length>1?brands.filter(e=>!(/Twitter/i.test(e.name)&&/\bon Twitter\b/i.test(visual.entities.find(v=>v.name===e.name)?.mention||''))):brands;const down=visual.action==='decline';
  return <div className={`ex-ecosystem ex-count-${entities.length}`}>
    <div className="ex-orbit" aria-hidden="true" data-layout-allow-overflow style={{transform:`rotateX(62deg) rotateZ(${t*3}deg)`}}/>
    {entities.map((entity,i)=><div className="ex-brand-station" key={entity.id} style={{...enter(t,.1+i*.2),transform:`translateY(${(1-phase(t,.1+i*.2,.8))*60+(i%2?25:-25)}px)`}}>
      <AsCard className={componentClasses(spec,'ex-brand-plinth ag-brand')} title="" eyebrow="" style={componentTokens(spec)} material={i===0?material:undefined}><Subject entity={entity} large/><div className="ex-plinth-edge"/></AsCard>
      <strong>{entity.name}</strong>
      {down && <span className="ex-service-state" style={{opacity:phase(t,1.5+i*.3,.5)}}><i/>Offline in script</span>}
    </div>)}
    {visual.action==='compare' && <div className="ex-versus" style={enter(t,.7)}>vs.</div>}
  </div>;
}

function Flow({spec,visual,t,material}:{spec:GraphicSpec;visual:SceneVisual;t:number;material?:ReactNode}) {
  const steps=visual.steps.length?visual.steps:[{label:'Input',icon:'document' as const},{label:'Process',icon:'chip' as const},{label:'Output',icon:'message' as const}];
  const paused=visual.action==='pause';
  return <div className={`ex-flow ex-flow-${steps.length}`}>
    {steps.map((step,i)=>{const brand=visual.entities.find(entity=>entity.kind==='brand'&&step.label.toLowerCase().includes(entity.name.toLowerCase()));return <div className="ex-flow-item" key={i} style={enter(t,i*.23)}>
      {i>0 && <div className="ex-flow-link" aria-hidden="true" data-layout-allow-overflow><svg viewBox="0 0 160 50"><path d="M0 25H145m-14-13 14 13-14 13" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="190" strokeDashoffset={190*(1-phase(t,.4+i*.25,.7))}/><circle cx={paused?Math.min(120,Math.max(0,t-.7)*85):((Math.max(0,t-.7)*85)%145)} cy="25" r="4" fill="currentColor" opacity={phase(t,1,.4)}/></svg></div>}
      <AsCard title="" eyebrow="" material={i===Math.min(1,steps.length-1)?material:undefined} className={componentClasses(spec,`ex-device ag-device ${i===1?'ex-device-main':''}`)} style={{...componentTokens(spec),transform:`perspective(900px) rotateX(${12-12*phase(t,.2+i*.2,1)}deg) rotateY(${i===1?-9:-4}deg)`}}>
        {step.icon==='chip' && <div className="ex-chip-traces" aria-hidden="true">{Array.from({length:12},(_,k)=><i key={k} style={{opacity:.2+.65*phase(t,.6+k*.12,.4)}}/>)}</div>}
        {brand?.asset?<Subject entity={brand}/>:<Icon name={paused&&i===1?'pause':step.icon} size={100}/>}
        {i===1 && <div className="ex-device-activity" aria-hidden="true">{Array.from({length:9},(_,j)=><i key={j} style={{transform:`scaleY(${.2+.8*Math.abs(Math.sin((paused?Math.min(t,1.7):t)*3+j*.9))})`}}/>)}</div>}
      </AsCard>
      <strong>{step.label}</strong>
    </div>;})}
  </div>;
}

export function Explainer({spec,seconds,overlay=false,fallback=false,portrait=false}:{spec:GraphicSpec;seconds:number;overlay?:boolean;fallback?:boolean;portrait?:boolean}) {
  const visual=spec.visual!,p=spec.style.palette,m=motionAt(spec,seconds);
  // Fit the complete establish → connect → result choreography into short cues.
  const t=seconds*Math.max(.85,Math.min(4,4.2/spec.duration))*(.9+spec.motion.energy*.25);
  const style={'--mg-bg':p.background,'--mg-ink':p.ink,'--mg-accent':p.accent,'--mg-secondary':p.secondary,'--mg-type':spec.style.typeScale,left:`${spec.box.x*100}%`,top:`${spec.box.y*100}%`,width:`${spec.box.width*100}%`,height:`${spec.box.height*100}%`,opacity:m.opacity} as CSSProperties;
  const statement=visual.kind==='statement';
  const material=!fallback&&spec.style.material!=='none'?<Material spec={spec}/>:undefined;
  return <article className={`mg-graphic mg-explainer ex-${visual.kind}${overlay?' ex-overlay':''}`} data-graphic-id={spec.id} data-archetype="semantic-explanation" data-visual-action={visual.action} style={style}>
    <div className="ex-stage-ground" aria-hidden="true" data-layout-ignore><div className="ex-stage-horizon"/></div>

    <div className="mg-content ex-content">
      {!statement && <header className="ex-heading" style={enter(t,0)}><h1>{spec.content.title}</h1></header>}
      <div className="ex-scene">
        {statement && <Statement spec={spec} t={t} material={material}/>}
        {visual.kind==='portrait' && <Speaker spec={spec} entity={visual.entities.find(e=>e.kind==='person')||conceptualAgent} t={t} material={material}/>}
        {visual.kind==='network' && <Network spec={spec} visual={visual} t={t} portrait={portrait} material={material}/>}
        {visual.kind==='boundary' && <Boundary spec={spec} visual={visual} t={t} portrait={portrait} material={material}/>}
        {visual.kind==='ecosystem' && <Ecosystem spec={spec} visual={visual} t={t} material={material}/>}
        {visual.kind==='flow' && <Flow spec={spec} visual={visual} t={t} material={material}/>}
      </div>
      {!statement && <footer className="ex-footnote">{visual.qualifier}<span>{visual.kind==='portrait'?visual.entities.find(entity=>entity.kind==='person')?.asset?.credit:''}</span></footer>}
    </div>
  </article>;
}

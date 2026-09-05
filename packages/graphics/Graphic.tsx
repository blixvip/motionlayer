import { Material } from './Material';
import type { CSSProperties } from 'react';
import { motionAt, type GraphicSpec } from './spec';
import { displayExcerpt, layerMotion, sceneArchetype, statisticCopy } from './design';
import { Explainer } from './Explainer';

function Display({text,seconds}:{text:string;seconds:number}) {
  const words=displayExcerpt(text).replace(/[.!]$/,'').split(/\s+/);
  return <>{words.map((word,i)=><span className="mg-word-mask" key={i}><span className={i===words.length-1?'mg-accent-word':''} style={layerMotion(seconds,.12+i*.065,.72)}>{word}</span>{' '}</span>)}</>;
}

/** Ground → shadow → hero → copy → edge depth → post. All motion is seek-driven. */
export function Graphic({spec,seconds,overlay=false,fallback=false,portrait=false}:{spec:GraphicSpec;seconds:number;overlay?:boolean;fallback?:boolean;portrait?:boolean}) {
  if(spec.family==='explainer' && spec.visual)return <Explainer spec={spec} seconds={seconds} overlay={overlay} fallback={fallback} portrait={portrait}/>;
  const m=motionAt(spec,seconds),c=spec.content,p=spec.style.palette;
  const state=Math.min(2,Math.floor(m.progress*3));
  const tint=p.accent.slice(1).match(/../g)!.map(v=>parseInt(v,16)/255);
  const plane=!overlay && spec.family==='title' && /\b(idea|ideas|share|send|flight|fly|launch|possibility|possibilities)\b/i.test(spec.source.text);
  const style={ '--mg-bg':p.background,'--mg-ink':p.ink,'--mg-accent':p.accent,'--mg-secondary':p.secondary,'--mg-type':spec.style.typeScale,
    left:`${spec.box.x*100}%`,top:`${spec.box.y*100}%`,width:`${spec.box.width*100}%`,height:`${spec.box.height*100}%`,opacity:m.opacity,
    fontFamily:spec.style.font==='humanist'?'Motion Humanist,sans-serif':'Motion Display,sans-serif',
    '--mg-camera':1+(.012+.03*spec.motion.energy)*Math.sin(Math.min(1,seconds/spec.duration)*Math.PI/2), '--mg-drift':`${-seconds*1.5}px` } as CSSProperties;
  const stat=statisticCopy(c),headline=spec.family==='statistic'?stat.title:c.title;
  const title=<h1 aria-label={headline}><Display text={headline} seconds={seconds*(.8+spec.motion.energy*.5)}/></h1>;
  return <article className={`mg-graphic mg-${spec.family} mg-layout-${spec.layout} mg-${spec.style.spacing}${overlay?' mg-overlay':''}${plane?' mg-with-hero':''}`} style={style} data-graphic-id={spec.id} data-archetype={sceneArchetype(spec,overlay)}>
    <div className="mg-ground" aria-hidden="true" data-layout-ignore/>
    <svg width="0" height="0" aria-hidden="true" data-layout-ignore><defs><filter id={`conform-${spec.id}`} colorInterpolationFilters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues={`${tint[0]*.1} ${.76+tint[0]*.2}`}/><feFuncG type="table" tableValues={`${tint[1]*.1} ${.76+tint[1]*.2}`}/><feFuncB type="table" tableValues={`${tint[2]*.1} ${.76+tint[2]*.2}`}/></feComponentTransfer></filter></defs></svg>
    <div className="mg-camera">
      <div className="mg-back-type" aria-hidden="true" data-layout-ignore>{spec.family==='statistic'?c.value:c.title.split(/\s+/)[0]}</div>
      {plane && <><div className="mg-cast-shadow" aria-hidden="true" data-layout-ignore/><div className="mg-hero" style={{...layerMotion(seconds,.24,1.1),transform:`translate(${seconds*2}px,${-seconds*3}px) rotate(${-8+seconds*.8}deg)`}}><img src="assets/idea-flight.png" style={{filter:`url(#conform-${spec.id}) drop-shadow(20px 36px 22px ${p.background})`}} alt="Sculpted paper airplane — an illustration of an idea taking shape"/></div></>}
      <div className="mg-content">
        {spec.family==='title' && <>{title}<div className="mg-rule" style={{transform:`scaleX(${m.progress})`}}/></>}
        {spec.family==='statistic' && <><div className="mg-stat-value" style={layerMotion(seconds,.08,1)}>{c.value||'—'}</div><div className="mg-stat-copy">{stat.title && title}<div className="mg-stat-baseline" style={{transform:`scaleX(${m.progress})`}}/>{stat.detail && <span className="mg-data-label">{displayExcerpt(stat.detail,10)}</span>}</div></>}
        {spec.family==='comparison' && <>{title}<div className="mg-comparison">{c.items.slice(0,2).map((item,i)=><section key={i} style={layerMotion(seconds,.3+i*.24)}><span className="mg-comparison-index">{i===0?'A':'B'}</span><p>{displayExcerpt(item)}</p><div className="mg-panel-line"/></section>)}</div></>}
        {spec.family==='steps' && <>{title}<ol className="mg-steps">{c.items.map((item,i)=><li key={i} style={layerMotion(seconds,.28+i*.25)}><span>{String(i+1).padStart(2,'0')}</span><p>{displayExcerpt(item,7)}</p></li>)}</ol></>}
        {spec.family==='quote' && <><div className="mg-quote-mark" aria-hidden="true">“</div><blockquote><Display text={c.title} seconds={seconds}/></blockquote>{c.attribution && <p className="mg-attribution" style={layerMotion(seconds,.65)}>{c.attribution}</p>}<div className="mg-rule" style={{transform:`scaleX(${m.progress})`}}/></>}
        {spec.family==='product' && <><div className="mg-product-copy">{title}</div><section className={`mg-product-demo mg-state-${state}`} style={layerMotion(seconds,.35,1)} aria-label="Timed product demonstration">
          <div className="mg-demo-chrome" aria-hidden="true"><i/><i/><i/><span>Interaction study</span></div>
          {!fallback && spec.style.material!=='none' && <div className="mg-material-well"><Material spec={spec}/></div>}
          <div className="mg-demo-body">
            {c.control==='button' && <button type="button" tabIndex={-1} aria-pressed={state===2} className="mg-demo-button">{displayExcerpt(c.items[0]||c.title,6)}<svg viewBox="0 0 24 24" aria-hidden="true"><path d={state===2?'M4 12l5 5L20 6':'M5 12h14m-6-6 6 6-6 6'} fill="none" stroke="currentColor" strokeWidth="2"/></svg></button>}
            {c.control==='tabs' && <><div role="tablist" aria-label="Product states">{c.items.map((item,i)=><button key={i} type="button" role="tab" tabIndex={-1} aria-selected={i===state%c.items.length}>{displayExcerpt(item,3)}</button>)}</div><div className="mg-tab-panel">{displayExcerpt(c.items[state%Math.max(1,c.items.length)]||c.title,6)}</div></>}
            {c.control==='input' && <label className="mg-demo-input"><span>{displayExcerpt(c.title,5)}</span><input tabIndex={-1} readOnly value={(c.items[0]||c.title).slice(0,Math.floor(m.progress*(c.items[0]||c.title).length))} aria-label="Demonstration input"/></label>}
            {c.control==='progress' && <div className="mg-demo-progress"><span>{displayExcerpt(c.items[0]||c.title,5)}</span><div role="progressbar" aria-label="Illustrative animation progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(m.progress*100)}><i style={{transform:`scaleX(${m.progress})`}}/></div><small>Illustrative interaction</small></div>}
            {c.control==='cards' && <div className="mg-demo-cards">{c.items.map((item,i)=><div key={i} aria-current={state===i} style={{transform:`translateX(${state===i?12:0}px)`}}>{displayExcerpt(item,5)}</div>)}</div>}
          </div><svg className="mg-pointer" viewBox="0 0 28 32" aria-hidden="true" style={{transform:`translate(${(1-m.progress)*80}px,${(1-m.progress)*90}px) scale(${state===1?.85:1})`}}><path d="M3 2v25l7-7 5 10 5-3-5-9h10z" fill={p.ink} stroke={p.background} strokeWidth="2"/></svg>
        </section></>}
        {c.detail && spec.family!=='statistic' && <p className="mg-support" style={layerMotion(seconds,.8)}>{displayExcerpt(c.detail,8)}</p>}
      </div>
      {spec.family!=='product' && spec.style.material!=='none' && !fallback && <div className="mg-material-well"><Material spec={spec}/></div>}
      <div className="mg-edge mg-edge-one" aria-hidden="true" data-layout-ignore/><div className="mg-edge mg-edge-two" aria-hidden="true" data-layout-ignore/>
    </div><div className="mg-post" aria-hidden="true" data-layout-ignore data-layout-allow-occlusion/>
  </article>;
}

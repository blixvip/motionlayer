import type { GraphicSpec } from './spec';

/** Hue sampled from the archived spatial-light reference, never script keywords. */
export const REFERENCE_ACCENT = '#4a4a8f';
export function paletteFromAccent(accent = REFERENCE_ACCENT, light = false): GraphicSpec['style']['palette'] {
  const rgb=accent.slice(1).match(/../g)!.map(v=>parseInt(v,16));
  const [r,g,b]=rgb.map(v=>v/255),hi=Math.max(r,g,b),lo=Math.min(r,g,b),delta=hi-lo,l=(hi+lo)/2;
  const hue=delta===0?0:((hi===r?(g-b)/delta+(g<b?6:0):hi===g?(b-r)/delta+2:(r-g)/delta+4)/6);
  const saturation=delta===0?0:delta/(1-Math.abs(2*l-1));
  const tone=(lightness:number,sat:number)=>{
    const c=(1-Math.abs(2*lightness-1))*sat,x=c*(1-Math.abs((hue*6)%2-1)),m=lightness-c/2;
    const channels=hue<1/6?[c,x,0]:hue<2/6?[x,c,0]:hue<3/6?[0,c,x]:hue<4/6?[0,x,c]:hue<5/6?[x,0,c]:[c,0,x];
    return '#'+channels.map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('');
  };
  // Lift exposure without washing the sampled hue into gray.
  const chroma=Math.min(.72,saturation*1.45);
  return {background:tone(light?.965:.10,chroma*.75),ink:tone(light?.09:.945,chroma*.35),accent:tone(light?.38:.70,chroma),secondary:tone(light?.88:.24,chroma)};
}
export function statisticCopy(content:GraphicSpec['content']) {
  const value=content.value.trim();
  const strip=(text:string)=>value?text.replace(new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),'').replace(/\s+/g,' ').replace(/[.,:;!?]+$/,'').trim().replace(/\s+(?:takes|is|are|to|of|by|at)$/i,'').trim():text.trim();
  const title=strip(content.title),detail=strip(content.detail);
  return {title,detail:detail && detail.toLowerCase()!==title.toLowerCase()?detail:''};
}
export function displayExcerpt(text:string,limit=8) {
  const words=text.trim().split(/\s+/);
  if(words.length<=limit)return text.trim();
  const clause=text.split(/[,;:—]|\s+(?:because|which|while)\s+/i).find(v=>v.trim().split(/\s+/).length>=3 && v.trim().split(/\s+/).length<=limit);
  return clause?.trim() || words.slice(0,limit).join(' ')+'…';
}
export function layerMotion(seconds:number,delay:number,duration=.8) {
  const t=Math.max(0,Math.min(1,(seconds-delay)/duration));
  const eased=1-Math.pow(1-t,4);
  return {opacity:eased,transform:`translateY(${(1-eased)*48}px)`,filter:`blur(${(1-eased)*5}px)`};
}
export function sceneArchetype(spec:GraphicSpec,overlay=false) {
  return overlay ? 'overlay' : spec.family==='product' || spec.family==='comparison' || spec.family==='steps' ? 'full-frame-ui' : spec.family==='statistic' ? 'dimensional' : 'typographic';
}

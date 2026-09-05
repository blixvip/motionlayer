import { ENGINE_VERSION, graphicSchema, planSchema, type GraphicSpec, type GraphicsPlan, intersects } from "./spec";
import type { StoredProject } from "../../lib/project-store";
import { parseTimestampedScript } from "../../lib/script-understanding";
import { paletteFromAccent, displayExcerpt } from './design';
import { explainBeat } from './semantics';
import type { VisualEntity } from './spec';
import {materialForVisual} from './as-generator/bridge';

export function artDirection(direction: string, script: string): GraphicSpec["style"] {
  void script;
  return {palette:paletteFromAccent(undefined,/field|light|airy/i.test(direction)),font:/field/i.test(direction)?'humanist':'grotesk',typeScale:/blueprint/i.test(direction)?.9:1,spacing:/blueprint/i.test(direction)?'compact':'open',material:'none',intensity:.18,speed:.25};
}
function familyFor(text: string): GraphicSpec["family"] {
  if (/\b(button|tabs?|input|progress|dashboard|click|interface)\b/i.test(text)) return "product";
  if (/[“"]([^”"]+)[”"]/.test(text)) return "quote";
  if (/\b(versus|vs\.?|compared|instead|whereas)\b/i.test(text)) return "comparison";
  if (/\b(then|finally)\b|;/.test(text)) return "steps";
  if (/\d+(?:[.,]\d+)*(?:\s?%|\s?(?:million|billion|times|seconds|hours))?/.test(text)) return "statistic";
  return "title";
}
export function sourceContent(text: string): GraphicSpec["content"] {
  const sentences = Array.from(new Intl.Segmenter("en", {granularity:"sentence"}).segment(text), v => v.segment.trim());
  const title = displayExcerpt(sentences[0] || text);
  const quoted = text.match(/[“"]([^”"]+)[”"]/);
  return { title: quoted ? displayExcerpt(quoted[1]) : title, detail: sentences.slice(1).join(" ").slice(0,600),
    value: text.match(/\d+(?:[.,]\d+)*(?:\s?%|\s?(?:million|billion|times|seconds|hours))?/)?.[0] || "",
    attribution: quoted ? text.slice((quoted.index || 0) + quoted[0].length).replace(/^[\s—–,.-]+/, "").slice(0,160) : "",
    items: text.split(/\s+(?:versus|vs\.?|whereas|then|finally)\s+|;\s*/i).filter(Boolean).slice(0,5).map(v => v.slice(0,200)),
    control: /tabs?/i.test(text) ? "tabs" : /input|type|enter/i.test(text) ? "input" : /progress|loading/i.test(text) ? "progress" : /cards?|dashboard/i.test(text) ? "cards" : "button" };
}
export function createPlan(input: { id: string; script: string; format?: string; direction?: string; project?: StoredProject; palette?:GraphicSpec['style']['palette']; paletteSource?:string }): GraphicsPlan {
  const { project } = input;
  const direction = input.direction || "Adaptive art direction";
  const style = artDirection(direction, input.script);
  if(input.palette)style.palette=input.palette;
  const now = new Date().toISOString();
  let cursor = 0;
  const sentences = Array.from(new Intl.Segmenter("en", {granularity:"sentence"}).segment(input.script), s => s.segment.trim()).filter(Boolean);
  const sentenceBeats:Array<{text:string;refs:string[]}>=[];
  for(let i=0;i<sentences.length;i++){
    const refs=[`sentence_${i+1}`];let text=sentences[i];
    // Sparse direction combines adjacent explanatory sentences; evidence-heavy
    // stats, quotes, and product actions retain their own authored beat.
    if(/\bsparse\b/i.test(direction) && sentences.length>3 && i+1<sentences.length && familyFor(text)==="title" && familyFor(sentences[i+1])==="title"){refs.push(`sentence_${i+2}`);text+=` ${sentences[++i]}`;}
    sentenceBeats.push({text,refs});
  }
  const cues=project ? [] : parseTimestampedScript(input.script);
  if(cues.length)cursor=Math.max(...cues.map(c=>c.endSeconds));
  const beats = project?.motionPlan ? project.motionPlan.moments.filter(m => m.status !== "rejected" && m.startSeconds < project.duration && m.endSeconds>m.startSeconds).map(m => ({ id:m.id, text:m.transcriptExcerpt || m.content.headline, start:m.startSeconds, duration:m.endSeconds-m.startSeconds, avoid:m.layout.avoidRegions, region:m.layout.preferredRegion, refs:m.semanticSpanIds || [] })) : cues.length ? cues.map(c=>({id:c.id,text:c.originalText,start:c.startSeconds,duration:c.endSeconds-c.startSeconds,avoid:[] as string[],region:"",refs:[c.id]})) : sentenceBeats.map(({text,refs},i) => {
    const duration = Math.max(3.5, Math.min(12,text.split(/\s+/).length / 2.6));
    const beat = { id:`gs_${i+1}`, text, start:cursor, duration, avoid:[] as string[], region:"", refs }; cursor += duration; return beat;
  });
  if (!beats.length) throw new Error("No eligible visual beats. Create a motion plan or enter a script first.");
  const regions: Record<string, GraphicSpec["box"]> = {
    "upper-left":{x:.05,y:.07,width:.4,height:.33}, "upper-right":{x:.55,y:.07,width:.4,height:.33},
    "lower-left":{x:.05,y:.6,width:.4,height:.33}, "lower-right":{x:.55,y:.6,width:.4,height:.33},
    "right-center":{x:.56,y:.3,width:.39,height:.4}, "center":{x:.3,y:.15,width:.4,height:.7},
    "face":{x:.25,y:.05,width:.5,height:.75}, "subtitles":{x:0,y:.82,width:1,height:.18},
    "logo":{x:.8,y:.03,width:.15,height:.12},
  };
  let previousEnd = 0;
  let context:VisualEntity[]=[];
  const scenes = beats.slice(0,120).map((b,i):GraphicSpec => {
    const meaning=explainBeat(b.text,context);
    if(meaning?.visual.entities.length)context=[...meaning.visual.entities,...context].filter((e,index,all)=>all.findIndex(other=>other.id===e.id)===index).slice(0,12);
    const protectedRegions = b.avoid.map(r => regions[r] || (/face|speaker|portrait/.test(r) ? regions.face : /caption|subtitle/.test(r) ? regions.subtitles : {x:0,y:0,width:1,height:1}));
    const box = project ? [regions[b.region], ...Object.values(regions).slice(0,5),{x:.03,y:.08,width:.20,height:.65},{x:.77,y:.08,width:.20,height:.65}].filter(Boolean).find(r => !protectedRegions.some(p => intersects(r,p))) : {x:.07,y:.1,width:.86,height:.8};
    const duration = Math.max(.5, Math.min(120, b.duration, (project?.duration || Infinity) - b.start));
    const enabled = !!box && b.start >= previousEnd && b.duration >= .5;
    if (enabled) previousEnd = b.start+duration;
    return graphicSchema.parse({ version:ENGINE_VERSION,id:b.id,revision:1,family:meaning ? 'explainer' : familyFor(b.text),...(meaning ? {visual:meaning.visual}:{}),layout:i%3,source:{text:b.text,refs:b.refs},content:{...sourceContent(b.text),...(meaning?{title:meaning.headline}:{})},start:b.start,duration,
      box:box || regions["upper-left"], protectedRegions, style:meaning?{...style,finish:'glass',radius:24,material:/quiet|documentary|field/i.test(direction)?'none':materialForVisual(meaning.visual.kind),intensity:.45}:style, motion:{entry:Math.min(.65,duration*.2),exit:Math.min(.4,duration*.2),energy:/expressive|kinetic/i.test(direction) ? .8 : .35}, locks:{content:false,style:false,timing:!!project||cues.length>0}, enabled });
  });
  return planSchema.parse({version:ENGINE_VERSION,id:input.id,revision:1,createdAt:now,updatedAt:now,sourceText:input.script,projectId:project?.id || null,
    width:project?.width || (input.format === "short-form" ? 1080 : 1920),height:project?.height || (input.format === "short-form" ? 1920 : 1080),fps:project?.fps || 30,duration:project?.duration || cursor,direction,
    generation:{mode:"preset",provider:"MotionLayer semantic planner",note:`Contextual scenes with editable subjects and actions; palette: ${input.paletteSource || 'archived studio reference'}.`},scenes });
}
export function alternatives(scene: GraphicSpec): GraphicSpec[] {
  return [0,1,2].map(layout => ({ ...scene, layout:scene.locks.style ? scene.layout : layout }));
}

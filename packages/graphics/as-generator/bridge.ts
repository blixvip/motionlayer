import type {CSSProperties} from 'react';
import type {GraphicSpec,SceneVisual} from '../spec';
import {generateSpec,componentSourceFor,type ComponentKind} from './engine';

export const materialForVisual=(kind:SceneVisual['kind']):GraphicSpec['style']['material']=>({statement:'smoke',portrait:'smoke',network:'plasma',boundary:'edge',ecosystem:'metal',flow:'plasma'} as const)[kind];
export function generatedSceneRecipe(spec:GraphicSpec) {
  const kind:ComponentKind=spec.visual?.kind==='statement'||spec.visual?.kind==='portrait'?'profile':spec.visual?.kind==='boundary'?'alert':'card';
  const base=generateSpec(`An editorial ${kind} component`,1);
  const p=spec.style.palette;
  const recipe={...base,id:spec.id,prompt:spec.source.text,kind,title:spec.content.title,description:spec.content.detail,label:'',eyebrow:spec.visual?.qualifier||'',finish:spec.style.finish||'glass',radius:spec.style.radius??24,shader:spec.style.material==='none'?'plasma':spec.style.material,colors:[p.accent,p.secondary,p.ink,p.background],intensity:spec.style.intensity*100,speed:spec.style.speed*40};
  return {recipe,source:componentSourceFor(recipe)};
}
export function componentTokens(spec:GraphicSpec):CSSProperties {
  const {recipe}=generatedSceneRecipe(spec);
  return {'--drop-a':recipe.colors[0],'--drop-b':recipe.colors[1],'--drop-base':recipe.colors[3],'--drop-radius':`${recipe.radius}px`,'--drop-grain':'.035',width:'100%',height:'100%'} as CSSProperties;
}
export const componentClasses=(spec:GraphicSpec,classes:string)=>`${classes} finish-${spec.style.finish||'glass'}`;

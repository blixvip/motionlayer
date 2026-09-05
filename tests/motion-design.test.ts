import {describe,it,expect} from 'vitest';
import {displayExcerpt,layerMotion,paletteFromAccent,statisticCopy} from '../packages/graphics/design';
import {artDirection,createPlan} from '../packages/graphics/planner';
import {samplePixels,referencePalette} from '../lib/graphics/palette';
describe('reference-led motion design',()=>{
  it('retains chroma and removes repeated statistic information',()=>{const p=paletteFromAccent();expect(parseInt(p.accent.slice(5,7),16)-parseInt(p.accent.slice(1,3),16)).toBeGreaterThan(60);const c=createPlan({id:'gp_stat_copy',script:'The process takes 3 seconds.'}).scenes[0].content;expect(statisticCopy({...c,title:'The process takes 3 seconds.',value:'3 seconds',detail:'The process takes 3 seconds.'})).toEqual({title:'The process',detail:''});});
  it('never changes hue because a script mentions software',()=>{expect(artDirection('','A quiet idea.').palette).toEqual(artDirection('','A software dashboard app launch.').palette);});
  it('compresses long supers without discarding source evidence',()=>{const script='We bring every small detail together to make an idea real and share it with the world.';const plan=createPlan({id:'gp_design_test',script});expect(plan.scenes[0].content.title.split(/\s+/).length).toBeLessThanOrEqual(8);expect(plan.scenes[0].source.text).toBe(script);});
  it('keeps palettes coherent, tinted, and overridable',()=>{const palette=paletteFromAccent('#286fb7');expect(Object.values(palette)).not.toContain('#000000');expect(Object.values(palette)).not.toContain('#ffffff');const plan=createPlan({id:'gp_palette_test',script:'One useful thought. A second useful thought.',palette});expect(plan.scenes.every(s=>JSON.stringify(s.style.palette)===JSON.stringify(palette))).toBe(true);});
  it('samples chromatic pixels rather than skin or neutral fields',()=>{const data=new Uint8Array([170,110,70,170,110,70,220,220,220,35,80,180,35,80,180]);expect(samplePixels(data).accent).toBe('#2350b4');expect(samplePixels(new Uint8Array([130,130,130])).fallback).toBe(true);});
  it('has deterministic stagger and preserves short copy',()=>{expect(displayExcerpt('Make it matter.')).toBe('Make it matter.');expect(layerMotion(.4,.1)).not.toEqual(layerMotion(.4,.3));const state=layerMotion(1,.1);layerMotion(3,0);expect(layerMotion(1,.1)).toEqual(state);});
  it('rejects remote and unsupported reference input',async()=>{await expect(referencePalette('https://example.com/asset.png')).rejects.toThrow();await expect(referencePalette('data:image/svg+xml;base64,AAAA')).rejects.toThrow();});
});

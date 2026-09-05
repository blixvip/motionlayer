import { useLayoutEffect, useRef } from "react";
import { ShaderMount, getShaderColorFromString, getShaderNoiseTexture, pulsingBorderFragmentShader, meshGradientFragmentShader, metaballsFragmentShader, neuroNoiseFragmentShader, liquidMetalFragmentShader, gemSmokeFragmentShader, LiquidMetalShapes, GemSmokeShapes, PulsingBorderAspectRatios, type ShaderMountUniforms } from "@paper-design/shaders";
import type { GraphicSpec } from "./spec";

// Modified Paper 0.0.80 React uniform adapters: synchronous mount/seek, with all
// texture decoding completed before the composition timeline is published.
let noise:HTMLImageElement,empty:HTMLImageElement;
export async function prepareMaterials() {
  noise=getShaderNoiseTexture()!;
  empty=new Image();empty.src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
  await Promise.all([noise.decode(),empty.decode()]);
  empty.width=1024;empty.height=1024;
}
function materialConfig(style:GraphicSpec["style"]) {
  const p=style.palette,color=getShaderColorFromString;
  const uniforms:ShaderMountUniforms={u_fit:2,u_scale:1,u_rotation:0,u_offsetX:0,u_offsetY:0,u_originX:.5,u_originY:.5,u_worldWidth:0,u_worldHeight:0};
  const colors=[p.accent,p.secondary,p.ink].map(color);
  let fragment=meshGradientFragmentShader;
  switch(style.material) {
    case "edge":fragment=pulsingBorderFragmentShader;Object.assign(uniforms,{u_colorBack:color(p.background),u_colors:colors,u_colorsCount:3,u_roundness:.25,u_thickness:.07,u_marginLeft:.025,u_marginRight:.025,u_marginTop:.025,u_marginBottom:.025,u_aspectRatio:PulsingBorderAspectRatios.auto,u_softness:.15,u_intensity:.5,u_bloom:.2,u_spots:4,u_spotSize:.38,u_pulse:.12,u_smoke:.08,u_smokeSize:.2,u_noiseTexture:noise});break;
    case "liquid":fragment=metaballsFragmentShader;Object.assign(uniforms,{u_colorBack:color(p.background),u_colors:colors,u_colorsCount:3,u_size:.58,u_count:8,u_noiseTexture:noise});break;
    case "plasma":fragment=neuroNoiseFragmentShader;Object.assign(uniforms,{u_colorFront:color(p.accent),u_colorMid:color(p.secondary),u_colorBack:color(p.background),u_brightness:.58,u_contrast:.76,u_scale:1.12});break;
    case "metal":fragment=liquidMetalFragmentShader;Object.assign(uniforms,{u_colorBack:color(p.background),u_colorTint:color(p.accent),u_image:empty,u_contour:.32,u_distortion:.2,u_softness:.24,u_repetition:2.4,u_shiftRed:.06,u_shiftBlue:-.04,u_angle:72,u_isImage:false,u_shape:LiquidMetalShapes.none});break;
    case "smoke":fragment=gemSmokeFragmentShader;Object.assign(uniforms,{u_colors:colors,u_colorsCount:3,u_colorBack:color(p.background),u_colorInner:color(p.background),u_image:empty,u_innerDistortion:.54,u_outerDistortion:.36,u_outerGlow:.24,u_innerGlow:.76,u_offset:0,u_angle:0,u_size:.86,u_isImage:false,u_shape:GemSmokeShapes.none});break;
    default:Object.assign(uniforms,{u_colors:[p.background,p.accent,p.secondary].map(color),u_colorsCount:3,u_distortion:.72,u_swirl:.54,u_grainMixer:.05,u_grainOverlay:.025,u_scale:1.08});
  }
  return{fragment,uniforms};
}
export function Material({spec}:{spec:GraphicSpec}) {
  const element=useRef<HTMLDivElement>(null),mount=useRef<ShaderMount|null>(null);
  useLayoutEffect(()=>{
    if(spec.style.material==="none" || !element.current)return;
    const config=materialConfig(spec.style);
    mount.current=new ShaderMount(element.current,config.fragment,config.uniforms,{preserveDrawingBuffer:true},0,1800,1,1_600_000);
    return()=>{mount.current?.dispose();mount.current=null;};
    // Mount lifecycle follows the shader program, not the playback clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[spec.style.material]);
  useLayoutEffect(()=>{if(mount.current)mount.current.setUniforms(materialConfig(spec.style).uniforms);},[spec.style]);
  return spec.style.material==="none" ? null : <div ref={element} className="mg-material" style={{opacity:spec.style.intensity}} aria-hidden="true"/>;
}

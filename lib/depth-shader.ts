export const DEPTH_SHADER_SKILL_ID = "shader-craft:optical-paper-depth-v1";

export function depthShaderMarkup(width: number, height: number) {
  return `<canvas id="motionlayer-depth-shader" class="depth-shader" width="${Math.round(width / 2)}" height="${Math.round(height / 2)}" aria-hidden="true"></canvas>`;
}

export const depthShaderCss = `.depth-shader{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}.scene{z-index:1}.paper{background-color:rgba(238,234,222,.91)}.capture-stage,.source-browser,.code-sheet,.terminal,.api-ticket,.ticket,.free{filter:drop-shadow(0 28px 34px rgba(17,18,15,.18))}@media(min-aspect-ratio:1/1){.stat-label{line-height:1!important}.switch-copy h1{line-height:1.35!important}}`;

export const DEPTH_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 outColor;
float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
void main(){
  vec2 uv=(gl_FragCoord.xy*2.0-u_resolution)/min(u_resolution.x,u_resolution.y);
  float t=mod(u_time,3600.0);
  float foldA=sin(uv.x*2.15+uv.y*1.28+t*0.17);
  float foldB=sin(uv.x*-1.36+uv.y*2.72-t*0.11+1.7);
  float paper=0.5+0.25*foldA+0.18*foldB;
  float keyCenter=sin(t*0.13)*0.42;
  float key=exp(-abs(uv.x*0.72+uv.y*0.31-keyCenter)*2.4);
  float edge=1.0-smoothstep(0.18,1.42,length(uv*vec2(0.72,0.86)));
  vec3 neutral=vec3(0.955,0.948,0.918);
  vec3 lime=vec3(0.61,0.76,0.24);
  vec3 col=neutral-mix(vec3(0.0),vec3(0.035),paper);
  col=mix(col,lime,key*0.105);
  col*=0.965+edge*0.035;
  col+=(hash21(gl_FragCoord.xy+fract(t))-0.5)/255.0;
  outColor=vec4(clamp(col,0.0,1.0),1.0);
}`;

export function depthShaderRuntime(duration: number) {
  return `(function(){
const canvas=document.getElementById("motionlayer-depth-shader");
if(!canvas)return;
const gl=canvas.getContext("webgl2",{alpha:true,antialias:false,depth:false,preserveDrawingBuffer:true});
if(!gl){canvas.style.display="none";return;}
const vertex="#version 300 es\\nvoid main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.0-1.0,0.0,1.0);}";
const fragment=${JSON.stringify(DEPTH_FRAGMENT_SHADER)};
function compile(type,source){const shader=gl.createShader(type);if(!shader)return null;gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))return null;return shader;}
const vs=compile(gl.VERTEX_SHADER,vertex);const fs=compile(gl.FRAGMENT_SHADER,fragment);
if(!vs||!fs){canvas.style.display="none";return;}
const program=gl.createProgram();if(!program){canvas.style.display="none";return;}
gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
if(!gl.getProgramParameter(program,gl.LINK_STATUS)){canvas.style.display="none";return;}
gl.useProgram(program);gl.viewport(0,0,canvas.width,canvas.height);
const resolution=gl.getUniformLocation(program,"u_resolution");const time=gl.getUniformLocation(program,"u_time");
function draw(value){gl.uniform2f(resolution,canvas.width,canvas.height);gl.uniform1f(time,value);gl.drawArrays(gl.TRIANGLES,0,3);}
const depthState={time:0};draw(0);
tl.to(depthState,{time:${duration.toFixed(3)},duration:${duration.toFixed(3)},ease:"none",onUpdate:()=>draw(depthState.time)},0);
})();`;
}

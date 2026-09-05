import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Graphic } from "./Graphic";
import { prepareMaterials } from "./Material";
import { motionAt, sceneAt, planSchema, type GraphicsPlan } from "./spec";

type ShaderElement = HTMLElement & { paperShaderMount?: { setFrame(n:number):void; setSpeed(n:number):void; dispose():void } };
type Timeline = { to(target:object, vars:object):Timeline; seek(n:number,suppress?:boolean):Timeline; time():number; kill():void };
declare global { interface Window { gsap:{timeline(options:object):Timeline}; __timelines:Record<string,Timeline>; __graphics:{seek(n:number):void;dispose():void;ready:boolean;error?:string}; } }

export async function mount(plan: GraphicsPlan, options: { overlay?:boolean; preview?:boolean } = {}) {
  const container = document.getElementById("graphics-root")!;
  const stage = document.getElementById("stage")!;
  const root = createRoot(container,{onUncaughtError:error=>{failed=String(error);if(window.__graphics)window.__graphics.error=failed;}});
  let fallback = false, failed = "", fittedKey="", fittedScale=1;
  const report = (error:string) => { failed=error; window.__graphics.error=error; if(options.preview) { fallback=true; parent.postMessage({type:"graphics-error",error},location.origin); } else { throw new Error(error); } };
  function seek(seconds:number) {
    const scene = sceneAt(plan, seconds);
    stage.style.background = options.overlay ? "transparent" : (scene?.style.palette.background || plan.scenes[0].style.palette.background);
    flushSync(() => root.render(scene ? <Graphic key={`${scene.id}:${scene.style.material}`} spec={scene} seconds={seconds-scene.start} overlay={options.overlay} portrait={plan.height>plan.width} fallback={fallback} /> : null));
    if(failed && !fallback) {report(failed);if(options.preview)flushSync(()=>root.render(scene ? <Graphic spec={scene} seconds={seconds-scene.start} overlay={options.overlay} portrait={plan.height>plan.width} fallback/> : null));}
    if(scene) {
      const key=JSON.stringify(scene);
      if(key!==fittedKey) {
        fittedKey=key;
        // Measure a settled pose, so visiting a scene at its entrance or midpoint
        // cannot produce different typography on later seeks.
        flushSync(()=>root.render(<Graphic key={`${scene.id}:${scene.style.material}`} spec={scene} seconds={Math.min(2,scene.duration*.5)} overlay={options.overlay} portrait={plan.height>plan.width} fallback={fallback}/>));
        const article=container.querySelector<HTMLElement>(".mg-graphic");
        const content=container.querySelector<HTMLElement>(".mg-content");
        // Resolve content fit once per edited scene, never during tween interpolation.
        let scale=scene.style.typeScale;
        for(let pass=0;article && content && pass<5;pass++) {
          article.style.setProperty("--mg-type",String(scale));
          // Decorative orbits and bridges deliberately extend past their boxes.
          // Fit explanation text against its own space, not those moving shapes.
          const heading=content.querySelector<HTMLElement>('.ex-heading');
          const statement=content.querySelector<HTMLElement>('.ag-message-group');
          const statementSpace=plan.height>plan.width?content.clientHeight*.48:content.clientHeight;
          const textFits=Array.from(content.querySelectorAll<HTMLElement>('h1,h2,.ag-quote h3')).every(element=>element.scrollWidth<=element.clientWidth+2) && (!heading || (heading.querySelector('h1')?.scrollHeight || 0)<=heading.clientHeight+2) && (!statement || statement.scrollHeight<=statementSpace+2);
          if(scene.visual ? textFits : content.scrollHeight<=content.clientHeight+2 && content.scrollWidth<=content.clientWidth+2)break;
          scale*=.88;
        }
        fittedScale=scale;
        flushSync(()=>root.render(<Graphic key={`${scene.id}:${scene.style.material}`} spec={scene} seconds={seconds-scene.start} overlay={options.overlay} portrait={plan.height>plan.width} fallback={fallback}/>));
      }
      container.querySelector<HTMLElement>(".mg-graphic")?.style.setProperty("--mg-type",String(fittedScale));
    } else fittedKey="";
    if(scene && scene.style.material !== "none" && !fallback) {
      const element = container.querySelector<ShaderElement>(".mg-material");
      if(element?.paperShaderMount) { element.paperShaderMount.setSpeed(0); element.paperShaderMount.setFrame(motionAt(scene,seconds-scene.start).frame); }
      else if(window.__graphics.ready) report("Shader unavailable. Preview fallback only; export requires working WebGL2.");
    }
  }
  window.__graphics={ready:false,seek,dispose:()=>{root.unmount();window.__timelines["motionlayer-graphics"]?.kill();}};
  container.addEventListener("webglcontextlost", () => report("WebGL context lost. Reload the preview or retry the export."),true);
  const hero=new Image();hero.src='assets/idea-flight.png';
  const entityImages=[...new Set(plan.scenes.flatMap(s=>s.visual?.entities.flatMap(e=>e.asset?[e.asset.file]:[]) || []))].map(file=>{const image=new Image();image.src=`assets/entities/${file}`;return image.decode();});
  await Promise.all([document.fonts.load('600 64px "Motion Display"'),document.fonts.load('italic 400 64px "Motion Accent"'),document.fonts.load('650 64px "Motion Grotesk"'),document.fonts.load('400 64px "Motion Humanist"'),hero.decode(),...entityImages,prepareMaterials()]);
  // Mount once to initialize the DOM and WebGL before publishing the timeline.
  seek(0);
  // Never wait for rAF here: the exporter freezes animation callbacks while
  // waiting for timeline registration. Paper mounts synchronously after decode.
  window.__graphics.ready=true;
  seek(0);
  const clock={seconds:0};
  const timeline=window.gsap.timeline({paused:true});
  timeline.to(clock,{seconds:plan.duration,duration:plan.duration,ease:"none",onUpdate:()=>seek(clock.seconds)});
  window.__timelines=window.__timelines || {};
  window.__timelines["motionlayer-graphics"]=timeline;
  if(options.preview) {
    window.addEventListener("message",event=>{
      if(event.source!==parent || event.origin!==location.origin)return;
      if(event.data?.type==="graphics-update") {const parsed=planSchema.safeParse(event.data.plan);if(parsed.success){plan=parsed.data;seek(Number.isFinite(event.data.seconds) ? event.data.seconds : 0);}}
      if(event.data?.type==="graphics-seek" && Number.isFinite(event.data.seconds)) { timeline.seek(event.data.seconds,false); seek(event.data.seconds); }
    });
    parent.postMessage({type:"graphics-ready",error:failed},location.origin);
  }
}

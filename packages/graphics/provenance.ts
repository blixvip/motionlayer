import { ENGINE_VERSION, UPSTREAM_REVISION } from "./spec";
import asGeneratorReceipt from './as-generator/receipt.json';
export const provenance = {
  engine: { name:"MotionLayer graphics", version:ENGINE_VERSION, upstream:"asGenerator", revision:UPSTREAM_REVISION, acquisition:asGeneratorReceipt.acquisition,sourceHash:asGeneratorReceipt.sha256 },
  component: { name:"asGenerator profile, card, alert, and badge exports", source:"as-generator/src/generator.ts#sourceBundle", acquisition:"Actual sourceBundle output with typed media/material slots. Local source engine and generated modules are included in every export.", license:asGeneratorReceipt.license },
  asGenerator:asGeneratorReceipt,
  shader: { name:"Paper Shaders", source:"https://github.com/paper-design/shaders/tree/v0.0.80", documentation:"https://shaders.paper.design", version:"0.0.80", license:"Apache-2.0", acquisition:"Pinned npm packages @paper-design/shaders and @paper-design/shaders-react", effects:{edge:"PulsingBorder",aurora:"MeshGradient",liquid:"Metaballs",plasma:"NeuroNoise",metal:"LiquidMetal",smoke:"GemSmoke"} },
  timing: "One paused GSAP timeline; shader speed=0 and setFrame(1800 + sceneSeconds * 1000 * speed). Product interactions are authored demonstrations, not product integrations.",
};

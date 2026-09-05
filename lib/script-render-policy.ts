export const SCRIPT_RENDER_POLICY = {
  id: "motionlayer-style-directed-render-v5",
  label: "Style-directed render",
  quality: "standard",
  workers: "auto",
  nativeAspectLayouts: true,
  wordCheckRequired: true,
  localAssetsOnly: true,
  validationRequired: true,
  motionLanguage: "authored-editorial-grammar",
  depthPass: "deterministic-webgl-paper-light",
  skills: [
    "hyperframes",
    "hyperframes-core",
    "hyperframes-creative",
    "hyperframes-animation",
    "hyperframes-keyframes",
    "hyperframes-registry",
    "motion-graphics",
    "media-use",
    "shader-craft",
  ],
  guarantees: [
    "Word check before scene planning",
    "Native 16:9 and 9:16 composition",
    "Official or frozen local assets",
    "Layered motion with deterministic depth shader",
    "Persistent style profile and anti-slop constraints",
    "Semantic scene roles prevent repeated title cards",
    "HyperFrames lint and runtime validation",
  ],
} as const;

export type ScriptRenderProfile = typeof SCRIPT_RENDER_POLICY;

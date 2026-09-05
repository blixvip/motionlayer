import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { delimiter, join, resolve } from "node:path";
import { getLocalFfmpegPaths } from "./local-transcription";
import { compileDesignContract } from "./design-contract";
import { analyzeScriptCopy, parseTimestampedScript } from "./script-understanding";
import { analyzeSemanticTranscript } from "./semantic-analysis";
import { editorialCompositionHtml } from "./editorial-script-video";
import { SCRIPT_RENDER_POLICY } from "./script-render-policy";
import { ANTI_SLOP_CONSTRAINTS, getStyleDirectorProfile, referenceMode, resolveStyleDirection, styleDirectionReceipt, type StyleDirection } from "./style-director";

export type ScriptVideoScene = {
  id: string;
  text: string;
  accent: string;
  start: number;
  duration: number;
  variant: number;
  kind?: "kinetic-hook" | "source-card" | "model-positioning" | "stat-count" | "agent-switch" | "api-workflow" | "cta" | "generic" | "editorial-statement" | "editorial-contrast" | "editorial-sequence" | "editorial-proof" | "editorial-close";
  kicker?: string;
  detail?: string;
};

export type ScriptVideoFormat = "landscape" | "short-form";

export function scriptVideoDimensions(format: ScriptVideoFormat) {
  return format === "short-form" ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
}

const scriptVideosRoot = resolve(process.cwd(), "data", "script-videos");

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function chunkWords(words: string[], size: number) {
  const chunks: string[][] = [];
  for (let index = 0; index < words.length; index += size) chunks.push(words.slice(index, index + size));
  return chunks;
}

const stopWords = new Set(["the", "and", "that", "this", "with", "from", "your", "into", "then", "than", "they", "their", "have", "will", "when", "what", "where", "which", "just", "does", "are", "was", "were", "for", "you", "but", "not"]);

function meaningfulAccent(words: string[]) {
  const cleaned = words.map((word) => word.replace(/[^\p{L}\p{N}%$.-]/gu, "")).filter(Boolean);
  const numeric = cleaned.find((word) => /(?:\d|%|\$)/.test(word));
  if (numeric) return numeric;
  return [...cleaned].reverse().find((word) => word.length > 4 && !stopWords.has(word.toLowerCase())) ?? cleaned.at(-1) ?? "Now";
}

function editorialKind(text: string, index: number, total: number): NonNullable<ScriptVideoScene["kind"]> {
  if (index === total - 1 && total > 1) return "editorial-close";
  if (/(?:\$|\d[\d,.]*|\d+%)/.test(text)) return "editorial-proof";
  if (/\b(?:but|instead|versus|vs\.?|while|rather than|however)\b/i.test(text)) return "editorial-contrast";
  const sequenceMarkers = text.match(/\b(?:first|second|third|step\s*[123]|then|next|finally)\b/gi) ?? [];
  if (sequenceMarkers.length >= 2 || /→|->/.test(text)) return "editorial-sequence";
  return "editorial-statement";
}

function kickerForKind(kind: NonNullable<ScriptVideoScene["kind"]>) {
  return ({ "editorial-statement": "THESIS", "editorial-contrast": "CONTRAST", "editorial-sequence": "SEQUENCE", "editorial-proof": "PROOF", "editorial-close": "TAKEAWAY" } as Partial<Record<NonNullable<ScriptVideoScene["kind"]>, string>>)[kind] ?? "SCRIPT VISUAL";
}

function scenesFromTimestampedCues(cues: ReturnType<typeof parseTimestampedScript>, direction: StyleDirection) {
  const scenes: ScriptVideoScene[] = [];
  const noteMode = referenceMode(direction);
  const effectiveDensity = noteMode === "quiet" ? "sparse" : noteMode === "kinetic" ? "balanced" : direction.density;
  for (const cue of cues) {
    const words = cue.checkedText.split(" ").filter(Boolean);
    const chunkSize = effectiveDensity === "sparse" ? 24 : 16;
    const chunks = words.length <= chunkSize ? [words] : chunkWords(words, chunkSize);
    const cueDuration = cue.endSeconds - cue.startSeconds;
    let consumedWords = 0;
    for (const chunk of chunks) {
      const start = cue.startSeconds + cueDuration * (consumedWords / words.length);
      consumedWords += chunk.length;
      const end = cue.startSeconds + cueDuration * (consumedWords / words.length);
      scenes.push({
        id: `scene-${scenes.length + 1}`,
        text: chunk.join(" "),
        accent: meaningfulAccent(chunk),
        start: Number(start.toFixed(3)),
        duration: Number(Math.max(0.1, end - start).toFixed(3)),
        variant: scenes.length % 4,
        kind: "editorial-statement",
      });
    }
  }
  scenes.forEach((scene, index) => { scene.kind = editorialKind(scene.text, index, scenes.length); scene.kicker = kickerForKind(scene.kind); });
  return scenes;
}

function nvidiaKimiScenes(): ScriptVideoScene[] {
  return [
    { id: "scene-1", text: "NVIDIA × KIMI K3", accent: "FREE ENDPOINT", start: 0, duration: 6, variant: 0, kind: "kinetic-hook", kicker: "OPEN MODEL ACCESS", detail: "A coding-agent alternative" },
    { id: "scene-2", text: "KIMI K3", accent: "FREE ENDPOINT", start: 7, duration: 10, variant: 1, kind: "source-card", kicker: "BUILD.NVIDIA.COM", detail: "Official model listing · August 2026" },
    { id: "scene-3", text: "TOP-TIER CODING MODEL", accent: "KIMI K3", start: 17, duration: 7, variant: 2, kind: "model-positioning", kicker: "MODEL POSITIONING", detail: "Unclear competitor names held for review" },
    { id: "scene-4", text: "REQUESTS / DAY", accent: "60", start: 24, duration: 6, variant: 3, kind: "stat-count", kicker: "ACCOUNT LIMIT", detail: "Narrator claim · verify in your account" },
    { id: "scene-5", text: "ONE KEY. MULTIPLE AGENTS.", accent: "API", start: 30, duration: 6, variant: 0, kind: "agent-switch", kicker: "CODEX · CLAUDE CODE", detail: "Use a compatible coding client" },
    { id: "scene-6", text: "ACCOUNT → API KEY → .ENV", accent: "OPENCODE", start: 36, duration: 12, variant: 1, kind: "api-workflow", kicker: "SETUP FLOW", detail: "Copy the key into your environment" },
    { id: "scene-7", text: "LINK IN BIO", accent: "GO", start: 48, duration: 2, variant: 2, kind: "cta", kicker: "BUILD.NVIDIA.COM", detail: "" },
  ];
}

export function scenesFromScript(script: string, directionInput?: Partial<StyleDirection>): ScriptVideoScene[] {
  const direction = resolveStyleDirection(directionInput);
  const noteMode = referenceMode(direction);
  const understanding = analyzeScriptCopy(script);
  if (understanding.topic === "nvidia-kimi-k3") return nvidiaKimiScenes();
  const cues = parseTimestampedScript(script);
  if (cues.length) return scenesFromTimestampedCues(cues, direction);
  const normalized = script.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const sentences = Array.from(
    new Intl.Segmenter("en", { granularity: "sentence" }).segment(normalized),
    ({ segment }) => segment.trim(),
  ).filter(Boolean);
  const effectiveDensity = noteMode === "quiet" ? "sparse" : noteMode === "kinetic" ? "balanced" : direction.density;
  const chunkSize = effectiveDensity === "sparse" ? 24 : 16;
  const phrases = sentences.flatMap((sentence) => {
    const words = sentence.split(" ").filter(Boolean);
    return words.length <= chunkSize ? [words] : chunkWords(words, chunkSize);
  });
  let cursor = 0;
  return phrases.map((words, index) => {
    const duration = Number(clamp(2.8 + words.length * 0.12, 3.4, 5.2).toFixed(2));
    const kind = editorialKind(words.join(" "), index, phrases.length);
    const scene: ScriptVideoScene = {
      id: `scene-${index + 1}`,
      text: words.join(" "),
      accent: meaningfulAccent(words),
      start: Number(cursor.toFixed(2)),
      duration,
      variant: index % 4,
      kind,
      kicker: kickerForKind(kind),
    };
    cursor += duration;
    return scene;
  });
}

function sceneMarkup(scene: ScriptVideoScene, index: number) {
  const words = scene.text.split(" ");
  const wordMarkup = words.map((word, wordIndex) => `<span id="word-${index}-${wordIndex}">${escapeHtml(word)}</span>`).join(" ");
  const kind = scene.kind ?? "generic";
  const bodies: Record<string, string> = {
    "kinetic-hook": `<div class="content-layer hook-layout"><div id="logos-${index}" class="brand-pair"><div class="brand-tile nvidia-tile"><img src="assets/nvidia.svg" alt="NVIDIA"><b>NVIDIA</b></div><div class="join-mark">×</div><div class="brand-tile kimi-tile"><img src="assets/moonshot.svg" alt="Moonshot AI"><b>KIMI K3</b></div></div><div class="hook-copy"><p>${escapeHtml(scene.kicker ?? "")}</p><h1 id="title-${index}">${wordMarkup}</h1><div class="endpoint-badge"><i></i>${escapeHtml(scene.accent)}</div></div></div>`,
    "source-card": `<div class="content-layer source-layout"><div class="source-copy"><p>${escapeHtml(scene.kicker ?? "")}</p><h1>${escapeHtml(scene.text)}</h1><h3>${escapeHtml(scene.accent)}</h3><div class="source-proof"><span>OFFICIAL LISTING</span><b>${escapeHtml(scene.detail ?? "")}</b></div></div><div id="browser-${index}" class="source-browser"><header><i></i><i></i><i></i><strong>build.nvidia.com/models</strong></header><div class="browser-body"><div class="catalog-head"><img src="assets/nvidia.svg" alt="NVIDIA"><span>MODEL CATALOG</span></div><div class="model-row muted-row"><b>Reasoning model</b><span>API</span></div><div class="model-row hero-row"><div><img src="assets/moonshot.svg" alt="Moonshot AI"><b>moonshotai / kimi-k3</b></div><span>FREE ENDPOINT</span></div><div class="model-row muted-row"><b>Multimodal model</b><span>API</span></div></div></div></div>`,
    "model-positioning": `<div class="content-layer position-layout"><div class="model-emblem"><img src="assets/moonshot.svg" alt="Moonshot AI"><span>K3</span></div><div class="position-copy"><p>${escapeHtml(scene.kicker ?? "")}</p><h1>${escapeHtml(scene.text)}</h1><h3>${escapeHtml(scene.accent)}</h3></div><div class="review-lane"><small>WORD CHECK</small><strong>2 comparison names</strong><span>HELD FOR REVIEW</span><div class="redacted"></div><div class="redacted short"></div></div></div>`,
    "stat-count": `<div class="content-layer stat-layout"><div class="stat-copy"><p>${escapeHtml(scene.kicker ?? "")}</p><div class="counter-wrap"><span id="counter-${index}" class="counter">0</span><span class="counter-suffix">/ DAY</span></div><h1>${escapeHtml(scene.text)}</h1><small>${escapeHtml(scene.detail ?? "")}</small></div><div class="bars" aria-hidden="true"><i style="height:28%"></i><i style="height:42%"></i><i style="height:55%"></i><i style="height:72%"></i><i style="height:88%"></i><i style="height:100%"></i></div><div class="fact-chip">FACT REVIEW</div></div>`,
    "agent-switch": `<div class="content-layer agent-layout"><div class="agent-copy"><p>${escapeHtml(scene.kicker ?? "")}</p><h1>${escapeHtml(scene.text)}</h1><small>${escapeHtml(scene.detail ?? "")}</small></div><div class="agent-network"><div id="agent-a-${index}" class="agent-node"><span>01</span><b>CODEX</b></div><div class="api-core"><i></i><strong>${escapeHtml(scene.accent)}</strong><small>KEY</small></div><div id="agent-b-${index}" class="agent-node"><span>02</span><b>CLAUDE CODE</b></div><div id="network-line-${index}" class="network-line"></div></div></div>`,
    "api-workflow": `<div class="content-layer workflow-layout"><div class="workflow-copy"><p>${escapeHtml(scene.kicker ?? "")}</p><h1>${escapeHtml(scene.text)}</h1><small>${escapeHtml(scene.detail ?? "")}</small><div class="flow-steps"><div class="flow-step"><b>01</b><span>CREATE ACCOUNT</span></div><div class="flow-step"><b>02</b><span>GET API KEY</span></div><div class="flow-step"><b>03</b><span>ADD TO .ENV</span></div></div></div><div id="terminal-${index}" class="terminal"><header><span></span><span></span><span></span><b>opencode · .env</b></header><div class="terminal-body"><p class="terminal-line"><i>$</i> touch .env</p><p class="terminal-line"><i>+</i> NVIDIA_API_KEY=</p><div id="env-key-${index}" class="env-key">nvapi-••••••••••••</div><p class="terminal-line success"><i>✓</i> provider ready</p></div><svg id="cursor-${index}" class="cursor" viewBox="0 0 32 40"><path d="M3 2v30l8-8 6 13 6-3-6-12h11z"/></svg><div id="ripple-${index}" class="click-ripple"></div></div></div>`,
    "cta": `<div class="content-layer cta-layout"><div class="cta-kicker">${escapeHtml(scene.kicker ?? "")}</div><h1>${wordMarkup}</h1><div class="cta-arrow">↗</div><div class="cta-rule"></div></div>`,
    generic: `<div class="content-layer generic-layout"><p>${escapeHtml(scene.kicker ?? "MOTIONLAYER")}</p><h1>${wordMarkup}</h1><div class="endpoint-badge"><i></i>${escapeHtml(scene.accent)}</div></div>`,
  };
  return `<section id="${scene.id}" class="scene clip kind-${kind} variant-${scene.variant}" data-start="${scene.start}" data-duration="${scene.duration}" data-track-index="1"><div class="scene-world" data-layout-allow-overflow><div class="background-layer"><div id="glow-${index}" class="radial-glow"></div><div id="orbit-${index}" class="orbit"></div><div class="ghost-index" aria-hidden="true" data-layout-allow-occlusion>${String(index + 1).padStart(2, "0")}</div></div><div class="frame-meta"><span>MOTIONLAYER / SEMANTIC CUT</span><b>${scene.start.toFixed(0).padStart(2, "0")}:${(scene.start + scene.duration).toFixed(0).padStart(2, "0")}</b></div>${bodies[kind] ?? bodies.generic}<div class="scene-footer"><span>${escapeHtml(scene.detail ?? "SOURCE-LINKED MOTION")}</span><i id="rail-${index}"></i></div></div></section>`;
}

function animationMarkup(scene: ScriptVideoScene, index: number) {
  const entrance = scene.start + 0.16;
  const exit = Math.max(entrance + 1, scene.start + scene.duration - 0.34);
  const common = `tl.fromTo("#rail-${index}",{scaleX:0},{scaleX:1,duration:${Math.max(.8, scene.duration - .45)},ease:"none",immediateRender:false},${entrance});tl.fromTo("#glow-${index}",{scale:.82,opacity:.18},{scale:1.08,opacity:.42,duration:${Math.max(1.2, scene.duration - .3)},ease:"sine.inOut",immediateRender:false},${entrance});tl.fromTo("#orbit-${index}",{rotation:-8},{rotation:18,duration:${Math.max(1.2, scene.duration - .2)},ease:"sine.inOut",immediateRender:false},${entrance});`;
  const exits = `tl.to("#${scene.id} .content-layer",{opacity:0,x:${scene.variant % 2 ? -90 : 90},filter:"blur(22px)",duration:.28,ease:"power3.in"},${exit});`;
  const kind = scene.kind ?? "generic";
  if (kind === "kinetic-hook") {
    const wordEntries = scene.text.split(" ").map((_, wordIndex) => { const at = entrance + .22 + wordIndex * .14; const travel = wordIndex === 0 ? 80 : wordIndex === 2 ? 68 : 44; const duration = wordIndex === 0 ? .2 : .15; return `tl.set("#word-${index}-${wordIndex}",{opacity:1,y:${travel}},${at});tl.to("#word-${index}-${wordIndex}",{y:0,duration:${duration},ease:"power4.out"},${at});`; }).join("");
    return `${common}tl.fromTo("#logos-${index}",{opacity:0,x:-130,rotation:-4},{opacity:1,x:0,rotation:0,duration:.72,ease:"expo.out",immediateRender:false},${entrance});${wordEntries}tl.fromTo("#${scene.id} .endpoint-badge",{opacity:0,scale:.72},{opacity:1,scale:1,duration:.42,ease:"back.out(1.6)",immediateRender:false},${entrance + .9});${exits}`;
  }
  if (kind === "source-card") return `${common}tl.fromTo("#${scene.id} .source-copy",{opacity:0,x:-100},{opacity:1,x:0,duration:.62,ease:"expo.out",immediateRender:false},${entrance});tl.fromTo("#browser-${index}",{opacity:0,x:150,rotationY:-12,scale:.9},{opacity:1,x:0,rotationY:0,scale:1,duration:.82,ease:"power3.out",immediateRender:false},${entrance + .18});tl.fromTo("#browser-${index} .model-row",{opacity:0,y:36},{opacity:1,y:0,duration:.38,stagger:.12,ease:"power4.out",immediateRender:false},${entrance + .64});tl.fromTo("#browser-${index} .hero-row",{boxShadow:"0 0 0 rgba(118,185,0,0)"},{boxShadow:"0 0 54px rgba(118,185,0,.34)",duration:1.1,yoyo:true,repeat:4,ease:"sine.inOut",immediateRender:false},${entrance + 1.1});${exits}`;
  if (kind === "model-positioning") return `${common}tl.fromTo("#${scene.id} .model-emblem",{opacity:0,scale:.35,rotation:-18},{opacity:1,scale:1,rotation:0,duration:.72,ease:"back.out(1.45)",immediateRender:false},${entrance});tl.fromTo("#${scene.id} .position-copy",{opacity:0,x:110},{opacity:1,x:0,duration:.64,ease:"expo.out",immediateRender:false},${entrance + .22});tl.fromTo("#${scene.id} .review-lane",{opacity:0,y:70},{opacity:1,y:0,duration:.55,ease:"power3.out",immediateRender:false},${entrance + .72});tl.fromTo("#${scene.id} .redacted",{scaleX:0},{scaleX:1,duration:.48,stagger:.1,ease:"power4.out",immediateRender:false},${entrance + 1.05});${exits}`;
  if (kind === "stat-count") return `${common}const countState${index}={value:0};const counter${index}=document.getElementById("counter-${index}");tl.to(countState${index},{value:60,duration:1.65,ease:"power3.out",onUpdate:()=>{counter${index}.textContent=Math.round(countState${index}.value).toLocaleString();}},${entrance + .25});tl.fromTo("#counter-${index}",{scale:.48},{scale:1,duration:1.65,ease:"power3.out",immediateRender:false},${entrance + .25});tl.fromTo("#${scene.id} .counter-suffix",{opacity:0,y:28},{opacity:1,y:0,duration:.42,ease:"back.out(1.5)",immediateRender:false},${entrance + 1.9});tl.fromTo("#${scene.id} .bars i",{scaleY:0},{scaleY:1,duration:1.1,stagger:.09,ease:"power3.out",immediateRender:false},${entrance + .55});tl.fromTo("#${scene.id} .fact-chip",{opacity:0,x:60},{opacity:1,x:0,duration:.36,ease:"power4.out",immediateRender:false},${entrance + 1.1});${exits}`;
  if (kind === "agent-switch") return `${common}tl.fromTo("#${scene.id} .agent-copy",{opacity:0,y:90},{opacity:1,y:0,duration:.58,ease:"expo.out",immediateRender:false},${entrance});tl.fromTo("#agent-a-${index}",{opacity:0,x:-180,rotation:-7},{opacity:1,x:0,rotation:0,duration:.64,ease:"power4.out",immediateRender:false},${entrance + .36});tl.fromTo("#agent-b-${index}",{opacity:0,x:180,rotation:7},{opacity:1,x:0,rotation:0,duration:.64,ease:"power4.out",immediateRender:false},${entrance + .48});tl.fromTo("#network-line-${index}",{scaleX:0},{scaleX:1,duration:.72,ease:"power2.inOut",immediateRender:false},${entrance + .72});tl.fromTo("#${scene.id} .api-core",{opacity:0,scale:0},{opacity:1,scale:1,duration:.44,ease:"back.out(1.7)",immediateRender:false},${entrance + 1.08});${exits}`;
  if (kind === "api-workflow") return `${common}tl.fromTo("#${scene.id} .workflow-copy",{opacity:0,x:-100},{opacity:1,x:0,duration:.6,ease:"expo.out",immediateRender:false},${entrance});tl.fromTo("#${scene.id} .flow-step",{opacity:0,x:-60},{opacity:1,x:0,duration:.36,stagger:.16,ease:"power4.out",immediateRender:false},${entrance + .55});tl.fromTo("#terminal-${index}",{opacity:0,x:150,rotationY:-8,scale:.92},{opacity:1,x:0,rotationY:0,scale:1,duration:.78,ease:"power3.out",immediateRender:false},${entrance + .3});tl.fromTo("#terminal-${index} .terminal-line",{opacity:0,y:22},{opacity:1,y:0,duration:.28,stagger:.62,ease:"power2.out",immediateRender:false},${entrance + 1.15});tl.fromTo("#env-key-${index}",{opacity:0,scaleX:.55},{opacity:1,scaleX:1,duration:.46,ease:"expo.out",immediateRender:false},${entrance + 2.05});tl.fromTo("#cursor-${index}",{opacity:0,x:40,y:250},{opacity:1,x:245,y:147,duration:.8,ease:"power2.inOut",immediateRender:false},${entrance + 2.55});tl.to(["#cursor-${index}","#env-key-${index}"],{scale:.92,duration:.09,ease:"power2.in",yoyo:true,repeat:1},${entrance + 3.38});tl.fromTo("#ripple-${index}",{opacity:.9,scale:0},{opacity:0,scale:5,duration:.72,ease:"power3.out",immediateRender:false},${entrance + 3.48});${exits}`;
  if (kind === "cta") return `${common}tl.fromTo("#${scene.id} .cta-kicker",{opacity:0,x:-80},{opacity:1,x:0,duration:.28,ease:"power4.out",immediateRender:false},${entrance});tl.fromTo("#${scene.id} h1 span",{opacity:0,y:80},{opacity:1,y:0,duration:.22,stagger:.055,ease:"power4.out",immediateRender:false},${entrance + .08});tl.fromTo("#${scene.id} .cta-arrow",{opacity:0,scale:0,rotation:-45},{opacity:1,scale:1,rotation:0,duration:.3,ease:"back.out(1.8)",immediateRender:false},${entrance + .36});`;
  return `${common}tl.fromTo("#${scene.id} .content-layer",{opacity:0,y:70},{opacity:1,y:0,duration:.55,ease:"expo.out",immediateRender:false},${entrance});${exits}`;
}

function compositionHtml(scenes: ScriptVideoScene[]) {
  const duration = scenes.reduce((total, scene) => Math.max(total, scene.start + scene.duration), 0);
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=1920,height=1080"><title>MotionLayer directed script video</title><style>
  @font-face{font-family:Inter;src:url("fonts/Inter-400-latin.woff2") format("woff2");font-weight:400;font-display:block}@font-face{font-family:Inter;src:url("fonts/Inter-700-latin.woff2") format("woff2");font-weight:700;font-display:block}
  :root{--bg:#090c0b;--fg:#f2f5ee;--muted:#9ca79f;--accent:#76b900;--panel:#121714;--line:rgba(224,235,226,.18)}*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:var(--bg);color:var(--fg);font-family:Inter,sans-serif}#motionlayer-script,.scene,.scene-world{position:absolute;inset:0;width:1920px;height:1080px;overflow:hidden}.scene-world{background:var(--bg)}.scene-world:after{content:"";position:absolute;inset:0;z-index:20;pointer-events:none;opacity:.13;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.32'/%3E%3C/svg%3E")}.background-layer{position:absolute;inset:0;overflow:hidden;background-image:radial-gradient(circle at 78% 24%,rgba(118,185,0,.16),transparent 34%),radial-gradient(circle at 15% 84%,rgba(118,185,0,.08),transparent 32%)}.radial-glow{position:absolute;width:780px;height:780px;right:-160px;top:-200px;border-radius:50%;background:radial-gradient(circle,rgba(118,185,0,.4),rgba(118,185,0,.06) 45%,transparent 72%)}.orbit{position:absolute;width:720px;height:720px;right:-120px;top:-170px;border:3px solid rgba(118,185,0,.2);border-radius:50%;box-shadow:inset 0 0 0 80px rgba(118,185,0,.025),inset 0 0 0 160px rgba(118,185,0,.02)}.orbit:before,.orbit:after{content:"";position:absolute;border-radius:50%;background:var(--accent)}.orbit:before{width:20px;height:20px;left:118px;top:94px}.orbit:after{width:10px;height:10px;right:84px;bottom:170px}.ghost-index{position:absolute;right:80px;bottom:-110px;color:rgba(242,245,238,.055);font-size:520px;font-weight:700;letter-spacing:-.09em}.frame-meta{position:absolute;z-index:5;left:82px;right:82px;top:52px;display:flex;align-items:center;justify-content:space-between;color:#aab4ac;font-size:18px;font-weight:700;letter-spacing:.16em}.frame-meta b{color:var(--accent);font-variant-numeric:tabular-nums}.content-layer{position:absolute;z-index:4;inset:0;padding:120px 112px 110px}.scene-footer{position:absolute;z-index:5;left:82px;right:82px;bottom:42px;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:28px;color:#8d9891;font-size:16px;letter-spacing:.08em}.scene-footer i{height:4px;background:var(--accent);transform-origin:left center}p{margin:0;color:var(--accent);font-size:22px;font-weight:700;letter-spacing:.2em}h1,h2,h3{margin:0}.hook-layout{display:grid;grid-template-columns:620px 1fr;align-items:center;gap:86px}.brand-pair{display:grid;grid-template-columns:1fr 48px 1fr;align-items:center}.brand-tile{height:330px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;border:3px solid var(--line);background:rgba(17,24,19,.92);box-shadow:0 44px 90px rgba(0,0,0,.45)}.brand-tile img{width:190px;height:150px;object-fit:contain}.brand-tile b{font-size:27px;letter-spacing:.12em}.kimi-tile img{width:130px}.join-mark{font-size:48px;text-align:center;color:var(--accent)}.hook-copy h1{max-width:930px;margin-top:30px;font-size:142px;line-height:.87;letter-spacing:-.075em}.hook-copy h1 span,.cta-layout h1 span,.generic-layout h1 span{display:inline-block}.endpoint-badge{width:max-content;margin-top:44px;padding:18px 26px;border:2px solid var(--accent);display:flex;align-items:center;gap:15px;color:var(--fg);font-size:22px;font-weight:700;letter-spacing:.12em;background:rgba(118,185,0,.12)}.endpoint-badge i{width:12px;height:12px;border-radius:50%;background:var(--accent);box-shadow:0 0 24px var(--accent)}.source-layout{display:grid;grid-template-columns:600px 1fr;align-items:center;gap:72px}.source-copy h1{margin-top:28px;font-size:156px;line-height:.82;letter-spacing:-.08em}.source-copy h3{margin-top:34px;color:var(--accent);font-size:38px;letter-spacing:.06em}.source-proof{margin-top:80px;padding-top:24px;border-top:3px solid var(--line);display:grid;gap:10px}.source-proof span{color:var(--muted);font-size:18px;letter-spacing:.16em}.source-proof b{font-size:24px}.source-browser{height:680px;border:3px solid rgba(236,244,237,.28);border-radius:22px;background:#101411;box-shadow:0 48px 110px rgba(0,0,0,.55);overflow:hidden;transform-style:preserve-3d}.source-browser header,.terminal header{height:68px;display:flex;align-items:center;gap:12px;padding:0 24px;border-bottom:2px solid var(--line);background:#171d19}.source-browser header i,.terminal header span{width:13px;height:13px;border-radius:50%;background:#667169}.source-browser header i:first-child,.terminal header span:first-child{background:var(--accent)}.source-browser header strong{margin-left:16px;color:#b7c0b9;font-size:17px}.browser-body{padding:34px}.catalog-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:34px;color:#acb6ae;font-size:18px;letter-spacing:.12em}.catalog-head img{width:110px;height:70px;object-fit:contain}.model-row{min-height:128px;margin-top:18px;padding:25px 28px;border:2px solid var(--line);border-radius:14px;display:flex;align-items:center;justify-content:space-between;color:#d8ded9;background:#121814}.model-row span{padding:10px 14px;border:1px solid #445047;border-radius:99px;color:#9ca69f;font-size:14px}.hero-row{border-color:var(--accent);background:rgba(118,185,0,.1)}.hero-row div{display:flex;align-items:center;gap:20px}.hero-row img{width:62px;height:62px;padding:10px;border-radius:12px;background:#eff3ec}.hero-row span{border-color:var(--accent);color:var(--accent)}.muted-row{opacity:.42}.position-layout{display:grid;grid-template-columns:400px 1fr 390px;align-items:center;gap:70px}.model-emblem{width:370px;height:470px;border:3px solid var(--accent);display:grid;place-items:center;position:relative;background:rgba(118,185,0,.08);box-shadow:0 44px 100px rgba(0,0,0,.46)}.model-emblem img{width:180px;height:180px;padding:35px;border-radius:50%;background:#edf2eb}.model-emblem span{position:absolute;right:-30px;bottom:-55px;color:var(--accent);font-size:210px;font-weight:700;letter-spacing:-.1em}.position-copy h1{margin-top:28px;font-size:114px;line-height:.88;letter-spacing:-.075em}.position-copy h3{margin-top:32px;color:var(--accent);font-size:36px}.review-lane{padding:34px;border:2px solid #6f5633;background:#1b160f}.review-lane small{color:#e2ad66;font-size:15px;letter-spacing:.17em}.review-lane strong{display:block;margin-top:18px;font-size:29px}.review-lane span{display:block;margin-top:12px;color:#e2ad66;font-size:17px}.redacted{height:17px;margin-top:34px;background:#80623c;transform-origin:left center}.redacted.short{width:68%;margin-top:15px}.stat-layout{display:grid;grid-template-columns:1fr 700px;align-items:center;gap:90px}.stat-copy{padding-top:72px}.stat-copy>p{margin-bottom:54px}.counter-wrap{height:245px;display:flex;align-items:flex-end}.counter{display:inline-block;min-width:390px;color:var(--fg);font-size:286px;font-weight:700;line-height:.74;letter-spacing:-.1em;font-variant-numeric:tabular-nums;transform-origin:left bottom}.counter-suffix{padding-bottom:12px;color:var(--accent);font-size:54px;font-weight:700}.stat-copy h1{margin-top:52px;font-size:68px;letter-spacing:-.04em}.stat-copy small{display:block;margin-top:24px;color:#b7c0b9;font-size:23px}.bars{height:620px;display:flex;align-items:flex-end;gap:24px;padding:50px;border-left:3px solid var(--line);border-bottom:3px solid var(--line)}.bars i{display:block;flex:1;background:#39433c;transform-origin:bottom center}.bars i:last-child{background:var(--accent);box-shadow:0 0 50px rgba(118,185,0,.38)}.fact-chip{position:absolute;right:112px;top:132px;padding:13px 18px;border:2px solid #bd873e;color:#e8b36d;font-size:16px;font-weight:700;letter-spacing:.14em}.agent-layout{display:grid;grid-template-rows:auto 1fr}.agent-copy{max-width:1160px}.agent-copy h1{margin-top:22px;font-size:96px;line-height:.9;letter-spacing:-.065em}.agent-copy small{display:block;margin-top:20px;color:#aeb8b0;font-size:24px}.agent-network{position:relative;margin-top:50px;display:grid;grid-template-columns:1fr 220px 1fr;align-items:center;gap:52px}.agent-node{height:230px;padding:42px;border:3px solid var(--line);background:#121713;display:flex;flex-direction:column;justify-content:space-between}.agent-node span{color:var(--accent);font-size:18px}.agent-node b{font-size:43px}.api-core{position:relative;z-index:3;width:190px;height:190px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:#0b100a;box-shadow:0 0 80px rgba(118,185,0,.32)}.api-core i{position:absolute;inset:-24px;border:2px solid rgba(118,185,0,.48);border-radius:50%}.api-core strong{font-size:50px}.api-core small{position:absolute;bottom:34px;font-weight:700}.network-line{position:absolute;left:20%;right:20%;height:5px;background:var(--accent);transform-origin:center}.workflow-layout{display:grid;grid-template-columns:700px 1fr;align-items:center;gap:80px}.workflow-copy h1{margin-top:25px;font-size:100px;line-height:.9;letter-spacing:-.065em}.workflow-copy>small{display:block;margin-top:22px;color:#aeb8b0;font-size:24px}.flow-steps{margin-top:62px;display:grid;gap:14px}.flow-step{height:66px;display:grid;grid-template-columns:82px 1fr;align-items:center;border-top:2px solid var(--line)}.flow-step b{color:var(--accent);font-size:18px}.flow-step span{font-size:23px;font-weight:700;letter-spacing:.05em}.terminal{position:relative;height:650px;border:3px solid rgba(236,244,237,.26);border-radius:22px;background:#0d110e;box-shadow:0 48px 110px rgba(0,0,0,.55);overflow:hidden;transform-style:preserve-3d}.terminal header b{margin-left:18px;color:#aeb8b0;font-size:17px}.terminal-body{padding:45px;font:700 25px/1.4 monospace}.terminal-line{margin:0 0 42px;color:#d9dfda;font:700 25px/1.4 monospace;letter-spacing:0}.terminal-line i{color:var(--accent);font-style:normal}.env-key{margin:-18px 0 38px;padding:22px;border:2px solid var(--accent);background:rgba(118,185,0,.1);color:var(--accent);font:700 27px monospace;transform-origin:left center}.success{color:#9ed363}.cursor{position:absolute;left:430px;top:220px;z-index:8;width:44px;height:54px;fill:var(--fg);filter:drop-shadow(0 10px 14px rgba(0,0,0,.55))}.click-ripple{position:absolute;left:645px;top:367px;width:90px;height:90px;margin:-45px;border:3px solid var(--accent);border-radius:50%}.cta-layout{display:grid;grid-template-columns:1fr 220px;align-items:center}.cta-kicker{position:absolute;left:112px;top:160px;color:var(--accent);font-size:22px;font-weight:700;letter-spacing:.22em}.cta-layout h1{font-size:210px;line-height:.82;letter-spacing:-.085em}.cta-arrow{width:180px;height:180px;display:grid;place-items:center;border-radius:50%;background:var(--accent);color:#0a0e0b;font-size:110px}.cta-rule{position:absolute;left:112px;right:112px;bottom:155px;height:9px;background:var(--accent)}.generic-layout{display:flex;flex-direction:column;justify-content:center}.generic-layout h1{max-width:1480px;margin-top:28px;font-size:126px;line-height:.92;letter-spacing:-.06em}
  </style></head><body><main id="motionlayer-script" data-composition-id="motionlayer-script" data-start="0" data-duration="${duration.toFixed(2)}" data-fps="30" data-width="1920" data-height="1080">${scenes.map(sceneMarkup).join("\n")}</main><script src="vendor/gsap.min.js"></script><script>const tl=gsap.timeline({paused:true});${scenes.map(animationMarkup).join("\n")}window.__timelines["motionlayer-script"]=tl;</script></body></html>`;
}

export function scriptVideoDirectory(id: string) {
  if (!/^vid_[a-f0-9]{32}$/.test(id)) throw new Error("INVALID_SCRIPT_VIDEO_ID");
  return resolve(scriptVideosRoot, id);
}

async function runHyperFramesCommand(cliPath: string, args: string[]) {
  return new Promise<{ stdout: string; stderr: string }>((resolvePromise, reject) => {
    const ffmpeg = getLocalFfmpegPaths();
    const child = spawn(process.execPath, [cliPath, ...args], { cwd: process.cwd(), windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...(ffmpeg ? { PATH: `${ffmpeg.binDir}${delimiter}${process.env.PATH ?? ""}`, HYPERFRAMES_FFMPEG_PATH: ffmpeg.ffmpeg, HYPERFRAMES_FFPROBE_PATH: ffmpeg.ffprobe } : {}) } });
    let stdout = ""; let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolvePromise({ stdout, stderr }) : reject(new Error(`HYPERFRAMES_COMMAND_FAILED_${code}: ${(stderr + "\n" + stdout).slice(-4000)}`)));
  });
}

export async function renderScriptVideo(script: string, format: ScriptVideoFormat = "landscape", directionInput?: Partial<StyleDirection>) {
  const direction = resolveStyleDirection(directionInput);
  const styleProfile = getStyleDirectorProfile(direction.profileId);
  const understanding = analyzeScriptCopy(script);
  const dimensions = scriptVideoDimensions(format);
  const scenes = scenesFromScript(script, direction);
  if (!scenes.length) throw new Error("SCRIPT_REQUIRED");
  const renderDuration = Number(scenes.reduce((total, scene) => Math.max(total, scene.start + scene.duration), 0).toFixed(3));
  const id = `vid_${crypto.randomUUID().replace(/-/g, "")}`;
  const workspace = scriptVideoDirectory(id);
  const fonts = join(workspace, "fonts");
  const vendor = join(workspace, "vendor");
  const assets = join(workspace, "assets");
  const manifests = join(workspace, "manifests");
  const output = join(workspace, "video.mp4");
  await Promise.all([mkdir(fonts, { recursive: true }), mkdir(vendor, { recursive: true }), mkdir(assets, { recursive: true }), mkdir(manifests, { recursive: true })]);
  const nvidiaSource = resolve(process.cwd(), "data", "media-library", ".media", "images", "logo_001.svg");
  const moonshotSource = resolve(process.cwd(), "data", "media-library", ".media", "images", "logo_002.svg");
  const nvidiaCaptureSource = resolve(process.cwd(), "data", "media-library", ".media", "images", "nvidia-kimi-k3-source.png");
  const fieldNotesTexture = resolve(process.cwd(), "assets", "style-director", "field-notes-pencil.svg");
  const blueprintGrid = resolve(process.cwd(), "assets", "style-director", "blueprint-grid.svg");
  await Promise.all([
    cp(resolve(process.cwd(), "fixtures", "hyperframes", "demo", "fonts", "Inter-400-latin.woff2"), join(fonts, "Inter-400-latin.woff2")),
    cp(resolve(process.cwd(), "fixtures", "hyperframes", "demo", "fonts", "Inter-700-latin.woff2"), join(fonts, "Inter-700-latin.woff2")),
    cp(resolve(process.cwd(), "node_modules", "@fontsource-variable", "space-grotesk", "files", "space-grotesk-latin-wght-normal.woff2"), join(fonts, "SpaceGrotesk-Variable.woff2")),
    cp(resolve(process.cwd(), "node_modules", "@fontsource-variable", "manrope", "files", "manrope-latin-wght-normal.woff2"), join(fonts, "Manrope-Variable.woff2")),
    cp(resolve(process.cwd(), "fixtures", "hyperframes", "demo", "vendor", "gsap.min.js"), join(vendor, "gsap.min.js")),
    cp(nvidiaSource, join(assets, "nvidia.svg")),
    cp(moonshotSource, join(assets, "moonshot.svg")),
    cp(nvidiaCaptureSource, join(assets, "nvidia-kimi-k3-source.png")),
    cp(fieldNotesTexture, join(assets, "field-notes-pencil.svg")),
    cp(blueprintGrid, join(assets, "blueprint-grid.svg")),
  ]);
  const [nvidiaBytes, moonshotBytes, captureBytes, fieldNotesBytes, blueprintBytes] = await Promise.all([readFile(nvidiaSource), readFile(moonshotSource), readFile(nvidiaCaptureSource), readFile(fieldNotesTexture), readFile(blueprintGrid)]);
  const designContract = compileDesignContract([
    { source: { type: "default", id: "motionlayer-print-tech-editorial", version: 3 }, tokens: { colors: { background: "#eeeade", foreground: "#11120f", accent: "#76b900", muted: "#d8d3c5" }, typography: { heading: "Archivo Black 400 / League Gothic 400", body: "IBM Plex Mono 400-700" }, spacing: { frame: "84px", rule: "4-10px" } }, motionGrammar: { energy: .46, easingFamily: "mechanical-editorial", entryPrinciples: ["Hierarchy-first waterfall arrivals", "Physical print-sheet reveals"], holdPrinciples: ["Stillness is allowed after a decisive build"], exitPrinciples: ["Fast directional throws"], transitionPrinciples: ["Hard editorial cuts between semantic registers"] }, compositionRules: ["Warm paper field", "Asymmetric edge anchoring", "One dominant typographic gesture per beat", "Source evidence appears as captured evidence, never fake UI", "Flat geometry with no decorative chrome"], assetRules: ["Official local brand assets and frozen first-party capture only"], negativeConstraints: ["No gradients", "No glow", "No glass", "No rounded dashboard cards", "No fake browser chrome", "No tiny system metadata", "No ghost scene indices", "No generic centered text cards", "No unverified identity imagery"], aspectRatioOverrides: {} },
    { source: { type: "skill", id: "hyperframes-creative", version: "87bc09ec744313c8", checksum: "sha256:87bc09ec744313c8" }, tokens: {}, motionGrammar: {}, compositionRules: ["Build, breathe, resolve"], assetRules: [], negativeConstraints: ["Avoid web-page scale and empty frames"], aspectRatioOverrides: {} },
    { source: { type: "skill", id: "hyperframes-animation", version: "a5be218c0b0fe377", checksum: "sha256:a5be218c0b0fe377" }, tokens: {}, motionGrammar: { entryPrinciples: ["waterfall-entry", "counting-dynamic-scale", "stat-bars-and-fills", "cursor-click-ripple"] }, compositionRules: [], assetRules: [], negativeConstraints: ["Seek-safe paused timeline only"], aspectRatioOverrides: {} },
    { source: { type: "skill", id: "hyperframes-keyframes", version: "6bc62531ecea9a52", checksum: "sha256:6bc62531ecea9a52" }, tokens: {}, motionGrammar: { entryPrinciples: ["parallax depth separation", "focus-led handoffs"] }, compositionRules: ["Keep depth motivated by hierarchy"], assetRules: [], negativeConstraints: ["No arbitrary camera movement"], aspectRatioOverrides: {} },
    { source: { type: "skill", id: "hyperframes-registry", version: "d6dfcc8ceb7c8178", checksum: "sha256:d6dfcc8ceb7c8178" }, tokens: {}, motionGrammar: { transitionPrinciples: ["light-sweep-pass", "focus-rack", "shared-axis-z"] }, compositionRules: ["Adapt registry motion principles to the project visual system"], assetRules: [], negativeConstraints: ["Do not drop in mismatched showcase styling"], aspectRatioOverrides: {} },
    { source: { type: "skill", id: "motion-graphics", version: "853ac75cbab69036", checksum: "sha256:853ac75cbab69036" }, tokens: {}, motionGrammar: {}, compositionRules: ["Asset-first semantic shot design"], assetRules: ["Resolve logos before composition"], negativeConstraints: [], aspectRatioOverrides: {} },
    { source: { type: "skill", id: "shader-craft", version: "optical-paper-depth-v1", checksum: "sha256:optical-paper-depth-v1" }, tokens: {}, motionGrammar: { holdPrinciples: ["one slow motivated key-light pass"] }, compositionRules: ["Use the deterministic WebGL layer for optical depth, fine dither, and paper-light movement"], assetRules: [], negativeConstraints: ["No neon aurora", "No uncontrolled real-time shader animation", "No heavy raymarching"], aspectRatioOverrides: {} },
    { source: { type: "brand-kit", id: `style-director:${styleProfile.id}`, version: 1 }, tokens: { colors: { background: styleProfile.palette.paper, foreground: styleProfile.palette.ink, accent: styleProfile.palette.accent, muted: styleProfile.palette.soft }, typography: { heading: "Space Grotesk Variable 620-760", body: "Manrope Variable 430-720" } }, motionGrammar: { energy: direction.motion === "expressive" ? .58 : .38, easingFamily: direction.motion === "expressive" ? "editorial-snap" : "restrained-editorial" }, compositionRules: [`Use the ${styleProfile.grammar} visual grammar`, `Scene density: ${direction.density}`, "Vary semantic layouts without changing the visual world"], assetRules: [], negativeConstraints: [...ANTI_SLOP_CONSTRAINTS], aspectRatioOverrides: {} },
    { source: { type: "user-direction", id: "anti-vibecode-rebuild", version: 4 }, tokens: {}, motionGrammar: { energy: direction.motion === "expressive" ? .58 : .38, easingFamily: "after-effects-inspired-editorial" }, compositionRules: ["Use the word checker before motion planning", "Give every beat its own semantic role", "Prefer editorial evidence over interface simulation", "Apply the style-directed render policy on every script render", "Author native layouts for every output ratio", ...(direction.referenceNotes ? [`Reference direction: ${direction.referenceNotes}`] : [])], assetRules: [], negativeConstraints: ["Do not reduce the script to generic text slides", "Do not use AI-dashboard decoration", "Do not flatten depth into a single text plane"], aspectRatioOverrides: {} },
  ]);
  const assetManifest = {
    version: 1,
    assets: [
      { id: "asset:nvidia-logo", entity: "NVIDIA", file: "assets/nvidia.svg", provider: "svgl", sourceUrl: "https://svgl.app/library/nvidia-icon-light.svg", usageStatus: "official-mark", contentHash: `sha256:${createHash("sha256").update(nvidiaBytes).digest("hex")}` },
      { id: "asset:moonshot-logo", entity: "Moonshot AI", file: "assets/moonshot.svg", provider: "simple-icons@16.25.0", sourceUrl: "https://simpleicons.org/?q=moonshot", usageStatus: "official-monochrome-glyph", contentHash: `sha256:${createHash("sha256").update(moonshotBytes).digest("hex")}` },
      { id: "asset:nvidia-kimi-k3-capture", entity: "NVIDIA Kimi K3 model card", file: "assets/nvidia-kimi-k3-source.png", provider: "official-domain-capture", sourceUrl: "https://build.nvidia.com/moonshotai/kimi-k3/modelcard", retrievedAt: "2026-08-29T00:00:00Z", usageStatus: "source-evidence", contentHash: `sha256:${createHash("sha256").update(captureBytes).digest("hex")}` },
      { id: "asset:field-notes-pencil", entity: "MotionLayer Field Notes material", file: "assets/field-notes-pencil.svg", provider: "local-authored", sourceUrl: "local://assets/style-director/field-notes-pencil.svg", usageStatus: "profile-material", contentHash: `sha256:${createHash("sha256").update(fieldNotesBytes).digest("hex")}` },
      { id: "asset:blueprint-grid", entity: "MotionLayer Blueprint construction grid", file: "assets/blueprint-grid.svg", provider: "local-authored", sourceUrl: "local://assets/style-director/blueprint-grid.svg", usageStatus: "profile-material", contentHash: `sha256:${createHash("sha256").update(blueprintBytes).digest("hex")}` },
    ],
  };
  const semanticGraph = analyzeSemanticTranscript(understanding.cues.map((cue) => ({ id: cue.id, startSeconds: cue.startSeconds, endSeconds: cue.endSeconds, text: cue.checkedText, rawText: cue.originalText, confidence: .92, normalized: cue.checkedText !== cue.originalText })), "estimated-script");
  await writeFile(join(workspace, "hyperframes.json"), JSON.stringify({ $schema: "https://hyperframes.heygen.com/schema/hyperframes.json", paths: { blocks: "compositions", components: "compositions/components", assets: "assets" } }, null, 2));
  await writeFile(join(workspace, "index.html"), editorialCompositionHtml(scenes, format, direction), "utf8");
  await writeFile(join(workspace, "frame.md"), `---\nbackground: "${styleProfile.palette.paper}"\nforeground: "${styleProfile.palette.ink}"\naccent: "${styleProfile.palette.accent}"\nheading: "Space Grotesk Variable"\nbody: "Manrope Variable"\n---\n\n# ${styleProfile.label}\n\n${styleProfile.description} The piece uses ${direction.density} scene density and ${direction.motion} motion.\n\n## Do\n\n- Anchor type to edges and let it crop with intent.\n- Use semantic scene roles rather than repeating a title card.\n- Let decisive motion resolve into stillness.\n\n## Do not\n\n${ANTI_SLOP_CONSTRAINTS.map((item) => `- ${item}`).join("\n")}\n`, "utf8");
  await writeFile(join(workspace, "script.txt"), script, "utf8");
  await Promise.all([
    writeFile(join(manifests, "word-check.json"), JSON.stringify(understanding, null, 2), "utf8"),
    writeFile(join(manifests, "semantic-graph.json"), JSON.stringify(semanticGraph, null, 2), "utf8"),
    writeFile(join(manifests, "design-contract.json"), JSON.stringify(designContract, null, 2), "utf8"),
    writeFile(join(manifests, "motion-plan.json"), JSON.stringify({ timingBasis: understanding.timingBasis, durationSeconds: understanding.durationSeconds, direction: styleDirectionReceipt(direction), format, dimensions, beats: scenes }, null, 2), "utf8"),
    writeFile(join(manifests, "direction-receipt.json"), JSON.stringify({ ...styleDirectionReceipt(direction), referenceNotes: direction.referenceNotes, antiSlopConstraints: ANTI_SLOP_CONSTRAINTS }, null, 2), "utf8"),
    writeFile(join(manifests, "asset-manifest.json"), JSON.stringify(assetManifest, null, 2), "utf8"),
  ]);
  const cliPath = resolve(process.cwd(), "node_modules", "hyperframes", "bin", "hyperframes.mjs");
  const lint = await runHyperFramesCommand(cliPath, ["lint", workspace, "--json"]);
  const check = await runHyperFramesCommand(cliPath, ["check", workspace, "--at", "1,10,20,27,33,42,49", "--timeout", "10000", "--json"]);
  await writeFile(join(manifests, "validation.json"), JSON.stringify({ lint: lint.stdout, check: check.stdout }, null, 2), "utf8");
  await runHyperFramesCommand(cliPath, ["render", workspace, "--quality", SCRIPT_RENDER_POLICY.quality, "--workers", String(SCRIPT_RENDER_POLICY.workers), "--output", output]);
  const outputBytes = await readFile(output);
  await writeFile(join(manifests, "render-manifest.json"), JSON.stringify({ id, createdAt: new Date().toISOString(), output: "video.mp4", outputHash: `sha256:${createHash("sha256").update(outputBytes).digest("hex")}`, durationSeconds: renderDuration, fps: { num: 30, den: 1 }, format, dimensions, hyperframes: "0.8.19", quality: SCRIPT_RENDER_POLICY.quality, renderPolicy: SCRIPT_RENDER_POLICY, designContractChecksum: designContract.checksum, skills: designContract.sources.filter((source) => source.type === "skill") }, null, 2), "utf8");
  return { id, scenes: scenes.length, duration: renderDuration, format, dimensions, output, wordCheck: understanding.suggestions, skillsUsed: [...SCRIPT_RENDER_POLICY.skills], renderProfile: SCRIPT_RENDER_POLICY, directionReceipt: styleDirectionReceipt(direction) };
}

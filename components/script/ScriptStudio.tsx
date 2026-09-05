"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, Clapperboard, Download, Film, Layers3, LibraryBig, Monitor, RectangleVertical, RotateCcw, ScanSearch, ShieldCheck, SlidersHorizontal, Waves } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { analyzeScriptCopy, type WordCheckSuggestion } from "@/lib/script-understanding";
import { SCRIPT_RENDER_POLICY, type ScriptRenderProfile } from "@/lib/script-render-policy";
import { DEFAULT_STYLE_DIRECTION, STYLE_DIRECTOR_PROFILES, type StyleDirection, type StyleDirectionReceipt } from "@/lib/style-director";
import { GraphicsWorkspace, graphicsRequest } from "@/components/graphics/GraphicsWorkspace";
import type { GraphicsPlan } from "@/packages/graphics/spec";
import { ReferencePicker, type ReferenceSelection } from './ReferencePicker';
import './studio-redesign.css';

export type ScriptVideoFormat = "landscape" | "short-form";
export type ScriptStudioResult = { videoUrl: string; downloadUrl: string; duration: number; scenes: number; format?: ScriptVideoFormat; dimensions?: { width: number; height: number }; wordCheck?: WordCheckSuggestion[]; skillsUsed?: string[]; renderProfile?: ScriptRenderProfile; directionReceipt?: StyleDirectionReceipt };

const styleStorageKey = "motionlayer:style-direction:v1";

const example = "Every idea begins with possibility. Shape the thought; refine the details; share your work. Make something worth remembering.";
const renderStages = [
  { icon: ScanSearch, label: "Understand", detail: "Word check + semantics" },
  { icon: Clapperboard, label: "Direct", detail: "Purposeful visual beats" },
  { icon: Layers3, label: "Build depth", detail: "Layered choreography" },
  { icon: Waves, label: "Finish", detail: "Shader + render QC" },
];

export function ScriptStudio({ initialScript = "", initialResult = null, initialGraphicsPlan }: { initialScript?: string; initialResult?: ScriptStudioResult | null; initialGraphicsPlan?:GraphicsPlan }) {
  const [script, setScript] = useState(initialScript);
  const [result, setResult] = useState<ScriptStudioResult | null>(initialResult);
  const [format, setFormat] = useState<ScriptVideoFormat>(initialGraphicsPlan && initialGraphicsPlan.height>initialGraphicsPlan.width?'short-form':initialResult?.format ?? "landscape");
  const [direction, setDirection] = useState<StyleDirection>(DEFAULT_STYLE_DIRECTION);
  const [directionReady, setDirectionReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "generating" | "complete" | "error">("idle");
  const [error, setError] = useState("");
  const [graphicsPlan, setGraphicsPlan] = useState<GraphicsPlan | null>(initialGraphicsPlan || null);
  const [graphicsJob, setGraphicsJob] = useState<Parameters<typeof GraphicsWorkspace>[0]["initialJob"]>();
  const [savedGraphicsId, setSavedGraphicsId] = useState("");
  const [reference,setReference]=useState<ReferenceSelection|null>(null);
  const [referenceBusy,setReferenceBusy]=useState(false);
  const understanding = useMemo(() => analyzeScriptCopy(script), [script]);
  const safeCorrections = understanding.suggestions.filter((item) => item.status === "auto-corrected");
  const reviewItems = understanding.suggestions.filter((item) => item.status !== "auto-corrected");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(styleStorageKey);
      if (saved) setDirection({ ...DEFAULT_STYLE_DIRECTION, ...JSON.parse(saved) });
    } catch { /* Keep the safe default when stored data is unavailable. */ }
    setDirectionReady(true);
    setSavedGraphicsId(window.localStorage.getItem("motionlayer:graphics-plan") || "");
  }, []);

  useEffect(() => {
    if (directionReady) window.localStorage.setItem(styleStorageKey, JSON.stringify(direction));
  }, [direction, directionReady]);

  const generate = async () => {
    if (script.trim().length < 12 || status === "generating") return;
    setStatus("generating"); setResult(null); setError("");
    try {
      const payload = await graphicsRequest<{plan:GraphicsPlan;job:Parameters<typeof GraphicsWorkspace>[0]["initialJob"]}>("plans", "POST", {script,format,direction:`${direction.profileId} ${direction.density} ${direction.motion} ${direction.referenceNotes}`.slice(0,300),...(reference?{palette:reference.palette,paletteSource:reference.source}:{})});
      setGraphicsPlan(payload.plan); setGraphicsJob(payload.job); setStatus("idle");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The video could not be generated."); setStatus("error");
    }
  };
  const reset = () => { setResult(null); setStatus("idle"); setError(""); };
  const profile = result?.renderProfile ?? SCRIPT_RENDER_POLICY;

  return <main className="script-studio">
    <header className="script-header">
      <BrandMark />
      <nav aria-label="MotionLayer sections"><Link className="active" href="/"><Clapperboard size={15} />Script studio</Link><Link href="/styles"><LibraryBig size={15} />Creator styles</Link></nav>
      <div className="pipeline-ready">Your motion studio</div>
    </header>

    <section className={`script-workspace ${result || graphicsPlan ? "has-result" : ""}`}>
      {!graphicsPlan && <div className="script-intro"><h1>Give your words{' '}<br/>a visual voice.</h1><p>Start with a script. Shape the frames. Make it move.</p></div>}

      {graphicsPlan ? <GraphicsWorkspace initialPlan={graphicsPlan} initialJob={graphicsJob} onBack={()=>{setSavedGraphicsId(graphicsPlan.id);setGraphicsPlan(null);setGraphicsJob(undefined);}} /> : !result ? <div className="script-composer">
        <section className="studio-specimen" aria-label="Motion design example"><div className="specimen-screen"><video controls playsInline preload="metadata" poster="/motion-assets/studio-poster.jpg" src="/motion-assets/studio-reel.mp4" aria-label="Play the motion design example"/></div><div className="specimen-caption"><span>Ideas, taking shape.</span><span>Example render · 16:9</span></div><p>Original illustration. Real type. Layered motion.<br/>An example of the renderer—not a preview of your script.</p></section>
        <section className="script-entry-panel">
          <header><label htmlFor="motion-script">Script</label><span>{understanding.timingBasis === "supplied-timecodes" ? "Timecodes detected" : "Timing estimated"}</span></header>
          <textarea id="motion-script" value={script} maxLength={5000} onChange={(event) => setScript(event.target.value)} placeholder="Paste the script you want to turn into motion..." disabled={!directionReady || status === "generating"} autoFocus />
          <div className="composer-foot"><button className="example-button" type="button" onClick={() => setScript(example)} disabled={status === "generating"}>Load example script</button><span>{script.length.toLocaleString()} / 5,000</span></div>
        </section>

        <aside className="direction-panel" aria-label="Render direction">
          <header><span>Art direction</span><small>Set once. Carried through.</small></header>
          <fieldset className="format-picker" disabled={status === "generating"}>
            <legend className="sr-only">Output format</legend>
            <button type="button" className={format === "landscape" ? "selected" : ""} aria-pressed={format === "landscape"} onClick={() => setFormat("landscape")}><Monitor size={19} /><span><b>16:9</b><small>YouTube / desktop</small></span><i /></button>
            <button type="button" className={format === "short-form" ? "selected" : ""} aria-pressed={format === "short-form"} onClick={() => setFormat("short-form")}><RectangleVertical size={19} /><span><b>9:16</b><small>Shorts / Reels / TikTok</small></span><i /></button>
          </fieldset>
          <fieldset className="style-profile-picker" disabled={status === "generating"}>
            <legend>Visual grammar</legend>
            {STYLE_DIRECTOR_PROFILES.map((profile) => <button type="button" key={profile.id} className={direction.profileId === profile.id ? "selected" : ""} aria-pressed={direction.profileId === profile.id} onClick={() => setDirection((current) => ({ ...current, profileId: profile.id }))}><span className="profile-swatches" aria-hidden="true"><i style={{ background: profile.palette.paper }} /><i style={{ background: profile.palette.ink }} /><i style={{ background: profile.palette.accent }} /></span><span><b>{profile.label}</b><small>{profile.description}</small></span><i /></button>)}
          </fieldset>
          <ReferencePicker value={reference} onChange={setReference} onBusy={setReferenceBusy}/>
          <div className="style-tuning"><span><SlidersHorizontal size={14} />Direction controls</span><label>Scene density<select value={direction.density} onChange={(event) => setDirection((current) => ({ ...current, density: event.target.value as StyleDirection["density"] }))} disabled={status === "generating"}><option value="sparse">Sparse</option><option value="balanced">Balanced</option></select></label><label>Motion energy<select value={direction.motion} onChange={(event) => setDirection((current) => ({ ...current, motion: event.target.value as StyleDirection["motion"] }))} disabled={status === "generating"}><option value="restrained">Restrained</option><option value="expressive">Expressive</option></select></label><label>Creative note<textarea value={direction.referenceNotes} maxLength={280} onChange={(event) => setDirection((current) => ({ ...current, referenceNotes: event.target.value }))} placeholder="Try: quiet documentary, kinetic, punchy, or precise" disabled={status === "generating"} /></label></div>
        </aside>

        {script.trim().length >= 12 && <section className="word-checker" aria-label="Word checker">
          <header><span><ShieldCheck size={16} />Word checker</span><small>{understanding.timingBasis === "supplied-timecodes" ? `${Math.round(understanding.durationSeconds)} sec aligned` : "Estimated timing"}</small></header>
          <div className="word-check-summary"><strong>{safeCorrections.length} safe corrections</strong><span>{reviewItems.length} held for review</span><em>The source text is never overwritten</em></div>
          {understanding.suggestions.length ? <div className="word-check-list">{understanding.suggestions.slice(0, 8).map((item) => <div className={`word-check-row ${item.status}`} key={item.id}>{item.status === "auto-corrected" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}<span><s>{item.original}</s><b><ArrowRight size={11} />{item.proposed}</b><small>{Math.round(item.confidence * 100)}% / {item.reason}</small></span></div>)}</div> : <p className="word-check-clean"><CheckCircle2 size={14} />No obvious transcription corrections found.</p>}
          <footer><span>Open-vocabulary context pass</span><b>{understanding.topic === "nvidia-kimi-k3" ? "7 purpose-built semantic beats" : "Sparse editorial scene planning"}</b></footer>
        </section>}

        <button className="generate-button" type="button" onClick={generate} disabled={script.trim().length < 12 || referenceBusy || status === "generating"}>{status === "generating" ? <><span className="render-spinner" />Building editable storyboard...</> : <><Clapperboard size={19} />Build editable graphics<ArrowRight size={18} /></>}</button>
        {savedGraphicsId && <button className="example-button" onClick={()=>void graphicsRequest<GraphicsPlan>(`plans/${savedGraphicsId}`).then(setGraphicsPlan).catch(cause=>setError(String(cause)))}>Resume saved graphics</button>}
        {status === "generating" && <p className="render-note" role="status">Preparing source-backed scenes. You can edit their content, layout, materials, and timing before rendering.</p>}
        {status === "error" && <p className="script-error" role="alert">{error} Your script is still safe; retry when ready.</p>}
      </div> : <div className="video-result">
        <div className="result-topline"><span><Film size={16} />Directed render ready</span><small>{result.format === "short-form" ? "9:16 short form" : "16:9 landscape"} / {result.scenes} scenes / {Math.round(result.duration)} sec</small></div>
        <div className="result-grid">
          <div className={`video-stage ${result.format === "short-form" ? "short-form" : ""}`}><video controls autoPlay playsInline src={result.videoUrl} /></div>
          <aside className="result-inspector"><header><span>Render receipt</span><small>{result.dimensions?.width ?? 1920} x {result.dimensions?.height ?? 1080}</small></header><div className="result-profile"><Layers3 size={17} /><span><b>{result.directionReceipt?.profileLabel ?? profile.label}</b><small>{result.directionReceipt ? `${result.directionReceipt.grammar} / ${result.directionReceipt.density} / ${result.directionReceipt.motion} / ${result.directionReceipt.referenceMode}` : `${profile.motionLanguage} / ${profile.depthPass}`}</small></span></div><ul>{profile.guarantees.map((guarantee) => <li key={guarantee}><Check size={12} />{guarantee}</li>)}</ul><div className="used-skills"><span>Skills used</span><div>{(result.skillsUsed ?? profile.skills).map((skill) => <b key={skill}>{skill}</b>)}</div></div></aside>
        </div>
        <div className="render-proof"><ShieldCheck size={15} /><span>Word checked / local verified assets / native aspect layout / deterministic depth shader / HyperFrames lint and runtime checks passed</span></div>
        {result.wordCheck?.length ? <section className="result-word-check"><header><span><ShieldCheck size={15} />Word-check receipt</span><small>{result.wordCheck.filter((item) => item.status === "auto-corrected").length} corrected / {result.wordCheck.filter((item) => item.status !== "auto-corrected").length} held</small></header><div>{result.wordCheck.filter((item) => item.status !== "auto-corrected").map((item) => <p key={item.id}><AlertTriangle size={13} /><span><s>{item.original}</s><b>{item.proposed}</b><small>{item.reason}</small></span></p>)}</div></section> : null}
        <div className="result-actions"><a className="download-button" href={result.downloadUrl}><Download size={18} />Download MP4</a><button className="again-button" type="button" onClick={reset}><RotateCcw size={17} />Render another</button></div>
      </div>}
    </section>
  </main>;
}

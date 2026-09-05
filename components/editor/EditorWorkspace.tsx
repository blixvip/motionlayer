"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  AlertTriangle, Aperture, ArrowLeft, BadgeCheck, BrainCircuit, ChevronDown, CircleHelp, Clock3, Download, Film,
  Layers3, Library, LoaderCircle, LockKeyhole, Maximize2, MessageSquareText, MousePointer2, Palette,
  PanelLeftClose, PanelLeftOpen, Pause, Play, Plus, Redo2, RotateCcw, Search, Settings2,
  SendHorizontal, ShieldCheck, Sparkles, Subtitles, Upload, Volume2, VolumeX, WandSparkles, X, Zap,
} from "lucide-react";
import Link from "next/link";
import type { MotionMoment, MotionPlan } from "@/lib/motion-plan";
import { assertEvidenceVerified } from "@/lib/motion-plan";
import type { PromptScope } from "@/lib/prompt-scope";
import { formatTimecode } from "@/lib/timing";
import type { VisualKnowledgeGraph } from "@/lib/semantic-analysis";
import type { Storyboard } from "@/lib/visual-opportunity";
import { GraphicsWorkspace, graphicsRequest } from "@/components/graphics/GraphicsWorkspace";
import type { GraphicsPlan } from "@/packages/graphics/spec";

const typeLabel: Record<MotionMoment["type"], string> = {
  "hook-title": "Hook title", "lower-third": "Lower third", "stat-card": "Stat card", "step-list": "Step list", "pull-quote": "Pull quote",
};

const rail = [
  { id: "media", label: "Media", icon: Film }, { id: "transcript", label: "Transcript", icon: Subtitles },
  { id: "understanding", label: "Meaning", icon: BrainCircuit }, { id: "motion", label: "Motion", icon: Library },
  { id: "brand", label: "Brand", icon: Palette }, { id: "settings", label: "Settings", icon: Settings2 },
];

const scopeLabel: Record<PromptScope, string> = {
  "selected-graphic": "This graphic",
  "selected-range": "Current beat",
  "graphic-type": "This graphic type",
  "whole-project": "Whole project",
};

type EditorProject = {
  id: string; name: string; aspect: string; resolution: string; fps: number; duration: number;
  platform: string; updated: string; progress: number; stage: string; thumbnail: string; filename?: string; graphicsPlanId?: string;
};
type EditorTranscript = Array<{ id: string; start: number; end: number; speaker: string; text: string }>;

export function EditorWorkspace({ project, plan, transcript, semanticGraph, storyboard, sourceUrl, posterUrl }: {
  project: EditorProject; plan: MotionPlan; transcript: EditorTranscript; semanticGraph: VisualKnowledgeGraph; storyboard: Storyboard; sourceUrl: string; posterUrl?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoFrameRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [items, setItems] = useState(plan.moments);
  const [selectedId, setSelectedId] = useState(plan.moments[0]?.id ?? "");
  const [time, setTime] = useState(Math.min(project.duration, plan.moments[0]?.startSeconds ?? 0));
  const [playing, setPlaying] = useState(false);
  const [panel, setPanel] = useState("transcript");
  const [tab, setTab] = useState("content");
  const [prompt, setPrompt] = useState("");
  const [scope, setScope] = useState<PromptScope>("selected-graphic");
  const [promptStage, setPromptStage] = useState<"idle" | "running" | "error">("idle");
  const [promptFeedback, setPromptFeedback] = useState("Prompt copy, design, placement, motion, timing, or the whole project.");
  const [versions, setVersions] = useState(["v2 · Timing refined", "v1 · Initial generation"]);
  const [history, setHistory] = useState<MotionMoment[][]>([]);
  const [future, setFuture] = useState<MotionMoment[][]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [transcriptQuery, setTranscriptQuery] = useState("");
  const [sourcePanelOpen, setSourcePanelOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [muted, setMuted] = useState(false);
  const [snap, setSnap] = useState(true);
  const [selectedSegmentId, setSelectedSegmentId] = useState(transcript[0]?.id ?? "");
  const [visualStage, setVisualStage] = useState<"idle" | "creating" | "error">("idle");
  const [graphicsPlan, setGraphicsPlan] = useState<GraphicsPlan | null>(null);
  const [graphicsJob, setGraphicsJob] = useState<Parameters<typeof GraphicsWorkspace>[0]["initialJob"]>();
  const [graphicsBusy, setGraphicsBusy] = useState(false);
  const openGraphics = async () => {
    setGraphicsBusy(true);
    try {
      const saved=project.graphicsPlanId || localStorage.getItem(`motionlayer:graphics-project:${project.id}`);
      if(saved) {setGraphicsPlan(await graphicsRequest<GraphicsPlan>(`plans/${saved}`));}
      else {const result=await graphicsRequest<{plan:GraphicsPlan;job:Parameters<typeof GraphicsWorkspace>[0]["initialJob"]}>("plans","POST",{projectId:project.id});setGraphicsPlan(result.plan);setGraphicsJob(result.job);}
    } catch(cause){setToast(String(cause));}finally{setGraphicsBusy(false);}
  };
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const visible = items.filter((item) => item.status !== "rejected" && time >= item.startSeconds && time <= item.endSeconds);
  const reviewCount = items.filter((item) => item.status === "suggested").length;
  const filteredTranscript = transcript.filter((segment) => segment.text.toLowerCase().includes(transcriptQuery.trim().toLowerCase()));
  const selectedSegment = transcript.find((segment) => segment.id === selectedSegmentId) ?? transcript[0];
  const selectedSpans = semanticGraph.spans.filter((span) => span.segmentId === selectedSegment?.id);
  const selectedEntityIds = new Set(selectedSpans.flatMap((span) => span.entityIds));
  const selectedEntities = semanticGraph.entities.filter((entity) => selectedEntityIds.has(entity.id));
  const selectedSpanIds = new Set(selectedSpans.map((span) => span.id));
  const selectedWarnings = semanticGraph.warnings.filter((warning) => selectedSpanIds.has(warning.spanId));
  const selectedClaims = semanticGraph.claims.filter((claim) => selectedSpanIds.has(claim.spanId));
  const selectedOpportunity = storyboard.opportunities.find((opportunity) => opportunity.segmentId === selectedSegment?.id);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const update = () => setTime(video.currentTime);
    const stop = () => setPlaying(false);
    video.addEventListener("timeupdate", update);
    video.addEventListener("ended", stop);
    return () => { video.removeEventListener("timeupdate", update); video.removeEventListener("ended", stop); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing = target?.matches("input, textarea, select, [contenteditable='true']");
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPanel("transcript");
        setSourcePanelOpen(true);
        window.setTimeout(() => searchRef.current?.focus(), 0);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        window.setTimeout(() => promptRef.current?.focus(), 0);
      } else if (event.code === "Space" && !editing) {
        event.preventDefault();
        togglePlayback();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { void video.play(); setPlaying(true); } else { video.pause(); setPlaying(false); }
  };

  const seek = (next: number) => {
    const clamped = Math.min(project.duration, Math.max(0, next));
    setTime(clamped);
    if (videoRef.current) videoRef.current.currentTime = clamped;
  };

  const selectMoment = (id: string, nextTime?: number) => {
    setSelectedId(id);
    setInspectorOpen(true);
    if (nextTime !== undefined) seek(nextTime);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
  };

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await videoFrameRef.current?.requestFullscreen();
  };

  const updateStatus = (status: MotionMoment["status"]) => {
    try {
      if (status === "accepted") assertEvidenceVerified(selected);
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, status } : item));
      setToast(status === "rejected" ? "Suggestion removed from the active plan" : status === "suggested" ? "Suggestion returned to review" : "Suggestion approved for generation");
    } catch (error) { setToast(error instanceof Error ? error.message : "Verification required"); }
  };

  const focusPrompt = (nextScope: PromptScope = "selected-graphic") => {
    setScope(nextScope);
    window.setTimeout(() => promptRef.current?.focus(), 0);
  };

  const runPrompt = async () => {
    const instruction = prompt.trim();
    if (!instruction || promptStage === "running") return;
    setPromptStage("running");
    setPromptFeedback(`Applying to ${scopeLabel[scope].toLowerCase()} while keeping source and evidence locked…`);
    try {
      const response = await fetch(`/api/projects/${project.id}/prompt`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: instruction, scope, selectedId: selected.id, plan: { ...plan, moments: items } }),
      });
      const result = await response.json() as { error?: string; summary?: string; moments?: MotionMoment[]; affectedIds?: string[]; provider?: string };
      if (!response.ok || !result.moments?.length) throw new Error(result.error ?? "The prompt engine did not return a revision.");
      const revisedPlan = { ...plan, moments: result.moments };
      const saveResponse = await fetch(`/api/projects/${project.id}/motion-plan`, {
        method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(revisedPlan),
      });
      if (!saveResponse.ok) throw new Error("The revision was generated but could not be saved.");
      setHistory((current) => [...current, items].slice(-20));
      setFuture([]);
      setItems(result.moments);
      setVersions((current) => [`v${current.length + 1} · ${instruction.slice(0, 34)}`, ...current]);
      setPrompt("");
      setPromptStage("idle");
      setPromptFeedback(`${result.summary ?? "Revision ready"} · ${result.affectedIds?.length ?? 1} changed · local ${result.provider ?? "prompt engine"}`);
      setToast("Prompt revision ready · source edit unchanged");
    } catch (error) {
      setPromptStage("error");
      setPromptFeedback(error instanceof Error ? `${error.message} Your previous version is unchanged.` : "Prompt failed. Your previous version is unchanged.");
    }
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((current) => [items, ...current].slice(0, 20));
    setHistory((current) => current.slice(0, -1));
    setItems(previous);
    setPromptFeedback("Prompt revision undone. You can redo it from the top bar.");
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory((current) => [...current, items].slice(-20));
    setFuture((current) => current.slice(1));
    setItems(next);
    setPromptFeedback("Prompt revision restored.");
  };

  const createVisualFromSelection = async () => {
    if (!selectedSegment || visualStage === "creating") return;
    setVisualStage("creating");
    try {
      const response = await fetch(`/api/projects/${project.id}/visuals`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ segmentId: selectedSegment.id, semanticSpanId: selectedSpans[0]?.id }),
      });
      const result = await response.json() as { error?: string; moment?: MotionMoment };
      if (!response.ok || !result.moment) throw new Error(result.error ?? "The visual could not be created from this phrase.");
      setHistory((current) => [...current, items].slice(-20));
      setFuture([]);
      setItems((current) => [...current, result.moment!]);
      setSelectedId(result.moment.id);
      setInspectorOpen(true);
      setTab("evidence");
      seek(result.moment.startSeconds);
      setVisualStage("idle");
      setToast("Visual proposal created from the selected source phrase");
    } catch (error) {
      setVisualStage("error");
      setToast(error instanceof Error ? error.message : "The visual could not be created.");
    }
  };

  const ticks = useMemo(() => {
    const interval = project.duration <= 20 ? 2 : project.duration <= 60 ? 5 : Math.ceil(project.duration / 10);
    return Array.from({ length: Math.floor(project.duration / interval) + 1 }, (_, index) => index * interval);
  }, [project.duration]);

  if (graphicsPlan) return <main className="gw-project-mode"><GraphicsWorkspace initialPlan={graphicsPlan} initialJob={graphicsJob} sourceUrl={sourceUrl} transcript={transcript} onBack={()=>setGraphicsPlan(null)} /></main>;

  return (
    <main className={`editor-shell ${exportOpen ? "export-mode" : ""}`}>
      <header className="editor-topbar">
        <div className="top-left"><Link href="/dashboard" className="icon-button" aria-label="Back to projects"><ArrowLeft size={17} /></Link><span className="top-rule" /><div className="project-title"><strong>{project.name}</strong><span><i /> Saved just now</span></div></div>
        <div className="top-center"><button className="icon-button" aria-label="Undo prompt revision" title="Undo prompt revision" disabled={!history.length} onClick={undo}><RotateCcw size={16} /></button><button className="icon-button" aria-label="Redo prompt revision" title="Redo prompt revision" disabled={!future.length} onClick={redo}><Redo2 size={16} /></button><span className="top-rule" /><span className="compact-readout">{project.aspect}</span><span className="compact-readout">Preview · source</span></div>
        <div className="top-actions"><button className="quiet-button" disabled={graphicsBusy || project.id === "demo"} onClick={()=>void openGraphics()}>{graphicsBusy ? "Preparing graphics…" : "Edit with asGenerator"}</button><button className="export-button" aria-pressed={exportOpen} onClick={() => setExportOpen((value) => !value)}><Download size={15} /> Export</button></div>
      </header>

      <section className={`editor-main ${sourcePanelOpen ? "" : "source-collapsed"} ${inspectorOpen ? "" : "inspector-collapsed"}`}>
        <nav className="tool-rail" aria-label="Project tools">
          <div className="mini-mark"><Aperture size={20} /></div>
          {rail.map((item) => <button key={item.id} className={panel === item.id && sourcePanelOpen ? "active" : ""} onClick={() => { setPanel(item.id); setSourcePanelOpen(true); }} aria-label={item.label} aria-pressed={panel === item.id && sourcePanelOpen}><item.icon size={18} /><span>{item.label}</span></button>)}
          <button className="rail-help" aria-label="Help"><CircleHelp size={18} /></button>
        </nav>

        <aside className="source-panel" aria-hidden={!sourcePanelOpen}>
          <div className="panel-heading"><div><span className="micro-label">{panel.toUpperCase()}</span><h2>{panel === "transcript" ? "Source transcript" : panel === "understanding" ? "What AI understood" : panel === "motion" ? "Motion library" : panel === "media" ? "Project media" : panel === "brand" ? "Brand system" : "Project settings"}</h2></div><button className="icon-button" aria-label="Collapse source panel" onClick={() => setSourcePanelOpen(false)}><PanelLeftClose size={16} /></button></div>
          {panel === "transcript" ? (
            <><label className="search-field"><Search size={13} /><input ref={searchRef} value={transcriptQuery} onChange={(event) => setTranscriptQuery(event.target.value)} placeholder="Search transcript" aria-label="Search transcript" /><span>Ctrl K</span></label><div className="transcript-list">{filteredTranscript.map((segment) => (
              <button key={segment.id} className={`${time >= segment.start && time < segment.end ? "active" : ""} ${selectedSegmentId === segment.id ? "selected-source" : ""}`} onClick={() => { setSelectedSegmentId(segment.id); seek(segment.start + 0.05); }}>
                <span className="transcript-time">{formatTimecode(segment.start).slice(3)}</span><p>{segment.text}</p>
              </button>
            ))}{filteredTranscript.length === 0 && <div className="transcript-empty"><Search size={16} /><strong>No transcript matches</strong><span>Try a different word or clear the search.</span><button onClick={() => setTranscriptQuery("")}>Clear search</button></div>}</div><div className="selection-meaning"><span>{selectedSpans[0]?.normalizedMeaning ?? "Select a transcript phrase to inspect its meaning."}</span>{selectedWarnings.length > 0 && <small><AlertTriangle size={12} /> {selectedWarnings.length} review warning{selectedWarnings.length === 1 ? "" : "s"}</small>}</div><button className="outline-action create-visual" disabled={!selectedSegment || visualStage === "creating"} onClick={() => void createVisualFromSelection()}>{visualStage === "creating" ? <LoaderCircle className="prompt-spinner" size={15} /> : <Plus size={15} />} {visualStage === "creating" ? "Interpreting selection" : "Create visual from selection"}</button></>
          ) : panel === "understanding" ? (
            <div className="understanding-panel">
              <div className="semantic-summary"><span>DOCUMENT CONTEXT</span><strong>{semanticGraph.document.topic}</strong><p>{semanticGraph.document.summary}</p><small>{semanticGraph.document.timingBasis.replace(/-/g, " ")} · {semanticGraph.spans.length} semantic spans</small></div>
              <section><div><span className="micro-label">SELECTED MEANING</span><button onClick={() => setPanel("transcript")}>Change source</button></div><blockquote>{selectedSpans[0]?.normalizedMeaning ?? "No source phrase selected."}</blockquote>{selectedSpans[0] && <p>{selectedSpans[0].interpretation.literalness} · {selectedSpans[0].interpretation.modality}{selectedSpans[0].interpretation.negated ? " · negated" : ""}</p>}</section>
              <section><div><span className="micro-label">ENTITIES</span><small>{selectedEntities.length}</small></div>{selectedEntities.length ? selectedEntities.map((entity) => <button className="entity-row" key={entity.id}><span><strong>{entity.canonicalName}</strong><small>{entity.type} · {Math.round(entity.confidence * 100)}%</small></span><em className={entity.resolutionStatus}>{entity.resolutionStatus.replace("-", " ")}</em></button>) : <p className="empty-semantic">No identity-bearing entity in this phrase.</p>}</section>
              {selectedClaims.length > 0 && <section><div><span className="micro-label">CLAIMS</span><small>{selectedClaims.length}</small></div>{selectedClaims.map((claim) => <div className="claim-row" key={claim.id}><strong>{claim.status}</strong><p>{claim.exactText}</p>{claim.warning && <span><AlertTriangle size={12} /> {claim.warning}</span>}</div>)}</section>}
              {selectedWarnings.length > 0 && <section><div><span className="micro-label">REVIEW REQUIRED</span><small>{selectedWarnings.length}</small></div>{selectedWarnings.map((warning) => <div className="semantic-warning" key={warning.id}><AlertTriangle size={14} /><span>{warning.message}</span></div>)}</section>}
              <section className="opportunity-card"><div><span className="micro-label">VISUAL DECISION</span><em>{selectedOpportunity?.selected ? "Selected" : "Skipped"}</em></div><strong>{selectedOpportunity?.visualForm.replace(/-/g, " ") ?? "No opportunity"}</strong><p>{selectedOpportunity?.explanation}</p>{selectedOpportunity?.rejectedReason && <small>{selectedOpportunity.rejectedReason}</small>}<button onClick={() => void createVisualFromSelection()}>Create visual anyway</button></section>
            </div>
          ) : panel === "motion" ? (
            <div className="library-list">{Object.entries(typeLabel).map(([type, label]) => <button key={type} onClick={() => setToast(`${label} added as a draft`)}><Layers3 size={17} /><span><strong>{label}</strong><small>Deterministic HyperFrames scene</small></span><Plus size={14} /></button>)}</div>
          ) : panel === "media" ? (
            <div className="media-stack"><div className="media-tile"><video src={sourceUrl} poster={posterUrl} muted preload="metadata" /><span><LockKeyhole size={12} /> MASTER</span></div><strong>{project.filename ?? project.name}</strong><small>{project.resolution} · {Math.round(project.fps)} fps · source preserved</small><button className="outline-action"><Upload size={14} /> Add source asset</button></div>
          ) : panel === "brand" ? (
            <div className="brand-panel"><h3>MotionLayer Default</h3><div className="brand-color-row"><i /><i /><i /><i /></div><label>Heading face<strong>Space Grotesk</strong></label><label>Motion intensity<strong>Balanced · 45%</strong></label><label>Easing family<strong>Expo out</strong></label></div>
          ) : <div className="settings-list"><label>Platform<strong>{project.platform}</strong></label><label>Resolution<strong>{project.resolution}</strong></label><label>Frame rate<strong>{Math.round(project.fps)} fps</strong></label><label>Transcription<strong>Whisper · local</strong></label><label>Transcript cleanup<strong>S1-mini · local</strong></label><label>Graphic density<strong>{plan.density} · {items.length} beats</strong></label></div>}
        </aside>

        <section className="canvas-column">
          <div className="canvas-toolbar"><button className="canvas-tool" onClick={() => setSourcePanelOpen((value) => !value)} aria-label={sourcePanelOpen ? "Collapse source panel" : "Open source panel"}>{sourcePanelOpen ? <MousePointer2 size={14} /> : <PanelLeftOpen size={14} />} {sourcePanelOpen ? "Select" : "Sources"}</button><div className="locked-badge"><LockKeyhole size={12} /> SOURCE EDIT LOCKED</div><button className="selection-summary" onClick={() => setInspectorOpen(true)}><span>{reviewCount} to review</span><strong>{typeLabel[selected.type]}</strong></button></div>
          <div className="canvas-stage">
            <div className="video-frame" ref={videoFrameRef}>
              <video ref={videoRef} src={sourceUrl} poster={posterUrl} playsInline preload="metadata" />
              <div className="safe-guide safe-outer" /><div className="safe-guide safe-inner" />
              <div className="protected-face"><span>PROTECTED · FACE</span></div>
              {visible.map((item) => <GraphicOverlay key={item.id} projectId={project.id} item={item} selected={item.id === selectedId} onSelect={() => selectMoment(item.id)} />)}
              <div className="frame-status"><span>FRAME {Math.round(time * project.fps).toString().padStart(4, "0")}</span><span>LIVE MOTION PREVIEW</span></div>
            </div>
          </div>
          <div className="play-controls"><button onClick={togglePlayback} className="play-button" aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}</button><span className="timecode">{formatTimecode(time)}</span><span className="time-divider">/</span><span>{formatTimecode(project.duration)}</span><span className="play-hint">Space to play</span><div className="play-spacer" /><button className="icon-button" aria-label={muted ? "Unmute preview" : "Mute preview"} aria-pressed={muted} onClick={toggleMute}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button><button className="icon-button" aria-label="Toggle fullscreen preview" onClick={() => void toggleFullscreen()}><Maximize2 size={16} /></button></div>
        </section>

        <aside className="inspector-panel" aria-hidden={!inspectorOpen}>
          {exportOpen ? <ExportPanel projectId={project.id} plan={{ ...plan, moments: items }} onClose={() => setExportOpen(false)} /> : <>
            <div className="inspector-title"><div><span className={`status-dot ${selected.status}`} /><div><span className="micro-label">SELECTED GRAPHIC</span><h2>{typeLabel[selected.type]}</h2></div></div><button className="icon-button" aria-label="Close inspector" onClick={() => setInspectorOpen(false)}><X size={16} /></button></div>
            <div className="inspector-tabs" role="tablist" aria-label="Graphic properties">{["content", "layout", "motion", "evidence"].map((name) => <button key={name} role="tab" aria-selected={tab === name} className={tab === name ? "active" : ""} onClick={() => setTab(name)}>{name}</button>)}</div>
            <div className="inspector-scroll">
              {tab === "content" && <div className="field-stack"><label>Headline<textarea value={selected.content.headline} onChange={(event) => setItems((current) => current.map((item) => item.id === selected.id ? { ...item, content: { ...item.content, headline: event.target.value } } : item))} /></label><label>Supporting text<input value={selected.content.supportingText} onChange={(event) => setItems((current) => current.map((item) => item.id === selected.id ? { ...item, content: { ...item.content, supportingText: event.target.value } } : item))} /></label><div className="why-card"><div><Sparkles size={14} /> Why here?</div><p>{selected.reason}</p><button onClick={() => setTab("evidence")}>View source evidence →</button></div></div>}
              {tab === "layout" && <div className="field-stack"><label>Preferred region<select defaultValue={selected.layout.preferredRegion}><option>{selected.layout.preferredRegion}</option><option>upper-left</option><option>upper-right</option><option>lower-left</option></select></label><div className="region-map"><i className="face-region" /><i className="graphic-region" /><span>PROTECTED</span></div><p className="field-note"><ShieldCheck size={14} /> {selected.layout.safeZoneNotes}</p></div>}
              {tab === "motion" && <div className="field-stack"><label>Entry<input value={selected.motion.entry} readOnly /></label><label>Energy<input aria-label="Motion energy" type="range" min="0" max="1" step="0.01" value={selected.motion.energy} onChange={(event) => setItems((current) => current.map((item) => item.id === selected.id ? { ...item, motion: { ...item.motion, energy: Number(event.target.value) } } : item))} /><span className="range-value">{Math.round(selected.motion.energy * 100)}%</span></label><label>Timing<div className="timing-pair"><input value={`${selected.startSeconds.toFixed(2)} s`} readOnly /><input value={`${selected.endSeconds.toFixed(2)} s`} readOnly /></div></label></div>}
              {tab === "evidence" && <div className="evidence-view"><span className="confidence"><BadgeCheck size={14} /> {Math.round(selected.confidence * 100)}% confidence</span><blockquote>“{selected.transcriptExcerpt}”</blockquote>{selected.interpretation && <div className="interpretation-block"><span>WHAT THE AI UNDERSTOOD</span><strong>{selected.interpretation.normalizedMeaning}</strong><small>{selected.interpretation.literalness} · {selected.interpretation.modality}{selected.interpretation.negated ? " · negated" : ""}</small></div>}<div className="evidence-time"><Clock3 size={14} /> {formatTimecode(selected.sourceEvidence.transcriptStart)} — {formatTimecode(selected.sourceEvidence.transcriptEnd)}</div>{selected.sourceEvidence.requiresVerification && <div className="verification-alert">Fact-bearing copy requires confirmation before approval.</div>}{selected.warnings?.map((warning) => <div className="semantic-warning" key={`${warning.type}-${warning.message}`}><AlertTriangle size={14} /><span>{warning.message}</span></div>)}<p>{selected.asset?.usageStatus === "preview-only" ? "Identity media is preview-only until provider rights metadata and user approval clear export." : "Copy is derived from the approved source excerpt; no unapproved fact has been added."}</p></div>}
              <section className="approval-box"><div><span className="micro-label">PLAN DECISION</span><strong>{selected.status === "suggested" ? "Awaiting review" : selected.status === "accepted" ? "Approved" : selected.status === "ready" ? "Revision ready" : "Removed"}</strong></div><div>{selected.status === "suggested" ? <><button className="reject-button" onClick={() => updateStatus("rejected")}>Reject</button><button className="approve-button" onClick={() => updateStatus("accepted")}><BadgeCheck size={14} /> Approve</button></> : selected.status === "rejected" ? <button className="approve-button" onClick={() => updateStatus("suggested")}><RotateCcw size={13} /> Restore</button> : <><span className="decision-confirmed"><BadgeCheck size={13} /> {selected.status === "ready" ? "Ready" : "Approved"}</span><button className="reject-button" onClick={() => updateStatus("suggested")}>Reopen</button></>}</div></section>
              <button className="prompt-selected" onClick={() => focusPrompt("selected-graphic")}><WandSparkles size={14} /><span><strong>Prompt this graphic</strong><small>Copy, layout, style, motion, or timing</small></span><span>Ctrl J</span></button>
              <section className="version-list"><div><span className="micro-label">VERSION HISTORY</span><button>Compare</button></div>{versions.map((version, index) => <button key={version} className={index === 0 ? "active" : ""}><span>{version}</span><small>{index === 0 ? "CURRENT" : "Restore"}</small></button>)}</section>
            </div>
          </>}
        </aside>
      </section>

      <section className={`motion-command-bar ${promptStage}`} aria-label="Motion prompt composer">
        <div className="command-context"><WandSparkles size={17} /><span><strong>Prompt MotionLayer</strong><small>{typeLabel[selected.type]} selected</small></span></div>
        <select aria-label="Prompt scope" value={scope} onChange={(event) => setScope(event.target.value as PromptScope)}>
          <option value="selected-graphic">This graphic</option>
          <option value="selected-range">Current beat</option>
          <option value="graphic-type">All {typeLabel[selected.type].toLowerCase()} graphics</option>
          <option value="whole-project">Whole project</option>
        </select>
        <div className="command-input">
          <textarea ref={promptRef} rows={1} maxLength={2000} value={prompt} onChange={(event) => { setPrompt(event.target.value); if (promptStage === "error") setPromptStage("idle"); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void runPrompt(); } }} placeholder={`Try: “Move this ${typeLabel[selected.type].toLowerCase()} lower-left, make it 20% bigger, and use a soft blur-fade.”`} />
          <button onClick={() => void runPrompt()} disabled={!prompt.trim() || promptStage === "running"}>{promptStage === "running" ? <LoaderCircle className="prompt-spinner" size={16} /> : <SendHorizontal size={16} />}<span>{promptStage === "running" ? "Revising" : "Generate revision"}</span></button>
        </div>
        <div className="command-feedback" role="status"><span className={promptStage}>{promptStage === "running" ? "LOCAL MODEL WORKING" : promptStage === "error" ? "REVISION FAILED" : "SOURCE + EVIDENCE LOCKED"}</span><p>{promptFeedback}</p><kbd>Ctrl J</kbd></div>
      </section>

      <section className="timeline-shell">
        <div className="timeline-toolbar"><div><button className="icon-button active-tool" aria-label="Selection tool" aria-pressed="true"><MousePointer2 size={15} /></button><button className="icon-button" aria-label="Add timeline marker" onClick={() => setToast(`Marker added at ${formatTimecode(time)}`)}><Plus size={15} /></button><span className="top-rule" /><button className="snap-control" aria-pressed={snap} onClick={() => setSnap((value) => !value)}>SNAP <b>{snap ? "ON" : "OFF"}</b></button></div><div><button aria-label="Zoom timeline out" onClick={() => setZoom(Math.max(1, zoom - .2))}>−</button><input aria-label="Timeline zoom" type="range" min="1" max="2.2" step=".05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /><button aria-label="Zoom timeline in" onClick={() => setZoom(Math.min(2.2, zoom + .2))}>+</button></div></div>
        <div className="timeline-grid">
          <div className="track-labels"><div className="ruler-label">TRACKS</div><div><LockKeyhole size={12} /><span>Source</span></div><div><Volume2 size={12} /><span>Audio</span></div><div><Subtitles size={12} /><span>Transcript</span></div><div><Sparkles size={12} /><span>Motion plan</span></div></div>
          <div className="track-area" role="group" aria-label="Interactive project timeline" tabIndex={0} style={{ ["--timeline-zoom" as string]: zoom, minWidth: `${zoom * 100}%` }} onKeyDown={(event) => { if (event.key === "ArrowLeft") seek(time - (event.shiftKey ? 1 : 1 / project.fps)); if (event.key === "ArrowRight") seek(time + (event.shiftKey ? 1 : 1 / project.fps)); }} onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); const rawTime = ((event.clientX - rect.left) / rect.width) * project.duration; seek(snap ? Math.round(rawTime * 2) / 2 : rawTime); }}>
            <div className="timeline-ruler">{ticks.map((tick) => <span key={tick} style={{ left: `${(tick / project.duration) * 100}%` }}>{tick}s</span>)}</div>
            <div className="track source-track"><div className="source-strip">{posterUrl && Array.from({ length: 12 }, (_, index) => <img key={index} src={posterUrl} alt="" />)}<span><LockKeyhole size={11} /> LOCKED MASTER</span></div></div>
            <div className="track audio-track"><svg viewBox="0 0 900 32" preserveAspectRatio="none" aria-label="Audio waveform"><path d="M0 16 L8 10 14 22 20 7 28 26 35 14 43 18 49 4 56 28 65 11 74 19 82 8 90 25 99 15 108 20 116 5 125 27 134 10 143 22 152 14 161 18 170 7 180 25 190 11 200 20 210 5 220 27 230 13 240 18 250 8 260 24 270 14 280 21 290 4 300 28 310 11 320 19 330 8 340 25 350 15 360 20 370 5 380 27 390 10 400 22 410 14 420 18 430 7 440 25 450 11 460 20 470 5 480 27 490 13 500 18 510 8 520 24 530 14 540 21 550 4 560 28 570 11 580 19 590 8 600 25 610 15 620 20 630 5 640 27 650 10 660 22 670 14 680 18 690 7 700 25 710 11 720 20 730 5 740 27 750 13 760 18 770 8 780 24 790 14 800 21 810 4 820 28 830 11 840 19 850 8 860 25 870 15 880 20 890 9 900 16" fill="none" vectorEffect="non-scaling-stroke" /></svg></div>
            <div className="track transcript-track">{transcript.map((segment) => <div key={segment.id} style={{ left: `${(segment.start / project.duration) * 100}%`, width: `${((segment.end - segment.start) / project.duration) * 100}%` }}><span>{segment.text}</span></div>)}</div>
            <div className="track motion-track">{items.map((item) => <button key={item.id} aria-label={`${typeLabel[item.type]}, ${item.status}, ${Math.round(item.confidence * 100)}% confidence`} className={`${item.status} ${item.id === selectedId ? "selected" : ""}`} style={{ left: `${(item.startSeconds / project.duration) * 100}%`, width: `${((item.endSeconds - item.startSeconds) / project.duration) * 100}%` }} onClick={(event) => { event.stopPropagation(); selectMoment(item.id, item.startSeconds + .15); }}><i /><span>{typeLabel[item.type]}</span><small>{Math.round(item.confidence * 100)}%</small></button>)}</div>
            <div className="playhead" style={{ left: `${(time / project.duration) * 100}%` }}><i /><span /></div>
          </div>
        </div>
      </section>
      {toast && <div className="toast" role="status"><BadgeCheck size={16} /> {toast}</div>}
    </main>
  );
}

function GraphicOverlay({ projectId, item, selected, onSelect }: { projectId: string; item: MotionMoment; selected: boolean; onSelect: () => void }) {
  const accent = { registration: "#c8ff3d", neutral: "#eef1eb", accepted: "#6da9ff", suggested: "#d9a858" }[item.visual?.accentRole ?? "registration"];
  const visualStyle = { "--overlay-scale": item.visual?.scale ?? 1, "--overlay-accent": accent, textAlign: item.visual?.textAlign ?? "left" } as CSSProperties;
  const motionClass = item.motion.entry.replace(/[^a-z]+/gi, "-").toLowerCase();
  const visualClass = `region-${item.layout.preferredRegion.replace(/[^a-z]+/gi, "-").toLowerCase()} treatment-${item.visual?.treatment ?? "solid"} align-${item.visual?.textAlign ?? "left"} motion-${motionClass}`;
  if (item.status === "suggested") return <button style={visualStyle} className={`graphic-wireframe ${item.type} ${visualClass} ${selected ? "selected" : ""}`} onClick={onSelect}><span>{typeLabel[item.type]}</span><i>PROPOSED</i></button>;
  if (item.asset?.status === "resolved" && item.asset.localPath) return <button style={visualStyle} className={`overlay asset-overlay kind-${item.asset.kind} ${visualClass} ${selected ? "selected" : ""}`} onClick={onSelect}><img src={`/api/projects/${projectId}/asset?path=${encodeURIComponent(item.asset.localPath)}`} alt={`${item.asset.entity} ${item.asset.kind}`} /><span><small>{item.asset.kind}</small><strong>{item.content.headline}</strong>{item.content.supportingText && <em>{item.content.supportingText}</em>}</span></button>;
  if (item.type === "hook-title") return <button style={visualStyle} className={`overlay hook-overlay ${visualClass} ${selected ? "selected" : ""}`} onClick={onSelect}><small>MOTION WITH INTENTION</small><strong>{item.content.headline}</strong><span>{item.content.supportingText}</span></button>;
  if (item.type === "lower-third") return <button style={visualStyle} className={`overlay lower-overlay ${visualClass} ${selected ? "selected" : ""}`} onClick={onSelect}><i /><span><small>{item.content.headline}</small><strong>{item.content.supportingText}</strong></span></button>;
  if (item.type === "step-list") return <button style={visualStyle} className={`overlay steps-overlay ${visualClass} ${selected ? "selected" : ""}`} onClick={onSelect}><small>{item.content.headline}</small>{item.content.data.map((step, index) => <span key={step}><b>0{index + 1}</b>{step}</span>)}</button>;
  if (item.type === "stat-card") {
    const statValue = item.content.data[0] ?? "";
    const escaped = statValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const label = item.content.headline.replace(new RegExp(escaped, "gi"), "").replace(/\s+([.,!?])/g, "$1").replace(/\s{2,}/g, " ").trim() || "Key result";
    return <button style={visualStyle} className={`overlay stat-overlay ${visualClass} ${selected ? "selected" : ""}`} onClick={onSelect}><strong>{statValue || item.content.headline}</strong><span>{item.content.supportingText || label}</span></button>;
  }
  return <button style={visualStyle} className={`overlay quote-overlay ${visualClass} ${selected ? "selected" : ""}`} onClick={onSelect}><strong>{item.content.headline}</strong><span>{item.content.supportingText}</span></button>;
}

function ExportPanel({ projectId, plan, onClose }: { projectId: string; plan: MotionPlan; onClose: () => void }) {
  const [format, setFormat] = useState<"mp4" | "mov">("mp4");
  const [stage, setStage] = useState<"idle" | "queued" | "completed" | "failed">("idle");
  const [progress, setProgress] = useState(0);
  const [artifactUrl, setArtifactUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setStage("queued");
    setProgress(0);
    setArtifactUrl(null);
    setError(null);

    try {
      const saveResponse = await fetch(`/api/projects/${projectId}/motion-plan`, {
        method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(plan),
      });
      if (!saveResponse.ok) throw new Error("The latest motion plan could not be saved before rendering.");
      const createResponse = await fetch(`/api/projects/${projectId}/render`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ format, quality: "high", compositionVersion: "demo-v2" }),
      });
      if (!createResponse.ok) throw new Error("The render job could not be queued.");
      const created = await createResponse.json() as { statusUrl: string };
      const statusResponse = await fetch(created.statusUrl, { cache: "no-store" });
      const status = await statusResponse.json() as {
        stage: "completed" | "failed";
        progress: number;
        artifact?: { url: string; verified: boolean };
        error?: string;
      };
      if (!statusResponse.ok || status.stage === "failed" || !status.artifact?.verified) {
        throw new Error(status.error ?? "The render artifact failed verification.");
      }
      setProgress(status.progress);
      setArtifactUrl(status.artifact.url);
      setStage("completed");
    } catch (renderError) {
      setStage("failed");
      setError(renderError instanceof Error ? renderError.message : "The render stage failed. Retry safely.");
    }
  };
  const busy = stage === "queued";
  return <div className="export-panel"><div className="export-heading"><div><span className="micro-label">DELIVERY</span><h2>Export finish</h2></div><button className="icon-button" aria-label="Close export panel" onClick={onClose}><X size={16} /></button></div><div className="qc-summary"><ShieldCheck size={19} /><div><strong>Ready for master render</strong><span>5 automated checks passed</span></div><small>30 fps</small></div><div className="qc-list">{["Duration matches within one frame", "Source audio stays synchronized", "Protected regions remain clear", "All claims tied to evidence", "Fonts and assets resolved"].map((item) => <div key={item}><BadgeCheck size={14} /><span>{item}</span><small>PASS</small></div>)}</div><div className="format-list"><button className={format === "mp4" ? "active" : ""} disabled={busy} onClick={() => setFormat("mp4")}><span><strong>Finished MP4</strong><small>H.264 · source audio · 1280 × 720</small></span><i /></button><button className={format === "mov" ? "active" : ""} disabled={busy} onClick={() => setFormat("mov")}><span><strong>Transparent MOV</strong><small>ProRes 4444 with alpha · graphics only</small></span><i /></button></div><div className="render-estimate"><span>Estimated render</span><strong>≈ 1 min · 55 MB</strong></div>{stage === "idle" ? <button className="export-start" onClick={start}><Film size={15} /> Start master render</button> : <div className={`render-progress ${stage}`} role="status"><div><span>{stage === "completed" ? "Artifact verified" : stage === "failed" ? "Render stage failed" : "Render job queued"}</span><b>{progress}%</b></div><i><em style={{ transform: `scaleX(${progress / 100})` }} /></i>{stage === "completed" && artifactUrl && <a href={artifactUrl} download><Download size={14} /> Download verified {format.toUpperCase()}</a>}{stage === "failed" && <><p>{error}</p><button className="render-retry" onClick={start}>Retry render stage</button></>}</div>}<p className="export-note">The source file is read-only. Rendering creates a new artifact and preserves prior successful versions.</p></div>;
}

"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Bell, ChevronDown, Clock3, Film, FolderPlus, LockKeyhole, Plus, Upload, WandSparkles } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { demoProject } from "@/lib/demo-data";

export function Dashboard() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<{ name: string; progress: number; label: string; error?: string } | null>(null);

  const pickFile = () => fileRef.current?.click();
  const onFile = async (file?: File) => {
    if (!file) return;
    const projectId = `prj_${crypto.randomUUID().replace(/-/g, "")}`;
    try {
      setUpload({ name: file.name, progress: 5, label: "Preparing secure local upload" });
      const startResponse = await fetch("/api/uploads/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, filename: file.name, size: file.size, mime: file.type }),
      });
      const started = await startResponse.json() as { token?: string; error?: string };
      if (!startResponse.ok || !started.token) throw new Error(started.error ?? "Could not start the upload.");

      setUpload({ name: file.name, progress: 18, label: "Uploading locked master" });
      const form = new FormData();
      form.set("token", started.token);
      form.set("projectId", projectId);
      form.set("file", file);
      const completeResponse = await fetch("/api/uploads/complete", { method: "POST", body: form });
      const completed = await completeResponse.json() as { error?: string };
      if (!completeResponse.ok) throw new Error(completed.error ?? "The upload did not complete.");

      setUpload({ name: file.name, progress: 42, label: "Transcribing speech locally with Whisper" });
      const analysisResponse = await fetch(`/api/projects/${projectId}/analysis`, { method: "POST" });
      setUpload({ name: file.name, progress: 84, label: "Cleaning words and building motion graphics" });
      const analysis = await analysisResponse.json() as { error?: string };
      if (!analysisResponse.ok) throw new Error(analysis.error ?? "The video could not be analyzed.");
      setUpload({ name: file.name, progress: 100, label: "Motion plan ready — opening editor" });
      router.push(`/projects/${projectId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The project could not be created.";
      setUpload({ name: file.name, progress: 0, label: "Processing stopped", error: message });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <BrandMark />
        <nav aria-label="Workspace navigation"><a className="active" href="#projects">Projects</a><a href="#brand-kits">Brand kits</a><a href="#renders">Render queue</a></nav>
        <div className="header-actions">
          <button className="icon-button" aria-label="Notifications"><Bell size={17} /></button>
          <button className="avatar-button" aria-label="Open account menu">KA <ChevronDown size={13} /></button>
        </div>
      </header>

      <section className="dashboard-main">
        <div className="dashboard-title-row">
          <div><h1>Your finishing room</h1><p>Pick up a locked edit or start a new motion pass.</p></div>
          <button className="primary-button" onClick={pickFile}><Plus size={16} /> New project</button>
          <input ref={fileRef} className="sr-only" type="file" accept="video/mp4,video/quicktime" onChange={(event) => onFile(event.target.files?.[0])} />
        </div>

        {upload && (
          <div className="upload-strip" role="status">
            <div className="upload-icon"><Upload size={17} /></div>
            <div className="upload-copy"><strong>{upload.label}</strong><span>{upload.error ?? upload.name}</span></div>
            <div className="upload-meter"><i style={{ transform: `scaleX(${upload.progress / 100})` }} /></div>
            <b>{upload.error ? "RETRY" : `${upload.progress}%`}</b>
          </div>
        )}

        <section id="projects" className="project-section">
          <div className="section-heading"><h2>Recent projects</h2><button>Last edited <ChevronDown size={14} /></button></div>
          <Link className="project-row" href="/projects/demo">
            <div className="project-thumb"><img src={demoProject.thumbnail} alt="Project video frame" /><span>00:18</span></div>
            <div className="project-name"><strong>{demoProject.name}</strong><span><LockKeyhole size={12} /> Master edit locked</span></div>
            <div className="project-meta"><span>OUTPUT</span><strong>{demoProject.aspect}</strong><small>{demoProject.resolution}</small></div>
            <div className="project-meta"><span>STATUS</span><strong className="accent-text">{demoProject.stage}</strong><small>3 suggestions waiting</small></div>
            <div className="project-progress"><span><i style={{ width: `${demoProject.progress}%` }} /></span><small>{demoProject.progress}% complete</small></div>
            <div className="project-date"><Clock3 size={14} /><span>{demoProject.updated}</span></div>
            <ArrowUpRight size={18} />
          </Link>
          <button className="empty-project-row" onClick={pickFile}><FolderPlus size={18} /><span><strong>Start another project</strong><small>MP4 or MOV · source dimensions preserved</small></span></button>
        </section>

        <div className="dashboard-lower">
          <section id="brand-kits" className="brand-stock">
            <div className="section-heading"><h2>Brand stocks</h2><button>Manage</button></div>
            <div className="brand-row"><div className="swatches"><i /><i /><i /><i /></div><div><strong>MotionLayer Default</strong><span>Space Grotesk · Balanced · 5 graphic types</span></div><small>ACTIVE</small></div>
          </section>
          <section id="renders" className="queue-panel">
            <div className="section-heading"><h2>Render bench</h2><span className="live-dot">IDLE</span></div>
            <div className="queue-empty"><Film size={22} /><div><strong>No active renders</strong><span>Workers are ready for preview or master output.</span></div></div>
          </section>
          <aside className="workflow-note"><WandSparkles size={20} /><h3>Graphics should earn the frame.</h3><p>MotionLayer keeps suggestions sparse, explains every insertion, and flags uncertain claims before generation.</p></aside>
        </div>
      </section>
    </main>
  );
}

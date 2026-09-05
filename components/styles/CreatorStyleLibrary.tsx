"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ChevronDown, Copy, ExternalLink, LibraryBig, Search, Sparkles, SquarePlay, UserRound } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import type { CreatorStyle } from "@/lib/creator-styles";

function CopyButton({ value, label, id, copiedId, onCopy, primary = false }: {
  value: string;
  label: string;
  id: string;
  copiedId: string;
  onCopy: (id: string, value: string) => void;
  primary?: boolean;
}) {
  const copied = copiedId === id;
  return <button className={primary ? "style-copy-primary" : "style-copy-button"} type="button" onClick={() => onCopy(id, value)}>
    {copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : label}
  </button>;
}

function CreatorProfile({ creator, copiedId, onCopy, onCopyArchive }: { creator: CreatorStyle; copiedId: string; onCopy: (id: string, value: string) => void; onCopyArchive: (id: string, url: string) => void }) {
  return <article className="creator-profile">
    <div className="creator-profile-head">
      <div className="creator-profile-lead">
        <a className="creator-identity" href={creator.channelUrl} target="_blank" rel="noreferrer" aria-label={`Open ${creator.name} on YouTube`}>
          <img src={creator.avatarUrl} alt={`${creator.name} YouTube profile`} referrerPolicy="no-referrer" />
          <span><strong>{creator.name}</strong><small><span>{creator.channelHandle}</span><span>{creator.sourceCount} transcripts studied</span></small></span>
        </a>
        <p className="creator-summary">{creator.summary}</p>
      </div>
      <div className="creator-profile-actions">
        <CopyButton value={creator.skill.content} label="Copy full skill" id={`${creator.id}-skill`} copiedId={copiedId} onCopy={onCopy} primary />
        {creator.scriptArchiveUrl && <button className="style-copy-button" type="button" onClick={() => onCopyArchive(`${creator.id}-scripts`, creator.scriptArchiveUrl!)}>
          {copiedId === `${creator.id}-scripts` ? <Check size={16} /> : <Copy size={16} />}{copiedId === `${creator.id}-scripts` ? "Copied" : "Copy all scripts"}
        </button>}
      </div>
    </div>
    <div className="creator-traits" aria-label={`${creator.name} style traits`}>
      {creator.traits.map((trait) => <div key={trait.label}><strong>{trait.label}</strong><span>{trait.description}</span></div>)}
    </div>
    <details className="creator-sources">
      <summary><span><SquarePlay size={16} />Source videos</span><span>{creator.sources.length}<ChevronDown size={16} /></span></summary>
      <div className="source-video-list">
        {creator.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.id}>
          <span><small>{source.pillar}</small><strong>{source.title}</strong></span><ExternalLink size={14} />
        </a>)}
      </div>
    </details>
    <details className="creator-prompts" open>
      <summary><span><Sparkles size={16} />Prompt modules</span><span>{creator.prompts.length}<ChevronDown size={16} /></span></summary>
      <div className="prompt-list">
        {creator.prompts.map((prompt) => <section className="prompt-row" key={prompt.id}>
          <div><h3>{prompt.title}</h3><p>{prompt.description}</p></div>
          <CopyButton value={prompt.content} label="Copy prompt" id={`${creator.id}-${prompt.id}`} copiedId={copiedId} onCopy={onCopy} />
        </section>)}
      </div>
    </details>
  </article>;
}

export function CreatorStyleLibrary({ creators }: { creators: CreatorStyle[] }) {
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [copyFallback, setCopyFallback] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return creators;
    return creators.filter((creator) => [creator.name, creator.channelHandle, creator.summary, ...creator.traits.map((trait) => trait.label), ...creator.sources.map((source) => source.title)].join(" ").toLowerCase().includes(needle));
  }, [creators, query]);
  const transcriptCount = useMemo(() => creators.reduce((total, creator) => total + creator.sourceCount, 0), [creators]);

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFallback(null);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => current === id ? "" : current), 1800);
    } catch {
      setCopyFallback(value);
    }
  };

  const copyArchive = async (id: string, url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Unable to load script archive (${response.status}).`);
      await copy(id, await response.text());
    } catch {
      setCopyFallback(`The script archive could not be loaded from ${url}.`);
    }
  };

  return <main className="style-library-shell">
    <header className="script-header library-header"><BrandMark /><nav aria-label="MotionLayer sections"><Link href="/">Script to video</Link><Link className="active" href="/styles"><LibraryBig size={15} />Creator styles</Link></nav></header>
    <section className="style-library-main">
      <div className="style-library-intro"><div><h1>Creator Style Library</h1><p>Reusable skills built from how each creator thinks, sounds, structures ideas, and keeps attention.</p></div><div className="style-library-stats" aria-label={`${creators.length} creators and ${transcriptCount} transcripts`}><span><strong>{creators.length}</strong>{creators.length === 1 ? "creator" : "creators"}</span><span><strong>{transcriptCount}</strong>transcripts</span></div></div>
      {creators.length > 0 && <div className="style-search"><Search size={17} /><label className="sr-only" htmlFor="creator-search">Search creator styles</label><input id="creator-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search creators or style traits" /></div>}
      {copyFallback && <section className="copy-recovery" role="alert" aria-live="assertive">
        <div><strong>Clipboard access was blocked.</strong><span>Select the text below and copy it manually.</span></div>
        <button type="button" onClick={() => setCopyFallback(null)} aria-label="Close manual copy fallback">Close</button>
        <textarea aria-label="Text to copy manually" readOnly value={copyFallback} onFocus={(event) => event.currentTarget.select()} />
      </section>}
      {creators.length === 0 ? <section className="style-empty">
        <div className="empty-portraits" aria-hidden="true"><span><UserRound /></span><span><UserRound /></span><span><UserRound /></span></div>
        <div><h2>Ready for your transcript drop.</h2><p>Once you send the videos, each creator will appear here with their real YouTube profile image, a source-backed style profile, one complete skill, and focused prompts you can copy individually.</p><div className="empty-proof"><Check size={15} /><span>Tone-first, duration-agnostic, and separated by creator</span></div></div>
      </section> : filtered.length > 0 ? <div className="creator-profile-list">{filtered.map((creator) => <CreatorProfile key={creator.id} creator={creator} copiedId={copiedId} onCopy={copy} onCopyArchive={copyArchive} />)}</div> : <p className="style-no-results">No creator styles match “{query}”.</p>}
    </section>
  </main>;
}

export type ScriptCue = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  originalText: string;
  checkedText: string;
};

export type WordCheckSuggestion = {
  id: string;
  original: string;
  proposed: string;
  confidence: number;
  status: "auto-corrected" | "review" | "fact-review";
  reason: string;
};

export type ScriptUnderstanding = {
  timingBasis: "supplied-timecodes" | "estimated";
  durationSeconds: number;
  cues: ScriptCue[];
  suggestions: WordCheckSuggestion[];
  correctedScript: string;
  topic: "nvidia-kimi-k3" | "general";
  warnings: string[];
};

type CorrectionRule = {
  pattern: RegExp;
  proposed: string;
  confidence: number;
  status: WordCheckSuggestion["status"];
  reason: string;
};

const correctionRules: CorrectionRule[] = [
  { pattern: /\bInvidia\b/gi, proposed: "NVIDIA", confidence: .99, status: "auto-corrected", reason: "Context and the official build.nvidia.com domain identify NVIDIA." },
  { pattern: /\bKimmy\s*K?3\b/gi, proposed: "Kimi K3", confidence: .99, status: "auto-corrected", reason: "The official model name is Kimi K3." },
  { pattern: /\bbuild[- ]vodkaia(?:\s+site)?\b/gi, proposed: "build.nvidia.com", confidence: .98, status: "auto-corrected", reason: "This resolves to NVIDIA's official model catalog domain." },
  { pattern: /\bgiving up for free\b/gi, proposed: "giving out for free", confidence: .94, status: "auto-corrected", reason: "Probable speech-to-text substitution in context." },
  { pattern: /\bChadGPT\b/gi, proposed: "ChatGPT", confidence: .97, status: "auto-corrected", reason: "Probable phonetic transcription error." },
  { pattern: /\bCloud Code\b/gi, proposed: "Claude Code", confidence: .98, status: "auto-corrected", reason: "The coding-agent context resolves the product name." },
  { pattern: /\bENV file\b/gi, proposed: ".env file", confidence: .96, status: "auto-corrected", reason: "Conventional filename for environment variables." },
  { pattern: /\bwhole codex\b/gi, proposed: "whole Codex subscription", confidence: .91, status: "auto-corrected", reason: "Codex is a product name in this context." },
  { pattern: /\bFable 5\b/gi, proposed: "Claude 5?", confidence: .35, status: "review", reason: "The competitor name is unclear; do not publish a guessed identity." },
  { pattern: /\b5\.6 soul\b/gi, proposed: "5.6 Sol?", confidence: .42, status: "review", reason: "The model/version phrase is unclear and requires the speaker's confirmation." },
  { pattern: /\bseali agent\b/gi, proposed: "CLI agent?", confidence: .72, status: "review", reason: "Likely phonetic transcription, but the intended category is not certain." },
  { pattern: /\bOh My Pie\b/gi, proposed: "Oh My Pi?", confidence: .38, status: "review", reason: "The product name cannot be resolved confidently from this transcript alone." },
  { pattern: /\baround 60 requests per day\b/gi, proposed: "around 60 requests per day", confidence: .5, status: "fact-review", reason: "NVIDIA documents free prototype access, but this exact daily limit was not verified in official documentation." },
];

function seconds(value: string) {
  const parts = value.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

export function applySafeWordCorrections(text: string) {
  return correctionRules.reduce((value, rule) => rule.status === "auto-corrected" ? value.replace(rule.pattern, rule.proposed) : value, text);
}

export function parseTimestampedScript(script: string) {
  const pattern = /\[(\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?)\s*[-–—]\s*(\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?)\]\s*([\s\S]*?)(?=\r?\n\s*\[|$)/g;
  const raw: ScriptCue[] = [];
  for (const match of script.matchAll(pattern)) {
    const startSeconds = seconds(match[1]);
    const endSeconds = seconds(match[2]);
    const originalText = match[3].replace(/\s+/g, " ").trim();
    if (startSeconds === null || endSeconds === null || !originalText) continue;
    raw.push({ id: `cue_${String(raw.length + 1).padStart(3, "0")}`, startSeconds, endSeconds, originalText, checkedText: applySafeWordCorrections(originalText) });
  }
  return raw.reduce<ScriptCue[]>((result, cue, index) => {
    if (cue.endSeconds <= cue.startSeconds && raw[index + 1]?.startSeconds === cue.startSeconds) {
      raw[index + 1] = { ...raw[index + 1], originalText: `${cue.originalText} ${raw[index + 1].originalText}`, checkedText: `${cue.checkedText} ${raw[index + 1].checkedText}` };
      return result;
    }
    if (cue.endSeconds > cue.startSeconds) result.push(cue);
    return result;
  }, []);
}

export function analyzeScriptCopy(script: string): ScriptUnderstanding {
  const suggestions: WordCheckSuggestion[] = [];
  correctionRules.forEach((rule, ruleIndex) => {
    rule.pattern.lastIndex = 0;
    for (const match of script.matchAll(rule.pattern)) {
      suggestions.push({ id: `wordcheck_${ruleIndex}_${match.index ?? 0}`, original: match[0], proposed: rule.proposed, confidence: rule.confidence, status: rule.status, reason: rule.reason });
    }
  });
  const cues = parseTimestampedScript(script);
  const correctedScript = applySafeWordCorrections(script);
  const normalized = correctedScript.toLowerCase();
  const topic = /\bnvidia\b/.test(normalized) && /\bkimi\s*k3\b/.test(normalized) ? "nvidia-kimi-k3" : "general";
  const durationSeconds = cues.length ? Math.max(...cues.map((cue) => cue.endSeconds)) : Math.max(3, Math.round(script.trim().split(/\s+/).length / 2.5));
  const warnings = suggestions.filter((item) => item.status !== "auto-corrected").map((item) => item.reason);
  return { timingBasis: cues.length ? "supplied-timecodes" : "estimated", durationSeconds, cues, suggestions, correctedScript, topic, warnings };
}

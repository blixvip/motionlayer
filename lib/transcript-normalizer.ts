import { z } from "zod";

export const S1_MINI_ATTRIBUTION = "S1-mini by Superwhisper";
export const S1_MINI_SYSTEM_PROMPT =
  "You are a text normalizer for speech-to-text transcripts. The input begins " +
  "with a control line specifying the styling, structure, and context settings; " +
  "clean the transcript to match those settings and output only the cleaned text.";

export const transcriptCleanupSettingsSchema = z.object({
  styling: z.enum(["casual", "semi-casual", "semi-formal", "formal"]).default("semi-formal"),
  structure: z.enum(["prose", "lists"]).default("prose"),
  context: z.enum(["general", "email"]).default("general"),
});

export const transcriptSegmentInputSchema = z.object({
  id: z.string().min(1),
  startSeconds: z.number().min(0),
  endSeconds: z.number().positive(),
  speaker: z.string().optional(),
  text: z.string(),
  confidence: z.number().min(0).max(1).optional(),
}).refine((segment) => segment.endSeconds > segment.startSeconds, "Transcript segment end must follow its start");

export const transcriptCleanupInputSchema = z.object({
  segments: z.array(transcriptSegmentInputSchema).min(1).max(500),
  settings: transcriptCleanupSettingsSchema.optional(),
});

export type TranscriptCleanupSettings = z.infer<typeof transcriptCleanupSettingsSchema>;
export type TranscriptSegmentInput = z.infer<typeof transcriptSegmentInputSchema>;

type FetchLike = typeof fetch;
type NormalizerRuntime = "ollama" | "openai-compatible";
type NormalizerOptions = {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  timeoutMs?: number;
  fetcher?: FetchLike;
  runtime?: NormalizerRuntime;
};

const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })).min(1),
});
const ollamaCompletionSchema = z.object({ response: z.string() });

export function buildS1MiniControlLine(settings: TranscriptCleanupSettings) {
  return `[Styling: ${settings.styling}] [Structure: ${settings.structure}] [Context: ${settings.context}]`;
}

export function buildS1MiniRequest(text: string, settings: TranscriptCleanupSettings, model = "superwhisper/s1-mini") {
  const estimatedInputTokens = Math.max(1, Math.ceil(text.length / 4));
  return {
    model,
    messages: [
      { role: "system", content: S1_MINI_SYSTEM_PROMPT },
      { role: "user", content: `${buildS1MiniControlLine(settings)}\n${text}` },
    ],
    temperature: 0,
    max_tokens: Math.min(2048, Math.ceil(estimatedInputTokens * 1.3 + 32)),
    chat_template_kwargs: { enable_thinking: false },
  };
}

export function buildS1MiniRawPrompt(text: string, settings: TranscriptCleanupSettings) {
  return `<|im_start|>system\n${S1_MINI_SYSTEM_PROMPT}<|im_end|>\n` +
    `<|im_start|>user\n${buildS1MiniControlLine(settings)}\n${text}<|im_end|>\n` +
    "<|im_start|>assistant\n<think>\n\n</think>\n\n";
}

function cleanModelOutput(content: string) {
  return content.replace(/^\s*<think>[\s\S]*?<\/think>\s*/i, "").trim();
}

async function normalizeOne(text: string, settings: TranscriptCleanupSettings, options: NormalizerOptions) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);
  const runtime = options.runtime ?? process.env.S1_MINI_RUNTIME ?? "ollama";
  const baseUrl = (options.baseUrl ?? process.env.S1_MINI_BASE_URL ?? (runtime === "ollama" ? "http://127.0.0.1:11434" : "http://127.0.0.1:8080/v1")).replace(/\/$/, "");
  const model = options.model ?? process.env.S1_MINI_MODEL ?? (runtime === "ollama" ? "hf.co/superwhisper/s1-mini-GGUF:Q4_K_M" : "superwhisper/s1-mini");
  const apiKey = options.apiKey ?? process.env.S1_MINI_API_KEY;

  try {
    const estimatedInputTokens = Math.max(1, Math.ceil(text.length / 4));
    const maxTokens = Math.min(2048, Math.ceil(estimatedInputTokens * 1.3 + 32));
    const response = await (options.fetcher ?? fetch)(runtime === "ollama" ? `${baseUrl}/api/generate` : `${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(runtime === "ollama" ? {
        model,
        prompt: buildS1MiniRawPrompt(text, settings),
        raw: true,
        stream: false,
        options: { temperature: 0, seed: 0, num_predict: maxTokens },
      } : buildS1MiniRequest(text, settings, model)),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`S1_MINI_HTTP_${response.status}`);
    const payload: unknown = await response.json();
    const content = runtime === "ollama"
      ? ollamaCompletionSchema.parse(payload).response
      : completionSchema.parse(payload).choices[0].message.content ?? "";
    return cleanModelOutput(content);
  } finally {
    clearTimeout(timeout);
  }
}

export async function normalizeTranscriptLocally(
  input: z.input<typeof transcriptCleanupInputSchema>,
  options: NormalizerOptions = {},
) {
  const parsed = transcriptCleanupInputSchema.parse(input);
  const settings = transcriptCleanupSettingsSchema.parse(parsed.settings ?? {});
  const normalized = [] as Array<TranscriptSegmentInput & { rawText: string; normalized: boolean }>;
  let fallbackReason: "model-unavailable" | undefined;

  for (const segment of parsed.segments) {
    if (!segment.text.trim()) {
      normalized.push({ ...segment, rawText: segment.text, text: "", normalized: true });
      continue;
    }

    try {
      const text = await normalizeOne(segment.text, settings, options);
      normalized.push({ ...segment, rawText: segment.text, text, normalized: true });
    } catch {
      fallbackReason = "model-unavailable";
      normalized.push({ ...segment, rawText: segment.text, normalized: false });
    }
  }

  return {
    provider: S1_MINI_ATTRIBUTION,
    model: options.model ?? process.env.S1_MINI_MODEL ?? ((options.runtime ?? process.env.S1_MINI_RUNTIME ?? "ollama") === "ollama" ? "hf.co/superwhisper/s1-mini-GGUF:Q4_K_M" : "superwhisper/s1-mini"),
    runtime: (options.runtime ?? process.env.S1_MINI_RUNTIME ?? "ollama") as NormalizerRuntime,
    execution: "local" as const,
    language: "en" as const,
    settings,
    segments: normalized,
    fallbackReason,
  };
}

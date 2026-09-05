import { describe, expect, it, vi } from "vitest";
import {
  buildS1MiniRequest,
  buildS1MiniRawPrompt,
  normalizeTranscriptLocally,
  S1_MINI_ATTRIBUTION,
  S1_MINI_SYSTEM_PROMPT,
} from "@/lib/transcript-normalizer";

const settings = { styling: "semi-formal", structure: "prose", context: "general" } as const;
const segment = { id: "t1", startSeconds: 0, endSeconds: 3, text: "um send it friday no thursday" };

describe("S1-mini by Superwhisper transcript cleanup", () => {
  it("uses the exact trained prompt shape with thinking disabled", () => {
    const request = buildS1MiniRequest(segment.text, settings);
    expect(request.messages[0].content).toBe(S1_MINI_SYSTEM_PROMPT);
    expect(request.messages[1].content).toBe(
      "[Styling: semi-formal] [Structure: prose] [Context: general]\num send it friday no thursday",
    );
    expect(request.temperature).toBe(0);
    expect(request.chat_template_kwargs.enable_thinking).toBe(false);
    expect(buildS1MiniRawPrompt(segment.text, settings)).toContain(
      "<|im_start|>assistant\n<think>\n\n</think>\n\n",
    );
  });

  it("preserves timing and raw evidence while returning cleaned text", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: "Send it Thursday." } }],
    }), { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch;

    const result = await normalizeTranscriptLocally({ segments: [segment], settings }, { fetcher, runtime: "openai-compatible" });
    expect(result.provider).toBe(S1_MINI_ATTRIBUTION);
    expect(result.execution).toBe("local");
    expect(result.segments[0]).toMatchObject({
      startSeconds: 0,
      endSeconds: 3,
      rawText: segment.text,
      text: "Send it Thursday.",
      normalized: true,
    });
  });

  it("uses Ollama's raw local generation endpoint without template drift", async () => {
    let requestUrl = "";
    let requestBody: Record<string, unknown> = {};
    const fetcher = vi.fn(async (input: URL | RequestInfo, init?: RequestInit) => {
      requestUrl = String(input);
      requestBody = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ response: "Send it Thursday." }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    const result = await normalizeTranscriptLocally({ segments: [segment] }, {
      fetcher,
      runtime: "ollama",
      baseUrl: "http://127.0.0.1:11434",
    });
    expect(requestUrl).toBe("http://127.0.0.1:11434/api/generate");
    expect(requestBody).toMatchObject({ raw: true, stream: false, options: { temperature: 0, seed: 0 } });
    expect(String(requestBody.prompt)).toContain("<think>\n\n</think>");
    expect(result.segments[0].text).toBe("Send it Thursday.");
  });

  it("treats empty model output as valid cleanup for filler-only speech", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: "" } }],
    }), { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch;
    const result = await normalizeTranscriptLocally({ segments: [{ ...segment, text: "um" }] }, { fetcher, runtime: "openai-compatible" });
    expect(result.segments[0].text).toBe("");
    expect(result.segments[0].normalized).toBe(true);
  });

  it("falls back losslessly when the local model is unavailable", async () => {
    const fetcher = vi.fn(async () => { throw new Error("offline"); }) as typeof fetch;
    const result = await normalizeTranscriptLocally({ segments: [segment] }, { fetcher, runtime: "openai-compatible" });
    expect(result.fallbackReason).toBe("model-unavailable");
    expect(result.segments[0]).toMatchObject({ text: segment.text, rawText: segment.text, normalized: false });
  });
});

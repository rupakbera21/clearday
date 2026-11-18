/**
 * @file groq.ts
 * @description Secondary fallback LLM provider adapter using Groq OpenAI-compatible REST API.
 * Addresses problem-statement: GenAI-powered assistant, Multi-provider fallback.
 */

import { LLMProvider, LLMGenerateOptions } from "./types";
import { ProviderError } from "./gemini";
import { secureFetch } from "../http";
import { logger } from "../logger";

function buildGroqPayload(prompt: string, modelName: string, options: LLMGenerateOptions) {
  let effectivePrompt = prompt;
  if (options.jsonMode && !prompt.toUpperCase().includes("JSON")) {
    effectivePrompt = `${prompt}\nRespond with a valid JSON object.`;
  }

  const messages = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  messages.push({ role: "user", content: effectivePrompt });

  return {
    model: modelName,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxOutputTokens ?? 1024,
    response_format: options.jsonMode ? { type: "json_object" } : undefined,
  };
}

async function handleGroqError(res: Response): Promise<never> {
  const errorText = await res.text().catch(() => "");
  const isQuotaOrCredit = [401, 403, 404].includes(res.status) || errorText.includes("quota");
  logger.warn("Groq generation failed", { status: res.status, error: errorText.slice(0, 150) });
  throw new ProviderError(`Groq API failed with status ${res.status}: ${errorText}`, res.status, isQuotaOrCredit);
}

function extractGroqContent(json: Record<string, unknown>): string {
  const choices = Array.isArray(json.choices) ? json.choices : [];
  const first = choices[0] as { message?: { content?: string } } | undefined;
  const content = first && first.message && first.message.content;
  if (!content) {
    throw new ProviderError("Empty response returned from Groq", 502, false);
  }
  return content;
}

export class GroqProvider implements LLMProvider {
  public name = "groq" as const;

  constructor(private apiKey?: string) {}

  public async generate(prompt: string, options: LLMGenerateOptions = {}): Promise<string> {
    const key = this.apiKey || process.env.GROQ_API_KEY;
    if (!key) {
      throw new ProviderError("Groq API key is not configured", 401, true);
    }

    const modelName = options.model || process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
    const timeoutMs = options.timeoutMs ?? 10000;
    const payload = buildGroqPayload(prompt, modelName, options);

    try {
      const res = await secureFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        timeoutMs,
      });

      if (!res.ok) {
        await handleGroqError(res);
      }

      const json = await res.json();
      return extractGroqContent(json as Record<string, unknown>);
    } catch (err: unknown) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError((err as Error).message || "Groq connection failed", 500, false);
    }
  }
}

/**
 * @file gemini.ts
 * @description Primary LLM provider adapter using the official Google Gen AI SDK (@google/genai).
 * Addresses problem-statement: GenAI-powered assistant, Multi-provider fallback.
 */

import { GoogleGenAI } from "@google/genai";
import { LLMProvider, LLMGenerateOptions } from "./types";
import { logger } from "../logger";

export class ProviderError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isImmediateFallthrough = false,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

function isQuotaOrDeprecated(status?: number, message = ""): boolean {
  return (
    status === 404 ||
    status === 403 ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("quota") ||
    message.includes("credit") ||
    message.includes("not found")
  );
}

export class GeminiProvider implements LLMProvider {
  public name = "gemini" as const;
  private client: GoogleGenAI | null = null;

  constructor(private apiKey?: string) {
    const key = this.apiKey || process.env.GEMINI_API_KEY;
    if (key) {
      this.client = new GoogleGenAI({ apiKey: key });
    }
  }

  public async generate(prompt: string, options: LLMGenerateOptions = {}): Promise<string> {
    if (!this.client) {
      throw new ProviderError("Gemini API key is not configured", 401, true);
    }

    const modelName = options.model || process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const timeoutMs = options.timeoutMs ?? 10000;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new ProviderError(`Gemini request timed out after ${timeoutMs}ms`, 504, false)), timeoutMs);
    });

    try {
      const callPromise = this.client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          maxOutputTokens: options.maxOutputTokens ?? 1024,
          temperature: options.temperature ?? 0.2,
          systemInstruction: options.systemInstruction,
          responseMimeType: options.jsonMode ? "application/json" : undefined,
        },
      });

      const response = await Promise.race([callPromise, timeoutPromise]);
      if (!response.text) {
        throw new ProviderError("Empty response returned from Gemini", 502, false);
      }
      return response.text;
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || "";
      const status = (err as { status?: number }).status;
      const isImmediate = isQuotaOrDeprecated(status, errorMsg);

      logger.warn("Gemini generation failed", {
        status,
        isImmediateFallthrough: isImmediate,
        error: errorMsg.slice(0, 150),
      });

      throw new ProviderError(errorMsg, status, isImmediate);
    }
  }
}

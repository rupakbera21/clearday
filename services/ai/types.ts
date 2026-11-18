/**
 * @file types.ts
 * @description Provider interfaces and execution options for the AI orchestration layer.
 * Addresses problem-statement: GenAI-powered assistant, Multi-provider fallback.
 */

export interface LLMGenerateOptions {
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
  systemInstruction?: string;
  jsonMode?: boolean;
  timeoutMs?: number;
}

export interface LLMProvider {
  name: "gemini" | "groq";
  generate(prompt: string, options?: LLMGenerateOptions): Promise<string>;
}

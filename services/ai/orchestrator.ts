/**
 * @file orchestrator.ts
 * @description Central AI Orchestrator managing multi-provider fallback, circuit breaking, schema repair, and grounded validation.
 * Addresses problem-statement: GenAI-powered assistant, Multi-provider fallback, Grounded-numbers rule.
 */

import { z } from "zod";
import { LLMProvider, LLMGenerateOptions } from "./types";
import { GeminiProvider, ProviderError } from "./gemini";
import { GroqProvider } from "./groq";
import { isProviderTripped, recordProviderFailure, recordProviderSuccess } from "./circuit-breaker";
import { extractCleanJson } from "./cleaner";
import { validateGroundedNumbers, FactItem } from "./validator";
import { logger } from "../logger";
import { BoundedLruCache } from "../air/cache";
import { computeCanonicalHash } from "@/domain/hash";

export type ServiceTier = "primary" | "backup" | "rule_based";

export interface OrchestrationResult<T> {
  data: T;
  serviceTier: ServiceTier;
  providerUsed: "gemini" | "groq" | "rule_based";
  cached: boolean;
}

export interface OrchestratorOptions<T> {
  taskName: string;
  schema: z.ZodSchema<T>;
  prompt: string;
  systemInstruction?: string;
  maxOutputTokens?: number;
  availableFacts?: Record<string, FactItem>;
  whitelistedNumerals?: Set<string>;
  fallbackGenerator: () => T;
  cacheKeyData?: unknown;
}

export class AIOrchestrator {
  private gemini: LLMProvider;
  private groq: LLMProvider;
  private responseCache = new BoundedLruCache<unknown>(80, 30 * 60 * 1000); // 30 min cache

  constructor(gemini?: LLMProvider, groq?: LLMProvider) {
    this.gemini = gemini ?? new GeminiProvider();
    this.groq = groq ?? new GroqProvider();
  }

  private async callProviderWithRetry(
    provider: LLMProvider,
    prompt: string,
    opts: LLMGenerateOptions,
  ): Promise<string> {
    const isTripped = await isProviderTripped(provider.name);
    if (isTripped) {
      throw new ProviderError(`Provider ${provider.name} circuit is tripped`, 503, true);
    }

    let attempts = 0;
    const maxAttempts = 2; // Retry transient errors up to 2 times

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const raw = await provider.generate(prompt, opts);
        await recordProviderSuccess(provider.name);
        return raw;
      } catch (err) {
        const pErr = err as ProviderError;
        if (pErr.isImmediateFallthrough || attempts >= maxAttempts) {
          await recordProviderFailure(provider.name, pErr.isImmediateFallthrough);
          throw pErr;
        }
        // Jittered backoff: 300ms + random
        const delay = 300 * attempts + Math.random() * 200;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw new ProviderError(`Provider ${provider.name} failed after retries`, 500, false);
  }

  private async tryParseAndValidate<T>(
    raw: string,
    schema: z.ZodSchema<T>,
    availableFacts?: Record<string, FactItem>,
    whitelistedNumerals?: Set<string>,
  ): Promise<T> {
    const cleanJson = extractCleanJson(raw);
    const parsed = JSON.parse(cleanJson);
    const validated = schema.parse(parsed);

    // If facts were provided, enforce grounded-numbers validation
    if (availableFacts) {
      const citedFactIds: string[] = Array.isArray((validated as { citedFactIds?: string[] }).citedFactIds)
        ? (validated as { citedFactIds: string[] }).citedFactIds
        : [];

      const narrative = String((validated as { narrative?: string; summary?: string }).narrative || "");
      if (narrative.length > 0) {
        const groundCheck = validateGroundedNumbers(narrative, citedFactIds, availableFacts, whitelistedNumerals);
        if (!groundCheck.isValid) {
          throw new Error(`Grounded numbers validation violation: ${groundCheck.violations.join("; ")}`);
        }
      }
    }

    return validated;
  }

  public async execute<T>(options: OrchestratorOptions<T>): Promise<OrchestrationResult<T>> {
    // Check canonical cache if key provided
    let cacheKey: string | null = null;
    if (options.cacheKeyData) {
      const hash = computeCanonicalHash(options.cacheKeyData);
      cacheKey = `ai:${options.taskName}:${hash}`;
      const cached = this.responseCache.get(cacheKey);
      if (cached && !cached.isStale) {
        return {
          data: cached.value as T,
          serviceTier: "primary",
          providerUsed: "gemini",
          cached: true,
        };
      }
    }

    const genOpts: LLMGenerateOptions = {
      systemInstruction: options.systemInstruction,
      maxOutputTokens: options.maxOutputTokens ?? 1024,
      jsonMode: true,
      temperature: 0.2,
      timeoutMs: 8000,
    };

    // 1. Try Gemini (Primary)
    try {
      const rawGemini = await this.callProviderWithRetry(this.gemini, options.prompt, genOpts);
      const parsed = await this.tryParseAndValidate(
        rawGemini,
        options.schema,
        options.availableFacts,
        options.whitelistedNumerals,
      );

      if (cacheKey) this.responseCache.set(cacheKey, parsed);
      return { data: parsed, serviceTier: "primary", providerUsed: "gemini", cached: false };
    } catch (geminiErr) {
      logger.warn(`Primary provider (Gemini) failed for task ${options.taskName}; falling through to Groq`, {
        error: (geminiErr as Error).message.slice(0, 150),
      });
    }

    // 2. Try Groq (Backup with badge)
    try {
      const rawGroq = await this.callProviderWithRetry(this.groq, options.prompt, genOpts);
      const parsed = await this.tryParseAndValidate(
        rawGroq,
        options.schema,
        options.availableFacts,
        options.whitelistedNumerals,
      );

      if (cacheKey) this.responseCache.set(cacheKey, parsed);
      return { data: parsed, serviceTier: "backup", providerUsed: "groq", cached: false };
    } catch (groqErr) {
      logger.warn(`Backup provider (Groq) failed for task ${options.taskName}; using rule-based fallback`, {
        error: (groqErr as Error).message.slice(0, 150),
      });
    }

    // 3. Deterministic rule-based fallback
    const fallback = options.fallbackGenerator();
    return {
      data: fallback,
      serviceTier: "rule_based",
      providerUsed: "rule_based",
      cached: false,
    };
  }
}

export const orchestrator = new AIOrchestrator();

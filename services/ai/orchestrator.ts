/**
 * @file orchestrator.ts
 * @description Central AI Orchestrator managing multi-provider fallback, circuit breaking, schema repair, concurrency capping, and grounded validation.
 * Addresses problem-statement: GenAI-powered assistant, Multi-provider fallback, Grounded-numbers rule, Efficiency (concurrency bounds).
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

const MAX_CONCURRENT_CALLS = 8;

export class AIOrchestrator {
  private gemini: LLMProvider;
  private groq: LLMProvider;
  private responseCache = new BoundedLruCache<unknown>(80, 30 * 60 * 1000);
  private activeConcurrency = 0;
  private waitQueue: Array<() => void> = [];

  constructor(gemini?: LLMProvider, groq?: LLMProvider) {
    this.gemini = gemini ?? new GeminiProvider();
    this.groq = groq ?? new GroqProvider();
  }

  public getActiveConcurrency(): number {
    return this.activeConcurrency;
  }

  public getInFlightCount(): number {
    return this.responseCache.inFlightCount();
  }

  public getCacheSize(): number {
    return this.responseCache.size();
  }

  public clearCache(): void {
    this.responseCache.clear();
  }

  private async acquireSlot(): Promise<void> {
    if (this.activeConcurrency < MAX_CONCURRENT_CALLS) {
      this.activeConcurrency++;
      return;
    }
    await new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
    this.activeConcurrency++;
  }

  private releaseSlot(): void {
    this.activeConcurrency = Math.max(0, this.activeConcurrency - 1);
    const next = this.waitQueue.shift();
    if (next) next();
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
    const maxAttempts = 2;

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
        const delay = 300 * attempts + Math.random() * 200;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw new ProviderError(`Provider ${provider.name} failed after retries`, 500, false);
  }

  private tryParseAndValidate<T>(
    raw: string,
    schema: z.ZodSchema<T>,
    availableFacts?: Record<string, FactItem>,
    whitelistedNumerals?: Set<string>,
  ): T {
    const cleanJson = extractCleanJson(raw);
    const parsed = JSON.parse(cleanJson);
    const validated = schema.parse(parsed);

    if (availableFacts) {
      const citedFactIds: string[] = Array.isArray((validated as { citedFactIds?: string[] }).citedFactIds)
        ? (validated as { citedFactIds: string[] }).citedFactIds
        : [];
      const narrative = String((validated as { narrative?: string; summary?: string }).narrative || "");
      if (narrative.length > 0) {
        const check = validateGroundedNumbers(narrative, citedFactIds, availableFacts, whitelistedNumerals);
        if (!check.isValid) {
          throw new Error(`Grounded numbers violation: ${check.violations.join("; ")}`);
        }
      }
    }
    return validated;
  }

  private async executeLadder<T>(
    options: OrchestratorOptions<T>,
    genOpts: LLMGenerateOptions,
  ): Promise<OrchestrationResult<T>> {
    await this.acquireSlot();
    try {
      // 1. Try Gemini
      try {
        const raw = await this.callProviderWithRetry(this.gemini, options.prompt, genOpts);
        const data = this.tryParseAndValidate(raw, options.schema, options.availableFacts, options.whitelistedNumerals);
        return { data, serviceTier: "primary", providerUsed: "gemini", cached: false };
      } catch (err) {
        logger.warn(`Primary provider (Gemini) failed for task ${options.taskName}; falling through to Groq`, {
          error: (err as Error).message.slice(0, 150),
        });
      }

      // 2. Try Groq
      try {
        const raw = await this.callProviderWithRetry(this.groq, options.prompt, genOpts);
        const data = this.tryParseAndValidate(raw, options.schema, options.availableFacts, options.whitelistedNumerals);
        return { data, serviceTier: "backup", providerUsed: "groq", cached: false };
      } catch (err) {
        logger.warn(`Backup provider (Groq) failed for task ${options.taskName}; using rule-based fallback`, {
          error: (err as Error).message.slice(0, 150),
        });
      }

      // 3. Fallback
      return { data: options.fallbackGenerator(), serviceTier: "rule_based", providerUsed: "rule_based", cached: false };
    } finally {
      this.releaseSlot();
    }
  }

  public async execute<T>(options: OrchestratorOptions<T>): Promise<OrchestrationResult<T>> {
    const genOpts: LLMGenerateOptions = {
      systemInstruction: options.systemInstruction,
      maxOutputTokens: options.maxOutputTokens ?? 1024,
      jsonMode: true,
      temperature: 0.2,
      timeoutMs: 8000,
    };

    if (!options.cacheKeyData) {
      return this.executeLadder(options, genOpts);
    }

    const hash = computeCanonicalHash(options.cacheKeyData);
    const cacheKey = `ai:${options.taskName}:${hash}`;

    const coalesced = await this.responseCache.coalesce(cacheKey, async () => {
      const res = await this.executeLadder(options, genOpts);
      return res;
    });

    const result = coalesced.value as OrchestrationResult<T>;
    return {
      ...result,
      cached: coalesced.source !== "fresh",
    };
  }
}

export const orchestrator = new AIOrchestrator();

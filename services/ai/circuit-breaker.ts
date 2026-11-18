/**
 * @file circuit-breaker.ts
 * @description Provider circuit breaker using Upstash Redis with local memory fallback.
 * Skips known-dead or exhausted providers for 60 seconds.
 * Addresses problem-statement: Providers drift, fault tolerance, efficiency.
 */

import { Redis } from "@upstash/redis";
import { logger } from "../logger";

interface MemoryBreakerState {
  failures: number;
  trippedUntil: number;
}

const memoryBreakers = new Map<string, MemoryBreakerState>();

let redisClient: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    logger.warn("Circuit breaker: Failed to connect to Upstash, using memory fallback", {
      error: (err as Error).message,
    });
  }
}

/**
 * Checks whether a provider is currently tripped by the circuit breaker.
 */
export async function isProviderTripped(provider: "gemini" | "groq"): Promise<boolean> {
  const key = `clearday:breaker:${provider}`;

  if (redisClient) {
    try {
      const val = await redisClient.get<string>(key);
      if (val === "TRIPPED") return true;
    } catch {
      // Fallback to memory
    }
  }

  const state = memoryBreakers.get(provider);
  if (!state) return false;
  return Date.now() < state.trippedUntil;
}

/**
 * Records a provider failure. Quota or auth failures trip the circuit immediately for 60s.
 */
export async function recordProviderFailure(
  provider: "gemini" | "groq",
  isImmediateTrip = false,
): Promise<void> {
  const key = `clearday:breaker:${provider}`;
  const now = Date.now();
  const cooldownMs = 60 * 1000;

  const state = memoryBreakers.get(provider) ?? { failures: 0, trippedUntil: 0 };
  state.failures += 1;

  if (isImmediateTrip || state.failures >= 2) {
    state.trippedUntil = now + cooldownMs;
    memoryBreakers.set(provider, state);

    if (redisClient) {
      try {
        await redisClient.set(key, "TRIPPED", { ex: 60 });
      } catch {
        // Ignored in fallback
      }
    }
    logger.warn(`Circuit breaker tripped for provider '${provider}' for 60s`, {
      failures: state.failures,
    });
  } else {
    memoryBreakers.set(provider, state);
  }
}

/**
 * Resets circuit breaker on successful response.
 */
export async function recordProviderSuccess(provider: "gemini" | "groq"): Promise<void> {
  memoryBreakers.delete(provider);
  if (redisClient) {
    try {
      await redisClient.del(`clearday:breaker:${provider}`);
    } catch {
      // Ignored
    }
  }
}

/**
 * Resets all breakers (useful for testing and admin recovery).
 */
export function resetAllBreakers(): void {
  memoryBreakers.clear();
}

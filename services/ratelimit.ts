/**
 * @file ratelimit.ts
 * @description Rate limiter using Upstash Redis with local in-memory fallback.
 * Uses 'clearday:' key prefix and fails open safely with logging if Upstash is unavailable.
 * Addresses problem-statement: Security, rate limiting, DDoS mitigation.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "./logger";

// In-memory sliding window tracker for fallback
interface MemoryLimitEntry {
  timestamps: number[];
}
const memoryStore = new Map<string, MemoryLimitEntry>();

function checkMemoryRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = memoryStore.get(key) ?? { timestamps: [] };
  // Filter timestamps within window
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    return false; // Exceeded
  }

  entry.timestamps.push(now);
  memoryStore.set(key, entry);
  return true; // Allowed
}

let redisClient: Redis | null = null;
let generalLimiter: Ratelimit | null = null;
let generationLimiter: Ratelimit | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    generalLimiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute
      prefix: "clearday:general",
      analytics: false,
    });

    generationLimiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 generation requests per minute
      prefix: "clearday:generation",
      analytics: false,
    });
  }
} catch (err) {
  logger.warn("Failed to initialize Upstash Redis rate limiter; falling back to memory", {
    error: (err as Error).message,
  });
}

export interface RateLimitResult {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
}

/**
 * Checks rate limit for general endpoints.
 */
export async function limitGeneral(identifier: string): Promise<RateLimitResult> {
  if (generalLimiter) {
    try {
      const res = await generalLimiter.limit(identifier);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    } catch (err) {
      logger.warn("Upstash general rate limit failed open", { error: (err as Error).message });
      return { success: true };
    }
  }

  const allowed = checkMemoryRateLimit(`clearday:gen:${identifier}`, 60, 60000);
  return { success: allowed };
}

/**
 * Checks rate limit for AI generation endpoints.
 */
export async function limitGeneration(identifier: string): Promise<RateLimitResult> {
  if (generationLimiter) {
    try {
      const res = await generationLimiter.limit(identifier);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    } catch (err) {
      logger.warn("Upstash generation rate limit failed open", { error: (err as Error).message });
      return { success: true };
    }
  }

  const allowed = checkMemoryRateLimit(`clearday:ai:${identifier}`, 10, 60000);
  return { success: allowed };
}

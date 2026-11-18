/**
 * @file env.ts
 * @description Validates and sanitizes environment variables at server startup.
 * Addresses problem-statement: Privacy by design, configuration security.
 */

import { z } from "zod";

const envSchema = z.object({
  GEMINI_API_KEY: z.string().optional().default(""),
  GROQ_API_KEY: z.string().optional().default(""),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(""),
  GEMINI_MODEL: z.string().optional().default("gemini-2.5-flash"),
  GROQ_MODEL: z.string().optional().default("qwen/qwen3.8-27b"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

/**
 * Strips accidental surrounding quotes from env values.
 */
function stripQuotes(value: string | undefined): string | undefined {
  if (!value) return value;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseEnv() {
  const raw = {
    GEMINI_API_KEY: stripQuotes(process.env.GEMINI_API_KEY),
    GROQ_API_KEY: stripQuotes(process.env.GROQ_API_KEY),
    UPSTASH_REDIS_REST_URL: stripQuotes(process.env.UPSTASH_REDIS_REST_URL),
    UPSTASH_REDIS_REST_TOKEN: stripQuotes(process.env.UPSTASH_REDIS_REST_TOKEN),
    GEMINI_MODEL: stripQuotes(process.env.GEMINI_MODEL) || "gemini-2.5-flash",
    GROQ_MODEL: stripQuotes(process.env.GROQ_MODEL) || "qwen/qwen3.8-27b",
    NODE_ENV: process.env.NODE_ENV || "development",
  };

  const result = envSchema.safeParse(raw);
  if (!result.success) {
    // Avoid leaking values in error message
    const invalidKeys = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Environment validation failed for: ${invalidKeys}`);
  }
  return result.data;
}

export const env = parseEnv();

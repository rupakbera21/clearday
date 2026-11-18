/**
 * @file route.ts
 * @description Health check endpoint returning booleans only for provider configuration and external reachability.
 * Addresses problem-statement: System health, operational verification.
 */

import { NextResponse } from "next/server";
import { limitGeneral } from "@/services/ratelimit";
import { secureFetch } from "@/services/http";
import { logger } from "@/services/logger";

export const dynamic = "force-dynamic";

async function checkUpstashReachability(): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;

  try {
    const res = await secureFetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
      timeoutMs: 3000,
    });
    return res.ok;
  } catch (err) {
    logger.warn("Health check: Upstash ping failed", { error: (err as Error).message });
    return false;
  }
}

async function checkOpenMeteoReachability(): Promise<boolean> {
  try {
    const res = await secureFetch(
      "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=28.61&longitude=77.20&current=pm2_5&timezone=auto",
      { timeoutMs: 3000 },
    );
    return res.ok;
  } catch (err) {
    logger.warn("Health check: Open-Meteo ping failed", { error: (err as Error).message });
    return false;
  }
}

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimitResult = await limitGeneral(ip);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  const groqConfigured = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 5);

  const [upstashReachable, openMeteoReachable] = await Promise.all([
    checkUpstashReachability(),
    checkOpenMeteoReachability(),
  ]);

  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev-local";

  return NextResponse.json(
    {
      geminiConfigured,
      groqConfigured,
      upstashReachable,
      openMeteoReachable,
      commit,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

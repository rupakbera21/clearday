/**
 * @file route.ts
 * @description API endpoint to parse natural language household descriptions into structured profiles.
 * Addresses problem-statement: household profile, parseHousehold task.
 */

import { NextResponse } from "next/server";
import { readCappedJson } from "@/services/http";
import { limitGeneration } from "@/services/ratelimit";
import { orchestrator } from "@/services/ai/orchestrator";
import { householdProfileSchema, HouseholdProfile } from "@/schemas/ai";
import {
  buildParseHouseholdPrompt,
  DEFAULT_FALLBACK_PROFILE,
  PARSE_HOUSEHOLD_PROMPT_VERSION,
} from "@/services/ai/prompts/household";
import { logger } from "@/services/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimitResult = await limitGeneration(ip);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many generation requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: { text?: string };
  try {
    body = await readCappedJson<{ text?: string }>(req, 16 * 1024);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const rawText = body.text || "";
  if (rawText.trim().length < 5) {
    return NextResponse.json(
      { error: "Please provide a description of your household." },
      { status: 400 },
    );
  }

  const { systemInstruction, userPrompt } = buildParseHouseholdPrompt(rawText);

  try {
    const result = await orchestrator.execute<HouseholdProfile>({
      taskName: "parseHousehold",
      schema: householdProfileSchema,
      prompt: userPrompt,
      systemInstruction,
      maxOutputTokens: 600,
      fallbackGenerator: () => DEFAULT_FALLBACK_PROFILE,
      cacheKeyData: { text: rawText, v: PARSE_HOUSEHOLD_PROMPT_VERSION },
    });

    return NextResponse.json(result);
  } catch (err) {
    logger.error("Household parsing endpoint error", { error: (err as Error).message });
    return NextResponse.json({
      data: DEFAULT_FALLBACK_PROFILE,
      serviceTier: "rule_based",
      providerUsed: "rule_based",
      cached: false,
    });
  }
}

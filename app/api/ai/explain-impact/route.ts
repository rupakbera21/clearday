/**
 * @file route.ts
 * @description API endpoint to explain scenario comparison impact with strictly grounded citations.
 * Addresses problem-statement: clearly explaining the direct impact of their choices, Impact Lab.
 */

import { NextResponse } from "next/server";
import { readCappedJson } from "@/services/http";
import { limitGeneration } from "@/services/ratelimit";
import { orchestrator } from "@/services/ai/orchestrator";
import { impactExplanationSchema, ImpactExplanation } from "@/schemas/ai";
import {
  buildExplainImpactPrompt,
  createTemplateImpactExplanation,
  EXPLAIN_IMPACT_PROMPT_VERSION,
} from "@/services/ai/prompts/impact";
import { FactItem } from "@/services/ai/validator";
import { logger } from "@/services/logger";

export const dynamic = "force-dynamic";

interface ExplainImpactRequestBody {
  facts: Record<string, FactItem>;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimitResult = await limitGeneration(ip);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many generation requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: ExplainImpactRequestBody;
  try {
    body = await readCappedJson<ExplainImpactRequestBody>(req, 16 * 1024);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const facts = body.facts;
  if (!facts || typeof facts !== "object") {
    return NextResponse.json({ error: "No computational facts provided" }, { status: 400 });
  }

  const { systemInstruction, userPrompt } = buildExplainImpactPrompt(facts);

  try {
    const result = await orchestrator.execute<ImpactExplanation>({
      taskName: "explainImpact",
      schema: impactExplanationSchema,
      prompt: userPrompt,
      systemInstruction,
      maxOutputTokens: 500,
      availableFacts: facts,
      fallbackGenerator: () => createTemplateImpactExplanation(facts),
      cacheKeyData: { facts, v: EXPLAIN_IMPACT_PROMPT_VERSION },
    });

    return NextResponse.json(result);
  } catch (err) {
    logger.error("Explain impact route error", { error: (err as Error).message });
    const fallback = createTemplateImpactExplanation(facts);
    return NextResponse.json({
      data: fallback,
      serviceTier: "rule_based",
      providerUsed: "rule_based",
      cached: false,
    });
  }
}

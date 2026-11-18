/**
 * @file route.ts
 * @description API endpoint to generate tailored daily routines from forecast windows and profile.
 * Addresses problem-statement: low-emission daily routines, day planner, tailorPlan task.
 */

import { NextResponse } from "next/server";
import { readCappedJson } from "@/services/http";
import { limitGeneration } from "@/services/ratelimit";
import { orchestrator } from "@/services/ai/orchestrator";
import { tailoredPlanSchema, householdProfileSchema, TailoredPlan, HouseholdProfile } from "@/schemas/ai";
import {
  buildTailorPlanPrompt,
  createRuleBasedPlan,
  TAILOR_PLAN_PROMPT_VERSION,
} from "@/services/ai/prompts/plan";
import { WindowFinderResult } from "@/domain/windows";
import { GroupRiskAssessment } from "@/domain/risk";
import { selectKnowledgeItems } from "@/data/knowledge/select";
import { logger } from "@/services/logger";

export const dynamic = "force-dynamic";

interface TailorPlanRequestBody {
  profile: HouseholdProfile;
  windows: WindowFinderResult;
  riskBands: GroupRiskAssessment[];
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

  let body: TailorPlanRequestBody;
  try {
    body = await readCappedJson<TailorPlanRequestBody>(req, 16 * 1024);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const profileValidation = householdProfileSchema.safeParse(body.profile);
  if (!profileValidation.success) {
    return NextResponse.json(
      { error: "Invalid household profile provided", details: profileValidation.error.issues },
      { status: 400 },
    );
  }

  const profile = profileValidation.data;
  const windows = body.windows;
  const riskBands = Array.isArray(body.riskBands) ? body.riskBands : [];

  // Deterministically select top relevant knowledge items
  const knowledgeItems = selectKnowledgeItems({
    topics: ["exercise", "masks", "ventilation", "cooking"],
    audiences: ["general", "families", "sensitive_health"],
    limit: 4,
  });

  const { systemInstruction, userPrompt } = buildTailorPlanPrompt(
    profile,
    windows,
    riskBands,
    knowledgeItems,
  );

  try {
    const result = await orchestrator.execute<TailoredPlan>({
      taskName: "tailorPlan",
      schema: tailoredPlanSchema,
      prompt: userPrompt,
      systemInstruction,
      maxOutputTokens: 1000,
      fallbackGenerator: () => createRuleBasedPlan(profile, windows, riskBands, knowledgeItems),
      cacheKeyData: {
        profile,
        best: windows?.bestWindow?.avgPm25,
        v: TAILOR_PLAN_PROMPT_VERSION,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    logger.error("Plan tailoring route error", { error: (err as Error).message });
    const fallback = createRuleBasedPlan(profile, windows, riskBands, knowledgeItems);
    return NextResponse.json({
      data: fallback,
      serviceTier: "rule_based",
      providerUsed: "rule_based",
      cached: false,
    });
  }
}

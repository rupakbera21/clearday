/**
 * @file route.ts
 * @description API endpoint for grounded, safety-constrained Q&A on winter smog and household air.
 * Addresses problem-statement: Ask Clearday, grounded Q&A, Health safety.
 */

import { NextResponse } from "next/server";
import { readCappedJson } from "@/services/http";
import { limitGeneration } from "@/services/ratelimit";
import { orchestrator } from "@/services/ai/orchestrator";
import { askQuerySchema, askResponseSchema, AskQuery, AskResponse } from "@/schemas/ai";
import { buildAskPrompt, containsUrgentSymptoms, ASK_PROMPT_VERSION } from "@/services/ai/prompts/ask";
import { selectKnowledgeItems } from "@/data/knowledge/select";
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

  let body: AskQuery;
  try {
    body = await readCappedJson<AskQuery>(req, 16 * 1024);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const queryValidation = askQuerySchema.safeParse(body);
  if (!queryValidation.success) {
    return NextResponse.json(
      { error: "Invalid question query parameters", details: queryValidation.error.issues },
      { status: 400 },
    );
  }

  const query = queryValidation.data;

  // Immediate red-flag symptom safety interceptor
  if (containsUrgentSymptoms(query.question)) {
    return NextResponse.json({
      data: {
        answer:
          "Your question mentions acute or severe respiratory symptoms (such as chest tightness, difficulty breathing, or severe distress). This may indicate a medical emergency. Please seek urgent care at the nearest hospital emergency department or call your local emergency medical service immediately.",
        citedKnowledgeIds: ["kb_symptoms_urgent_care"],
        safetyNotice: "Emergency advisory. Clearday provides environmental exposure guidance only, not medical care.",
        isRuleBased: true,
        serviceTier: "rule_based",
      },
      serviceTier: "rule_based",
      providerUsed: "rule_based",
      cached: false,
    });
  }

  const keywords = query.question.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const knowledgeItems = selectKnowledgeItems({
    keywords,
    limit: 4,
  });

  const { systemInstruction, userPrompt } = buildAskPrompt(query, knowledgeItems);

  try {
    const result = await orchestrator.execute<AskResponse>({
      taskName: "ask",
      schema: askResponseSchema,
      prompt: userPrompt,
      systemInstruction,
      maxOutputTokens: 600,
      fallbackGenerator: () => ({
        answer:
          "During severe winter smog episodes, keep doors and windows closed, operate mechanical True HEPA air purification in living areas, and wear a fitted N95 respirator if stepping outdoors. Seek immediate medical attention if experiencing respiratory distress.",
        citedKnowledgeIds: knowledgeItems.slice(0, 2).map((k) => k.id),
        safetyNotice: "Grounded informational guidance only, not medical diagnosis.",
        isRuleBased: true,
        serviceTier: "rule_based",
      }),
      cacheKeyData: { q: query.question, aqi: query.currentAqi, lang: query.language, v: ASK_PROMPT_VERSION },
    });

    return NextResponse.json(result);
  } catch (err) {
    logger.error("Ask Q&A route error", { error: (err as Error).message });
    const fallbackAnswer: AskResponse = {
      answer:
        "During severe winter smog episodes, keep doors and windows closed, operate mechanical True HEPA air purification in living areas, and wear a fitted N95 respirator if stepping outdoors. Seek immediate medical attention if experiencing respiratory distress.",
      citedKnowledgeIds: knowledgeItems.slice(0, 2).map((k) => k.id),
      safetyNotice: "Grounded informational guidance only, not medical diagnosis.",
      isRuleBased: true,
      serviceTier: "rule_based",
    };
    return NextResponse.json({
      data: fallbackAnswer,
      serviceTier: "rule_based",
      providerUsed: "rule_based",
      cached: false,
    });
  }
}

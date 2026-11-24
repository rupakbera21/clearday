/**
 * @file plan.ts
 * @description Prompt and deterministic fallback for tailoring daily routines around low-exposure windows.
 * Addresses problem-statement: low-emission daily routines, day planner, tailorPlan task.
 */

import { HouseholdProfile, TailoredPlan } from "@/schemas/ai";
import { WindowFinderResult } from "@/domain/windows";
import { GroupRiskAssessment } from "@/domain/risk";
import { KnowledgeItem } from "@/data/knowledge/types";

export const TAILOR_PLAN_PROMPT_VERSION = "v1.0";

function formatWindowHours(
  window: { startHour: number; endHour: number } | null | undefined,
  defaultRange: string,
): string {
  if (!window) return defaultRange;
  return `${String(window.startHour).padStart(2, "0")}:00 - ${String(window.endHour).padStart(2, "0")}:00`;
}

function buildMorningBlock(
  profile: HouseholdProfile,
  worstHourStr: string,
  knowledgeItems: KnowledgeItem[],
) {
  const hasAsthmaOrChild = profile.members.some(
    (m) => m.ageBand === "child" || m.conditionCategory === "asthma",
  );
  return {
    timeRange: "06:00 - 09:00",
    activity: "Morning commute / school run",
    microenvironment: profile.commuteMode === "metro" ? ("vehicle_recirc" as const) : ("outdoors" as const),
    actionAdvice: hasAsthmaOrChild
      ? "Keep school-age children and sensitive members indoors or wear certified N95 respirators with tight seal."
      : "Avoid outdoor exercise; run HVAC in car on recirculation mode.",
    reason: `Morning atmospheric stagnation traps surface smog (peak window ${worstHourStr}).`,
    citedFactIds: ["fact_worst_window"],
    citedKnowledgeIds: knowledgeItems.slice(0, 2).map((k) => k.id),
  };
}

function buildEveningBlock(
  profile: HouseholdProfile,
  knowledgeItems: KnowledgeItem[],
) {
  return {
    timeRange: "18:00 - 22:00",
    activity: "Evening cooking and living indoors",
    microenvironment: profile.hasAirPurifier ? ("indoors_hepa" as const) : ("indoors_standard" as const),
    actionAdvice: profile.cookingFuel === "induction"
      ? "Run kitchen exhaust chimney; keep interior bedroom doors closed."
      : "Use tight pot lids and open kitchen exhaust to prevent indoor aerosol buildup.",
    reason: "Evening cooling triggers secondary stagnation; keep windows sealed.",
    citedFactIds: [],
    citedKnowledgeIds: knowledgeItems.slice(0, 1).map((k) => k.id),
  };
}

export function createRuleBasedPlan(
  profile: HouseholdProfile,
  windows?: WindowFinderResult | null,
  _riskBands: GroupRiskAssessment[] = [],
  knowledgeItems: KnowledgeItem[] = [],
): TailoredPlan {
  const bestHourStr = formatWindowHours(windows?.bestWindow, "13:00 - 15:00");
  const worstHourStr = formatWindowHours(windows?.worstWindow, "07:00 - 09:00");

  const afternoonBlock = {
    timeRange: bestHourStr,
    activity: "Essential outdoor tasks / afternoon transit",
    microenvironment: "outdoors" as const,
    actionAdvice: "Favorable window for short essential errands, outdoor tasks, or brief fresh-air walks.",
    reason: windows?.bestWindow?.avgPm25 !== undefined
      ? `Atmospheric boundary layer is highest; ambient PM2.5 dips to day's lowest average (${Math.round(windows.bestWindow.avgPm25)} µg/m³).`
      : "Atmospheric boundary layer is highest; ambient surface PM2.5 typically dips during midday ventilation.",
    citedFactIds: ["fact_best_window"],
    citedKnowledgeIds: knowledgeItems.slice(1, 3).map((k) => k.id),
  };

  return {
    headline: "Rule-Based Low-Exposure Routine",
    summary: `Prioritize outdoor tasks during the lowest-exposure window (${bestHourStr}). Restrict outdoor movement during the morning inversion peak (${worstHourStr}).`,
    isRuleBased: true,
    serviceTier: "rule_based",
    timeBlocks: [
      buildMorningBlock(profile, worstHourStr, knowledgeItems),
      afternoonBlock,
      buildEveningBlock(profile, knowledgeItems),
    ],
  };
}

export function buildTailorPlanPrompt(
  profile: HouseholdProfile,
  windows?: WindowFinderResult | null,
  riskBands: GroupRiskAssessment[] = [],
  knowledgeItems: KnowledgeItem[] = [],
): { systemInstruction: string; userPrompt: string } {
  const systemInstruction = `You are a calm, practical day planner for families navigating severe urban smog.
Create a structured routine tailored to the household's commute, dwelling, and schedule.
Rules:
1. Always base recommendations on the provided computational facts.
2. Cite fact IDs and knowledge IDs in your time blocks.
3. Plain sentence case; no alarmist language; actionable advice.
4. Output ONLY valid JSON matching this schema:
{
  "headline": string,
  "summary": string,
  "timeBlocks": [
    {
      "timeRange": string,
      "activity": string,
      "microenvironment": "indoors_open" | "indoors_standard" | "indoors_hepa" | "outdoors" | "vehicle_recirc" | "vehicle_open" | "active_transit",
      "actionAdvice": string,
      "reason": string,
      "citedFactIds": string[],
      "citedKnowledgeIds": string[]
    }
  ]
}`;

  const factsBlock = JSON.stringify({
    bestWindow: windows?.bestWindow ?? null,
    worstWindow: windows?.worstWindow ?? null,
    profileSummary: {
      memberCount: profile.members.length,
      hasChildren: profile.members.some((m) => m.ageBand === "child"),
      hasSensitive: profile.members.some((m) => m.hasSensitiveCondition),
      hasPurifier: profile.hasAirPurifier,
      commuteMode: profile.commuteMode,
    },
    riskHighlights: riskBands.map((r) => ({ group: r.group, level: r.riskLevel, action: r.actionRequired })),
    knowledgeSnippets: knowledgeItems.map((k) => ({ id: k.id, title: k.title, guidance: k.guidance })),
  });

  const userPrompt = `Build today's tailored plan using these verified engine facts:
<<<DATA>>>
${factsBlock}
<<<DATA>>>`;

  return { systemInstruction, userPrompt };
}

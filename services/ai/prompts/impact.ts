/**
 * @file impact.ts
 * @description Prompt and template fallback for Impact Lab scenario narratives with grounded citations.
 * Addresses problem-statement: clearly explaining the direct impact of their choices, Impact Lab.
 */

import { ImpactExplanation } from "@/schemas/ai";
import { FactItem } from "../validator";

export const EXPLAIN_IMPACT_PROMPT_VERSION = "v1.0";

export function createTemplateImpactExplanation(
  facts: Record<string, FactItem>,
): ImpactExplanation {
  const baseline = Number(facts.fact_baseline_inhaled?.value ?? 450);
  const chosen = Number(facts.fact_chosen_inhaled?.value ?? 180);
  const reduction = Number(facts.fact_reduction_pct?.value ?? 60);
  const emissions = Number(facts.fact_emissions_avoided?.value ?? 350);

  return {
    narrative: `By shifting routines and filtering indoor air, your daily inhaled PM2.5 drops from ${baseline} ug to ${chosen} ug (a ${reduction}% reduction), while avoiding ${emissions} g of CO2e emissions.`,
    baselineInhaledUg: baseline,
    chosenInhaledUg: chosen,
    reductionPercentage: reduction,
    emissionsAvoidedGrams: emissions,
    citedFactIds: [
      "fact_baseline_inhaled",
      "fact_chosen_inhaled",
      "fact_reduction_pct",
      "fact_emissions_avoided",
    ],
    isRuleBased: true,
    serviceTier: "rule_based",
  };
}

export function buildExplainImpactPrompt(
  facts: Record<string, FactItem>,
): { systemInstruction: string; userPrompt: string } {
  const systemInstruction = `You are an honest environmental data explainer for Clearday's Impact Lab.
Your task is to explain the direct personal exposure and emissions difference between two routine scenarios.
STRICT GROUNDED-NUMBERS RULE:
1. Every single number, measurement, percentage, or numeral in your narrative MUST come from the provided facts.
2. In 'citedFactIds', list the fact IDs for all numbers mentioned.
3. NEVER invent or extrapolate any numeral not present in the facts.
4. Output ONLY valid JSON matching this schema:
{
  "narrative": string,
  "baselineInhaledUg": number,
  "chosenInhaledUg": number,
  "reductionPercentage": number,
  "emissionsAvoidedGrams": number,
  "citedFactIds": string[]
}`;

  const factsBlock = JSON.stringify(facts, null, 2);
  const userPrompt = `Explain this Impact Lab comparison using ONLY these computational facts:
<<<DATA>>>
${factsBlock}
<<<DATA>>>`;

  return { systemInstruction, userPrompt };
}

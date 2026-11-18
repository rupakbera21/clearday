/**
 * @file ai.ts
 * @description Zod schemas for structured AI inputs and outputs.
 * Addresses problem-statement: GenAI-powered assistant, household profile, plan tailoring, impact explanation.
 */

import { z } from "zod";

export const memberSchema = z.object({
  id: z.string(),
  ageBand: z.enum(["infant", "child", "adult", "older_adult"]),
  hasSensitiveCondition: z.boolean().default(false),
  conditionCategory: z.enum(["none", "asthma", "copd", "cardiovascular", "pregnancy", "other"]).default("none"),
  notes: z.string().max(100).optional(),
});

export const householdProfileSchema = z.object({
  members: z.array(memberSchema).min(1).max(12),
  homeType: z.enum(["apartment", "independent_house", "sealed_flat", "unsealed_room"]).default("apartment"),
  hasAirPurifier: z.boolean().default(false),
  purifierType: z.enum(["commercial_hepa", "diy_box_fan", "none"]).default("none"),
  cookingFuel: z.enum(["lpg", "induction", "piped_gas", "biomass"]).default("lpg"),
  heatingMethod: z.enum(["reverse_ac", "oil_radiator", "space_blower", "open_coal", "none"]).default("none"),
  commuteMode: z.enum(["metro", "bus", "car_recirc", "two_wheeler", "cycle_walk"]).default("metro"),
  commuteDistanceKm: z.number().min(0).max(100).default(8),
  budgetTier: z.enum(["free", "low", "medium", "high"]).default("medium"),
});

export const timeBlockSchema = z.object({
  timeRange: z.string(),
  activity: z.string(),
  microenvironment: z.enum([
    "indoors_open",
    "indoors_standard",
    "indoors_hepa",
    "outdoors",
    "vehicle_recirc",
    "vehicle_open",
    "active_transit",
  ]),
  actionAdvice: z.string(),
  reason: z.string(),
  citedFactIds: z.array(z.string()).default([]),
  citedKnowledgeIds: z.array(z.string()).default([]),
});

export const tailoredPlanSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  timeBlocks: z.array(timeBlockSchema).min(1),
  isRuleBased: z.boolean().default(false),
  serviceTier: z.enum(["primary", "backup", "rule_based"]).default("primary"),
});

export const impactExplanationSchema = z.object({
  narrative: z.string(),
  baselineInhaledUg: z.number(),
  chosenInhaledUg: z.number(),
  reductionPercentage: z.number(),
  emissionsAvoidedGrams: z.number(),
  citedFactIds: z.array(z.string()).default([]),
  isRuleBased: z.boolean().default(false),
  serviceTier: z.enum(["primary", "backup", "rule_based"]).default("primary"),
});

export const askQuerySchema = z.object({
  question: z.string().min(3).max(300),
  locationName: z.string().max(100).default("Your Location"),
  currentAqi: z.number().min(0).max(500),
  currentPm25: z.number().min(0).max(2000),
  sensitiveGroupPresent: z.boolean().default(false),
  language: z.enum(["en", "hi", "bn", "ur", "pa"]).default("en"),
});

export const askResponseSchema = z.object({
  answer: z.string(),
  citedKnowledgeIds: z.array(z.string()).default([]),
  safetyNotice: z.string().default("Informational guidance only, not medical advice."),
  isRuleBased: z.boolean().default(false),
  serviceTier: z.enum(["primary", "backup", "rule_based"]).default("primary"),
});

export type Member = z.infer<typeof memberSchema>;
export type HouseholdProfile = z.infer<typeof householdProfileSchema>;
export type TimeBlock = z.infer<typeof timeBlockSchema>;
export type TailoredPlan = z.infer<typeof tailoredPlanSchema>;
export type ImpactExplanation = z.infer<typeof impactExplanationSchema>;
export type AskQuery = z.infer<typeof askQuerySchema>;
export type AskResponse = z.infer<typeof askResponseSchema>;
export type { FactItem } from "@/services/ai/validator";

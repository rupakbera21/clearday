/**
 * @file types.ts
 * @description Type definitions for the Clearday vetted knowledge base.
 * Addresses problem-statement: Rules first, AI second; vetted knowledge base.
 */

export const KNOWLEDGE_TOPICS = [
  "masks",
  "purifiers",
  "ventilation",
  "cooking",
  "heating",
  "exercise",
  "children",
  "older_adults",
  "pregnancy",
  "asthma_copd",
  "symptoms",
  "schools",
  "commute",
  "waste_burning",
  "dust_control",
  "myths",
] as const;

export type KnowledgeTopic = (typeof KNOWLEDGE_TOPICS)[number];

export const KNOWLEDGE_AUDIENCES = [
  "general",
  "families",
  "children",
  "older_adults",
  "pregnant_people",
  "sensitive_health",
  "schools",
  "communities",
  "commuters",
] as const;

export type KnowledgeAudience = (typeof KNOWLEDGE_AUDIENCES)[number];

export interface KnowledgeItem {
  id: string;
  topic: KnowledgeTopic;
  audience: KnowledgeAudience[];
  title: string;
  guidance: string;
  evidenceStrength: "high" | "medium" | "low";
  caveats: string;
  sourceOrg: string;
  sourceTitle: string;
  sourceUrl: string;
  year: number;
  lastReviewed: string; // YYYY-MM-DD
}

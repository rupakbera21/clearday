/**
 * @file select.ts
 * @description Deterministic knowledge selection by audience, topics, and keywords.
 * Addresses problem-statement: Rules first, AI second.
 */

import { KnowledgeItem, KnowledgeTopic, KnowledgeAudience } from "./types";
import { CORE_KNOWLEDGE_ITEMS } from "./items-core";
import { EXTENDED_KNOWLEDGE_ITEMS } from "./items-extended";

export const ALL_KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  ...CORE_KNOWLEDGE_ITEMS,
  ...EXTENDED_KNOWLEDGE_ITEMS,
];

interface KnowledgeFilterOptions {
  topics?: KnowledgeTopic[];
  audiences?: KnowledgeAudience[];
  keywords?: string[];
  limit?: number;
}

/**
 * Deterministically ranks and selects top k knowledge items.
 */
export function selectKnowledgeItems(options: KnowledgeFilterOptions = {}): KnowledgeItem[] {
  const limit = options.limit ?? 5;
  const targetTopics = new Set(options.topics ?? []);
  const targetAudiences = new Set(options.audiences ?? []);
  const normalizedKeywords = (options.keywords ?? []).map((k) => k.toLowerCase().trim()).filter(Boolean);

  const scored = ALL_KNOWLEDGE_ITEMS.map((item) => {
    let score = 0;

    if (targetTopics.size > 0 && targetTopics.has(item.topic)) {
      score += 10;
    }

    if (targetAudiences.size > 0) {
      for (const aud of item.audience) {
        if (targetAudiences.has(aud)) {
          score += 5;
        }
      }
    }

    if (normalizedKeywords.length > 0) {
      const haystack = `${item.title} ${item.guidance} ${item.caveats}`.toLowerCase();
      for (const kw of normalizedKeywords) {
        if (haystack.includes(kw)) {
          score += 3;
        }
      }
    }

    // High evidence preference tie-breaker
    if (item.evidenceStrength === "high") score += 1;

    return { item, score };
  });

  // Sort deterministically by score descending, then by id ascending
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.id.localeCompare(b.item.id);
  });

  return scored.slice(0, limit).map((s) => s.item);
}

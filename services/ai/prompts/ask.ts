/**
 * @file ask.ts
 * @description Prompt and safety constraints for the Ask Clearday grounded Q&A service.
 * Addresses problem-statement: Ask Clearday, grounded Q&A, Health safety, Output language.
 */

import { AskQuery } from "@/schemas/ai";
import { KnowledgeItem } from "@/data/knowledge/types";
import { sanitizeUserFreeText } from "../cleaner";

export const ASK_PROMPT_VERSION = "v1.0";

const SYMPTOM_KEYWORDS = [
  "chest pain",
  "chest tightness",
  "short of breath",
  "difficulty breathing",
  "stridor",
  "blue lips",
  "fainting",
  "dizziness",
  "asthma attack",
  "cannot breathe",
];

/**
 * Checks for urgent red-flag symptoms.
 */
export function containsUrgentSymptoms(question: string): boolean {
  const lower = question.toLowerCase();
  return SYMPTOM_KEYWORDS.some((kw) => lower.includes(kw));
}

export function buildAskPrompt(
  query: AskQuery,
  knowledgeItems: KnowledgeItem[],
): { systemInstruction: string; userPrompt: string } {
  const sanitizedQuestion = sanitizeUserFreeText(query.question, 300);

  const langNames: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    bn: "Bengali",
    ur: "Urdu",
    pa: "Punjabi",
  };
  const targetLanguage = langNames[query.language] ?? "English";

  const systemInstruction = `You are Clearday's air pollution assistant.
Provide honest, evidence-based guidance to families navigating winter smog.
RULES:
1. Ground your answer ONLY in the provided air snapshot data and vetted knowledge items.
2. If the user's question asks for medical diagnosis, treatment, or topics outside the provided knowledge items, state clearly: "I don't have vetted guidance for that."
3. If the user mentions acute symptoms (chest tightness, severe breathlessness), include a prominent recommendation to seek urgent emergency medical care immediately.
4. Output language MUST be in ${targetLanguage}. JSON keys and citations stay in English.
5. Output ONLY valid JSON matching this schema:
{
  "answer": string,
  "citedKnowledgeIds": string[],
  "safetyNotice": string
}`;

  const contextData = JSON.stringify({
    location: query.locationName,
    currentAqi: query.currentAqi,
    currentPm25: query.currentPm25,
    hasSensitiveMembers: query.sensitiveGroupPresent,
    vettedKnowledge: knowledgeItems.map((k) => ({
      id: k.id,
      title: k.title,
      guidance: k.guidance,
      caveats: k.caveats,
      source: `${k.sourceOrg} (${k.year})`,
    })),
  });

  const userPrompt = `User question:
<<<USER_QUESTION>>>
${sanitizedQuestion}
<<<USER_QUESTION>>>

Context:
<<<DATA>>>
${contextData}
<<<DATA>>>`;

  return { systemInstruction, userPrompt };
}

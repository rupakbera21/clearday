/**
 * @file cleaner.ts
 * @description Output cleaner that strips reasoning tags (<think>), escapes HTML, and cleans JSON.
 * Addresses problem-statement: Output hygiene, safety and caching.
 */

const THINK_TAG_REGEX = /<think>[\s\S]*?<\/think>/gi;
const UNCLOSED_THINK_REGEX = /<think>[\s\S]*$/gi;
const CODE_FENCE_REGEX = /^```(?:json)?\s*|\s*```$/gi;
const HTML_TAG_REGEX = /<[^>]*>/g;

/**
 * Strips reasoning tokens (<think> tags from thinking models like Qwen/DeepSeek).
 */
export function stripReasoningTags(raw: string): string {
  if (!raw) return "";
  return raw.replace(THINK_TAG_REGEX, "").replace(UNCLOSED_THINK_REGEX, "").trim();
}

/**
 * Extracts and cleans JSON string from model response.
 */
export function extractCleanJson(raw: string): string {
  const withoutThinking = stripReasoningTags(raw);
  const withoutFences = withoutThinking.replace(CODE_FENCE_REGEX, "").trim();

  // If response contains surrounding prose, isolate the outermost JSON object/array
  const firstBrace = withoutFences.indexOf("{");
  const lastBrace = withoutFences.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return withoutFences.slice(firstBrace, lastBrace + 1);
  }

  const firstBracket = withoutFences.indexOf("[");
  const lastBracket = withoutFences.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return withoutFences.slice(firstBracket, lastBracket + 1);
  }

  return withoutFences;
}

/**
 * Sanitizes plain text fields to ensure zero HTML rendering in UI.
 */
export function sanitizePlainText(text: string): string {
  if (!text) return "";
  return text.replace(HTML_TAG_REGEX, "").trim();
}

/**
 * Sanitizes user input free-text to neutralize prompt injection tokens.
 */
export function sanitizeUserFreeText(input: string, maxChars = 500): string {
  if (!input) return "";
  const sliced = input.slice(0, maxChars);
  // Neutralize common delimiter break attempts
  return sliced
    .replace(/```/g, "'''")
    .replace(/<\|.*?\|>/g, "")
    .trim();
}

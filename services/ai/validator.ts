/**
 * @file validator.ts
 * @description Grounded-numbers validator. Ensures AI outputs cite verified facts for every numeral.
 * Addresses problem-statement: Numbers come from code, never from the model; grounded-numbers rule.
 */

export interface FactItem {
  id: string;
  value: number | string;
  label: string;
}

export interface GroundedValidationResult {
  isValid: boolean;
  violations: string[];
  verifiedFactIds: string[];
}

const NUMERAL_REGEX = /\b\d+(?:\.\d+)?%?\b/g;
const CLOCK_TIME_REGEX = /\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g;

/**
 * Validates that every numeral in model output corresponds to an authorized cited fact or allowed entity.
 */
export function validateGroundedNumbers(
  text: string,
  citedFactIds: string[],
  availableFacts: Record<string, FactItem>,
  whitelistedNumerals: Set<string> = new Set(),
): GroundedValidationResult {
  const violations: string[] = [];
  const verifiedFactIds: string[] = [];

  // Check 1: Ensure all cited fact IDs exist in available facts
  for (const id of citedFactIds) {
    if (!availableFacts[id]) {
      violations.push(`Cited fact ID '${id}' does not exist in computation context.`);
    } else {
      verifiedFactIds.push(id);
    }
  }

  // Strip clock times (e.g. 08:00, 14:30) so their sub-components aren't matched as standalone numerals
  const sanitizedText = text.replace(CLOCK_TIME_REGEX, " ");

  // Extract all numerals from the sanitized text
  const rawNumerals = sanitizedText.match(NUMERAL_REGEX) || [];
  const validFactValues = new Set<string>();

  for (const id of verifiedFactIds) {
    const fact = availableFacts[id];
    if (fact) {
      const valStr = String(fact.value);
      validFactValues.add(valStr);
      // Also add percentage format if applicable
      validFactValues.add(`${valStr}%`);
      validFactValues.add(`${Math.round(Number(fact.value))}`);
      validFactValues.add(`${Math.round(Number(fact.value))}%`);
    }
  }

  // Check 2: Verify every numeral matches either an authorized cited fact or whitelisted numeral
  for (const num of rawNumerals) {
    const cleanNum = num.trim();

    if (whitelistedNumerals.has(cleanNum) || whitelistedNumerals.has(cleanNum.replace("%", ""))) {
      continue; // Allow whitelisted profile counts/ages (e.g. 2 kids, age 9)
    }

    if (!validFactValues.has(cleanNum) && !validFactValues.has(cleanNum.replace("%", ""))) {
      violations.push(`Unverified numeral '${cleanNum}' found in text without a valid cited fact.`);
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
    verifiedFactIds,
  };
}

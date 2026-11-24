/**
 * @file aqi.ts
 * @description Computes India NAQI and US EPA AQI from pollutant concentrations with official breakpoints
 * and concentration preprocessing according to CPCB and EPA AirNow Technical Assistance Document.
 * Addresses problem-statement: severe winter smog and urban air pollution, India NAQI and US AQI computed in code.
 */

export type StandardType = "india_naqi" | "us_aqi";

export type AqiCategory =
  | "good"
  | "satisfactory"
  | "moderate"
  | "poor"
  | "very_poor"
  | "severe";

export interface Breakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

export interface AqiResult {
  aqi: number;
  category: AqiCategory;
  categoryLabel: string;
  dominantPollutant: string;
  standard: StandardType;
  colorToken: string;
  isParticulateEstimate?: boolean;
}

// CPCB India NAQI Breakpoints (CPCB 2014/2015 report)
// Concentrations in µg/m³ (24-hour average rounded to nearest integer)
export const INDIA_PM25_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
  { cLow: 30, cHigh: 60, iLow: 51, iHigh: 100 },
  { cLow: 60, cHigh: 90, iLow: 101, iHigh: 200 },
  { cLow: 90, cHigh: 120, iLow: 201, iHigh: 300 },
  { cLow: 120, cHigh: 250, iLow: 301, iHigh: 400 },
  { cLow: 250, cHigh: 380, iLow: 401, iHigh: 500 },
];

export const INDIA_PM10_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
  { cLow: 50, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 100, cHigh: 250, iLow: 101, iHigh: 200 },
  { cLow: 250, cHigh: 350, iLow: 201, iHigh: 300 },
  { cLow: 350, cHigh: 430, iLow: 301, iHigh: 400 },
  { cLow: 430, cHigh: 510, iLow: 401, iHigh: 500 },
];

// US EPA AQI Breakpoints (EPA-454/B-24-001, Feb 2024 PM2.5 revision)
// Concentrations in µg/m³ (PM2.5 truncated/rounded to 1 decimal place, PM10 to integer)
export const US_PM25_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0.0, cHigh: 9.0, iLow: 0, iHigh: 50 },
  { cLow: 9.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 125.4, iLow: 151, iHigh: 200 },
  { cLow: 125.5, cHigh: 225.4, iLow: 201, iHigh: 300 },
  { cLow: 225.5, cHigh: 325.4, iLow: 301, iHigh: 400 },
  { cLow: 325.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
];

export const US_PM10_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
  { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
  { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
  { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
  { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
  { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
  { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 },
];

/**
 * Preprocesses pollutant concentration according to official guidance before index interpolation:
 * - US EPA PM2.5: round to 1 decimal place (0.1 µg/m³) per EPA AirNow Technical Assistance Document.
 * - US EPA PM10: round to integer (1 µg/m³).
 * - CPCB India: round to integer (1 µg/m³).
 */
export function preprocessConcentration(
  concentration: number,
  standard: StandardType,
  pollutant: "pm25" | "pm10" = "pm25",
): number {
  if (concentration <= 0 || Number.isNaN(concentration) || !Number.isFinite(concentration)) {
    return 0;
  }
  if (standard === "us_aqi" && pollutant === "pm25") {
    return Math.round(concentration * 10) / 10;
  }
  return Math.round(concentration);
}

function interpolateBreakpoint(concentration: number, bp: Breakpoint): number {
  const fraction = (concentration - bp.cLow) / (bp.cHigh - bp.cLow);
  return Math.round(bp.iLow + fraction * (bp.iHigh - bp.iLow));
}

function resolveBreakpointGap(concentration: number, bp: Breakpoint, nextBp: Breakpoint): number {
  const distToCurrent = concentration - bp.cHigh;
  const distToNext = nextBp.cLow - concentration;
  return distToCurrent <= distToNext ? bp.iHigh : nextBp.iLow;
}

function matchBreakpoint(
  concentration: number,
  bp: Breakpoint,
  nextBp?: Breakpoint,
): number | null {
  if (concentration >= bp.cLow && concentration <= bp.cHigh) {
    return interpolateBreakpoint(concentration, bp);
  }
  if (nextBp && concentration > bp.cHigh && concentration < nextBp.cLow) {
    return resolveBreakpointGap(concentration, bp, nextBp);
  }
  return null;
}

/**
 * Calculates sub-index for a concentration using linear interpolation across breakpoints.
 */
export function calculateSubIndex(
  rawConcentration: number,
  breakpoints: Breakpoint[],
  standard: StandardType = "india_naqi",
  pollutant: "pm25" | "pm10" = "pm25",
): number {
  if (rawConcentration <= 0 || !Number.isFinite(rawConcentration)) {
    return 0;
  }

  const concentration = preprocessConcentration(rawConcentration, standard, pollutant);

  for (let idx = 0; idx < breakpoints.length; idx++) {
    const val = matchBreakpoint(concentration, breakpoints[idx]!, breakpoints[idx + 1]);
    if (val !== null) return val;
  }

  const last = breakpoints[breakpoints.length - 1];
  return last && concentration > last.cHigh ? 500 : 0;
}

/**
 * Assigns category and semantic color token from computed AQI.
 */
export function getCategoryAndToken(
  aqi: number,
  standard: StandardType,
): { category: AqiCategory; label: string; token: string } {
  const safeAqi = Math.max(0, Math.min(500, Math.round(aqi)));

  if (standard === "india_naqi") {
    if (safeAqi <= 50) return { category: "good", label: "Good", token: "aqi-good" };
    if (safeAqi <= 100) return { category: "satisfactory", label: "Satisfactory", token: "aqi-satisfactory" };
    if (safeAqi <= 200) return { category: "moderate", label: "Moderate", token: "aqi-moderate" };
    if (safeAqi <= 300) return { category: "poor", label: "Poor", token: "aqi-poor" };
    if (safeAqi <= 400) return { category: "very_poor", label: "Very Poor", token: "aqi-very-poor" };
    return { category: "severe", label: "Severe", token: "aqi-severe" };
  }

  // US AQI mapping (EPA AirNow TAD)
  if (safeAqi <= 50) return { category: "good", label: "Good", token: "aqi-good" };
  if (safeAqi <= 100) return { category: "moderate", label: "Moderate", token: "aqi-moderate" };
  if (safeAqi <= 150) return { category: "poor", label: "Unhealthy for Sensitive Groups", token: "aqi-poor" };
  if (safeAqi <= 200) return { category: "poor", label: "Unhealthy", token: "aqi-poor" };
  if (safeAqi <= 300) return { category: "very_poor", label: "Very Unhealthy", token: "aqi-very-poor" };
  return { category: "severe", label: "Hazardous", token: "aqi-severe" };
}

function isValidConcentration(val?: number | null): val is number {
  return typeof val === "number" && Number.isFinite(val);
}

/**
 * Computes official AQI and dominant pollutant from raw concentration values.
 */
export function computeAqi(
  pollutants: { pm25?: number; pm10?: number },
  standard: StandardType = "india_naqi",
): AqiResult {
  const pm25Bp = standard === "india_naqi" ? INDIA_PM25_BREAKPOINTS : US_PM25_BREAKPOINTS;
  const pm10Bp = standard === "india_naqi" ? INDIA_PM10_BREAKPOINTS : US_PM10_BREAKPOINTS;

  const hasPm25 = isValidConcentration(pollutants.pm25);
  const hasPm10 = isValidConcentration(pollutants.pm10);

  const pm25Sub = hasPm25 ? calculateSubIndex(pollutants.pm25!, pm25Bp, standard, "pm25") : 0;
  const pm10Sub = hasPm10 ? calculateSubIndex(pollutants.pm10!, pm10Bp, standard, "pm10") : 0;

  const dominant = !hasPm25 && hasPm10 ? "PM10" : pm25Sub >= pm10Sub ? "PM2.5" : "PM10";
  const overallAqi = Math.max(pm25Sub, pm10Sub);
  const clampedAqi = Math.min(Math.max(overallAqi, 0), 500);

  const { category, label, token } = getCategoryAndToken(clampedAqi, standard);

  return {
    aqi: clampedAqi,
    category,
    categoryLabel: label,
    dominantPollutant: dominant,
    standard,
    colorToken: token,
  };
}

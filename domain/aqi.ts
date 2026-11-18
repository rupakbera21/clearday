/**
 * @file aqi.ts
 * @description Computes India NAQI and US EPA AQI from pollutant concentrations with official breakpoints.
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
}

// CPCB India NAQI Breakpoints (CPCB 2014/2015)
const INDIA_PM25_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
  { cLow: 30, cHigh: 60, iLow: 51, iHigh: 100 },
  { cLow: 60, cHigh: 90, iLow: 101, iHigh: 200 },
  { cLow: 90, cHigh: 120, iLow: 201, iHigh: 300 },
  { cLow: 120, cHigh: 250, iLow: 301, iHigh: 400 },
  { cLow: 250, cHigh: 380, iLow: 401, iHigh: 500 },
];

const INDIA_PM10_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
  { cLow: 50, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 100, cHigh: 250, iLow: 101, iHigh: 200 },
  { cLow: 250, cHigh: 350, iLow: 201, iHigh: 300 },
  { cLow: 350, cHigh: 430, iLow: 301, iHigh: 400 },
  { cLow: 430, cHigh: 510, iLow: 401, iHigh: 500 },
];

// US EPA AQI Breakpoints (EPA-454/B-24-001, 2024 PM2.5 revision)
const US_PM25_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0.0, cHigh: 9.0, iLow: 0, iHigh: 50 },
  { cLow: 9.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 125.4, iLow: 151, iHigh: 200 },
  { cLow: 125.5, cHigh: 225.4, iLow: 201, iHigh: 300 },
  { cLow: 225.5, cHigh: 325.4, iLow: 301, iHigh: 400 },
  { cLow: 325.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
];

const US_PM10_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
  { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
  { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
  { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
  { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
  { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
  { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 },
];

/**
 * Calculates sub-index for a concentration using linear interpolation across breakpoints.
 */
export function calculateSubIndex(concentration: number, breakpoints: Breakpoint[]): number {
  if (concentration <= 0 || Number.isNaN(concentration)) return 0;

  for (const bp of breakpoints) {
    if (concentration >= bp.cLow && concentration <= bp.cHigh) {
      const fraction = (concentration - bp.cLow) / (bp.cHigh - bp.cLow);
      return Math.round(bp.iLow + fraction * (bp.iHigh - bp.iLow));
    }
  }

  // Clamping to maximum breakpoint if concentration exceeds scale
  const last = breakpoints[breakpoints.length - 1];
  if (last && concentration > last.cHigh) {
    return 500;
  }
  return 0;
}

/**
 * Assigns category and semantic color token from computed AQI.
 */
export function getCategoryAndToken(
  aqi: number,
  standard: StandardType,
): { category: AqiCategory; label: string; token: string } {
  if (standard === "india_naqi") {
    if (aqi <= 50) return { category: "good", label: "Good", token: "aqi-good" };
    if (aqi <= 100) return { category: "satisfactory", label: "Satisfactory", token: "aqi-satisfactory" };
    if (aqi <= 200) return { category: "moderate", label: "Moderate", token: "aqi-moderate" };
    if (aqi <= 300) return { category: "poor", label: "Poor", token: "aqi-poor" };
    if (aqi <= 400) return { category: "very_poor", label: "Very Poor", token: "aqi-very-poor" };
    return { category: "severe", label: "Severe", token: "aqi-severe" };
  }

  // US AQI mapping
  if (aqi <= 50) return { category: "good", label: "Good", token: "aqi-good" };
  if (aqi <= 100) return { category: "moderate", label: "Moderate", token: "aqi-moderate" };
  if (aqi <= 150) return { category: "poor", label: "Unhealthy for Sensitive Groups", token: "aqi-poor" };
  if (aqi <= 200) return { category: "poor", label: "Unhealthy", token: "aqi-poor" };
  if (aqi <= 300) return { category: "very_poor", label: "Very Unhealthy", token: "aqi-very-poor" };
  return { category: "severe", label: "Hazardous", token: "aqi-severe" };
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

  const pm25Sub = pollutants.pm25 !== undefined ? calculateSubIndex(pollutants.pm25, pm25Bp) : 0;
  const pm10Sub = pollutants.pm10 !== undefined ? calculateSubIndex(pollutants.pm10, pm10Bp) : 0;

  const dominant = pm25Sub >= pm10Sub ? "PM2.5" : "PM10";
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

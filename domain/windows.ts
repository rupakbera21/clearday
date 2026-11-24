/**
 * @file windows.ts
 * @description Finds optimal lowest-exposure and peak worst exposure windows from hourly forecasts.
 * Addresses problem-statement: low-emission daily routines, day planner, tailored to location and timezone.
 */

export interface HourlyPoint {
  time: string; // ISO 8601 string or YYYY-MM-DDTHH:mm
  pm25: number;
}

export interface ExposureWindow {
  startTime: string;
  endTime: string;
  startHour: number;
  endHour: number;
  avgPm25: number;
  category: "optimal" | "acceptable" | "caution" | "hazardous";
  recommendation: string;
}

export interface WindowFinderResult {
  bestWindow: ExposureWindow | null;
  worstWindow: ExposureWindow | null;
  daytimeSlots: ExposureWindow[];
  nighttimeSlots: ExposureWindow[];
}

/**
 * Normalizes an offsetless or offset-bearing time string to a Date object.
 * If timeString is offsetless (e.g. "2026-11-24T08:00"), preserves its date/time parts.
 */
export function parseLocalOrUtcDate(timeString: string): Date {
  if (!timeString) return new Date();
  if (timeString.endsWith("Z") || /[+-]\d{2}(:\d{2})?$/.test(timeString)) {
    return new Date(timeString);
  }
  try {
    const [datePart = "2026-01-01", timePart = "00:00"] = timeString.split("T");
    const [year = 2026, month = 1, day = 1] = datePart.split("-").map(Number);
    const [hour = 0, min = 0] = timePart.split(":").map(Number);
    return new Date(Date.UTC(year, month - 1, day, hour, min));
  } catch {
    return new Date(timeString);
  }
}

/**
 * Extracts the local hour (0-23) from an ISO time string or Date given a timezone.
 * For offsetless strings ("YYYY-MM-DDTHH:mm") from Open-Meteo with timezone=auto,
 * the string hour IS already the location's local hour.
 */
export function getLocalHour(isoString: string, timeZone = "UTC"): number {
  if (!isoString) return 0;
  // If offsetless like "2026-11-18T08:00"
  if (!isoString.endsWith("Z") && !/[+-]\d{2}(:\d{2})?$/.test(isoString)) {
    const match = isoString.match(/T(\d{2}):/);
    if (match && match[1]) {
      return parseInt(match[1], 10) % 24;
    }
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 0;

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone,
    });
    const parts = formatter.format(date);
    const hour = parseInt(parts, 10);
    return Number.isNaN(hour) ? date.getUTCHours() : hour % 24;
  } catch {
    return date.getUTCHours();
  }
}

function classifyWindow(avgPm25: number): {
  category: ExposureWindow["category"];
  recommendation: string;
} {
  if (avgPm25 > 250) {
    return {
      category: "hazardous",
      recommendation: "Severe pollution peak; stay strictly indoors with HEPA filtration.",
    };
  }
  if (avgPm25 > 120) {
    return {
      category: "caution",
      recommendation: "Heavy particulate burden; wear a fitted N95 respirator if stepping out.",
    };
  }
  if (avgPm25 > 60) {
    return {
      category: "acceptable",
      recommendation: "Moderate particulate levels; limit vigorous cardiovascular workouts.",
    };
  }
  return {
    category: "optimal",
    recommendation: "Ideal window for essential errands or brief outdoor movement.",
  };
}

/**
 * Verifies that two timestamps are approximately 1 hour apart (45 to 75 minutes)
 * to guard against non-consecutive or gapped readings forming a fake window.
 */
function areConsecutiveHours(t1: string, t2: string): boolean {
  const d1 = parseLocalOrUtcDate(t1).getTime();
  const d2 = parseLocalOrUtcDate(t2).getTime();
  const diffMs = Math.abs(d2 - d1);
  return diffMs >= 45 * 60 * 1000 && diffMs <= 75 * 60 * 1000;
}

function isValidConsecutiveSlice(slice: HourlyPoint[]): boolean {
  for (let j = 0; j < slice.length - 1; j++) {
    const ptA = slice[j]!;
    const ptB = slice[j + 1]!;
    if (
      typeof ptA.pm25 !== "number" ||
      typeof ptB.pm25 !== "number" ||
      !areConsecutiveHours(ptA.time, ptB.time)
    ) {
      return false;
    }
  }
  return true;
}

function buildExposureWindow(
  slice: HourlyPoint[],
  windowDurationHours: number,
  timeZone: string,
): ExposureWindow {
  const sumPm25 = slice.reduce((acc, pt) => acc + (pt.pm25 || 0), 0);
  const avgPm25 = Math.round((sumPm25 / windowDurationHours) * 10) / 10;
  const startPt = slice[0]!;
  const endPt = slice[slice.length - 1]!;
  const startHour = getLocalHour(startPt.time, timeZone);
  const endHour = (startHour + windowDurationHours) % 24;
  const { category, recommendation } = classifyWindow(avgPm25);
  return {
    startTime: startPt.time,
    endTime: endPt.time,
    startHour,
    endHour,
    avgPm25,
    category,
    recommendation,
  };
}

function filterUpcomingWindows(
  windows: ExposureWindow[],
  referenceTimeIso?: string,
): ExposureWindow[] {
  if (!referenceTimeIso) return windows;
  const refMs = parseLocalOrUtcDate(referenceTimeIso).getTime();
  const futureOnly = windows.filter((w) => parseLocalOrUtcDate(w.endTime).getTime() >= refMs);
  return futureOnly.length > 0 ? futureOnly : windows;
}

/**
 * Evaluates moving average windows of consecutive hourly readings
 * to identify best and worst exposure slots. Excludes elapsed windows when referenceTimeIso is given.
 */
export function findExposureWindows(
  hourlyPoints: HourlyPoint[],
  windowDurationHours = 2,
  timeZone = "UTC",
  referenceTimeIso?: string,
): WindowFinderResult {
  if (hourlyPoints.length === 0 || windowDurationHours <= 0) {
    return { bestWindow: null, worstWindow: null, daytimeSlots: [], nighttimeSlots: [] };
  }

  const windows: ExposureWindow[] = [];

  for (let i = 0; i <= hourlyPoints.length - windowDurationHours; i++) {
    const slice = hourlyPoints.slice(i, i + windowDurationHours);
    if (!isValidConsecutiveSlice(slice)) continue;
    windows.push(buildExposureWindow(slice, windowDurationHours, timeZone));
  }

  if (windows.length === 0) {
    return { bestWindow: null, worstWindow: null, daytimeSlots: [], nighttimeSlots: [] };
  }

  const upcomingWindows = filterUpcomingWindows(windows, referenceTimeIso);

  let best = upcomingWindows[0]!;
  let worst = upcomingWindows[0]!;
  for (const win of upcomingWindows) {
    if (win.avgPm25 < best.avgPm25) best = win;
    if (win.avgPm25 > worst.avgPm25) worst = win;
  }

  const daytimeSlots = windows.filter((w) => w.startHour >= 6 && w.startHour < 18);
  const nighttimeSlots = windows.filter((w) => w.startHour < 6 || w.startHour >= 18);

  return { bestWindow: best, worstWindow: worst, daytimeSlots, nighttimeSlots };
}

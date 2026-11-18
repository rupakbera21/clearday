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
 * Extracts the local hour (0-23) from an ISO time string or Date given a timezone.
 */
export function getLocalHour(isoString: string, timeZone: string): number {
  const date = new Date(isoString);
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone,
  });
  const parts = formatter.format(date);
  const hour = parseInt(parts, 10);
  return Number.isNaN(hour) ? date.getUTCHours() : hour % 24;
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

function findExtremes(windows: ExposureWindow[]): {
  best: ExposureWindow | null;
  worst: ExposureWindow | null;
} {
  if (windows.length === 0) return { best: null, worst: null };
  let best = windows[0]!;
  let worst = windows[0]!;
  for (const win of windows) {
    if (win.avgPm25 < best.avgPm25) best = win;
    if (win.avgPm25 > worst.avgPm25) worst = win;
  }
  return { best, worst };
}

/**
 * Evaluates moving average windows to identify best and worst exposure slots.
 */
export function findExposureWindows(
  hourlyPoints: HourlyPoint[],
  windowDurationHours = 2,
  timeZone = "UTC",
): WindowFinderResult {
  if (hourlyPoints.length === 0 || windowDurationHours <= 0) {
    return { bestWindow: null, worstWindow: null, daytimeSlots: [], nighttimeSlots: [] };
  }

  const windows: ExposureWindow[] = [];

  for (let i = 0; i <= hourlyPoints.length - windowDurationHours; i++) {
    const slice = hourlyPoints.slice(i, i + windowDurationHours);
    const sumPm25 = slice.reduce((acc, pt) => acc + (pt.pm25 || 0), 0);
    const avgPm25 = Math.round((sumPm25 / windowDurationHours) * 10) / 10;

    const startPt = slice[0]!;
    const endPt = slice[slice.length - 1]!;
    const startHour = getLocalHour(startPt.time, timeZone);
    const endHour = (startHour + windowDurationHours) % 24;

    const { category, recommendation } = classifyWindow(avgPm25);

    windows.push({
      startTime: startPt.time,
      endTime: endPt.time,
      startHour,
      endHour,
      avgPm25,
      category,
      recommendation,
    });
  }

  const { best, worst } = findExtremes(windows);
  const daytimeSlots = windows.filter((w) => w.startHour >= 6 && w.startHour < 18);
  const nighttimeSlots = windows.filter((w) => w.startHour < 6 || w.startHour >= 18);

  return { bestWindow: best, worstWindow: worst, daytimeSlots, nighttimeSlots };
}

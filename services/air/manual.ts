/**
 * @file manual.ts
 * @description Manual air quality snapshot generation preserving provenance without synthetic forecast.
 * Addresses problem-statement: Failure ladder for data, manual entry mode, particulate estimate.
 */

import { StandardType, AqiResult, computeAqi, getCategoryAndToken } from "@/domain/aqi";
import { assessAllGroups } from "@/domain/risk";
import type { AirSnapshotResult } from "./client";

export interface ManualSnapshotInput {
  aqi?: number;
  pm25?: number;
  standard?: StandardType;
  cityName?: string;
}

function handleAqiOnly(aqi: number, standard: StandardType) {
  const safeAqi = Math.max(0, Math.min(500, Math.round(aqi)));
  const { category, label, token } = getCategoryAndToken(safeAqi, standard);
  const aqiResult: AqiResult = {
    aqi: safeAqi,
    category,
    categoryLabel: label,
    dominantPollutant: "Reported AQI",
    standard,
    colorToken: token,
  };
  const stdLabel = standard === "india_naqi" ? "India NAQI" : "US AQI";
  const methodNote = `Manual snapshot index (${safeAqi} ${stdLabel}). Pollutant concentrations are not inferred without physical sensor data.`;
  return { aqiResult, methodNote };
}

function handlePm25Only(pm25: number, standard: StandardType) {
  const safePm25 = Math.max(0, pm25);
  const computed = computeAqi({ pm25: safePm25 }, standard);
  const aqiResult: AqiResult = {
    ...computed,
    isParticulateEstimate: true,
  };
  const methodNote = `Particulate index estimate derived from single manual PM2.5 reading (${safePm25} µg/m³) via linear breakpoint interpolation. Official AQI requires 24-hour multi-pollutant averaging.`;
  return { aqiResult, methodNote, safePm25 };
}

function handleBoth(aqi: number, pm25: number, standard: StandardType) {
  const safeAqi = Math.max(0, Math.min(500, Math.round(aqi)));
  const safePm25 = Math.max(0, pm25);
  const { category, label, token } = getCategoryAndToken(safeAqi, standard);
  const aqiResult: AqiResult = {
    aqi: safeAqi,
    category,
    categoryLabel: label,
    dominantPollutant: "PM2.5",
    standard,
    colorToken: token,
  };
  const methodNote = "Manual snapshot with both reported AQI and PM2.5 concentration.";
  return { aqiResult, methodNote, safePm25 };
}

function normalizeInput(
  input: ManualSnapshotInput | number,
  legacyStandard?: StandardType,
  legacyCityName?: string,
) {
  if (typeof input === "number") {
    return {
      aqi: undefined,
      pm25: input,
      standard: legacyStandard ?? "india_naqi",
      cityName: legacyCityName ?? "Manual Location",
    };
  }
  return {
    aqi: input.aqi,
    pm25: input.pm25,
    standard: input.standard ?? "india_naqi",
    cityName: input.cityName ?? "Manual Location",
  };
}

export function createManualAirSnapshot(
  input: ManualSnapshotInput | number,
  legacyStandard?: StandardType,
  legacyCityName?: string,
): AirSnapshotResult {
  const { aqi, pm25, standard, cityName } = normalizeInput(input, legacyStandard, legacyCityName);
  const nowIso = new Date().toISOString();

  let aqiResult: AqiResult;
  let currentPm25: number | undefined;
  let methodNote = "";
  let manualMode: "aqi_only" | "pm25_only" | "both" = "both";

  if (aqi !== undefined && pm25 === undefined) {
    manualMode = "aqi_only";
    const res = handleAqiOnly(aqi, standard);
    aqiResult = res.aqiResult;
    methodNote = res.methodNote;
  } else if (pm25 !== undefined && aqi === undefined) {
    manualMode = "pm25_only";
    const res = handlePm25Only(pm25, standard);
    aqiResult = res.aqiResult;
    methodNote = res.methodNote;
    currentPm25 = res.safePm25;
  } else {
    manualMode = "both";
    const res = handleBoth(aqi ?? 100, pm25 ?? 50, standard);
    aqiResult = res.aqiResult;
    methodNote = res.methodNote;
    currentPm25 = res.safePm25;
  }

  return {
    location: { latitude: 0, longitude: 0, timezone: "UTC" },
    current: {
      time: nowIso,
      pm25: currentPm25,
      pm10: undefined,
      aqi: aqiResult,
    },
    hourly: [],
    stagnation: null,
    exposureWindows: null,
    riskBands: assessAllGroups(aqiResult.category),
    meta: {
      isStale: false,
      dataAgeMinutes: 0,
      dataSource: "manual_entry",
      manualMode,
      methodNote,
      attribution: `User manual reading for ${cityName}.`,
    },
  };
}

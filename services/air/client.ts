/**
 * @file client.ts
 * @description Outbound Open-Meteo Air Quality service client with in-flight coalescing and caching.
 * Addresses problem-statement: severe winter smog and urban air pollution, Air snapshot, Failure ladder for data.
 */

import { secureFetch } from "../http";
import { BoundedLruCache } from "./cache";
import { computeAqi, StandardType, AqiResult } from "@/domain/aqi";
import { analyzeStagnation, StagnationAnalysisResult } from "@/domain/stagnation";
import { findExposureWindows, WindowFinderResult } from "@/domain/windows";
import { assessAllGroups, GroupRiskAssessment } from "@/domain/risk";

export const airLruCache = new BoundedLruCache<RawAirData>(60, 15 * 60 * 1000); // 15 min TTL
export const MAX_STALE_CACHE_MS = 60 * 60 * 1000; // 60 min upper age bound for recommendations

export interface RawAirData {
  latitude: number;
  longitude: number;
  timezone: string;
  utcOffsetSeconds?: number;
  current: {
    time: string;
    pm2_5?: number;
    pm10?: number;
    nitrogen_dioxide?: number;
    sulphur_dioxide?: number;
    ozone?: number;
    carbon_monoxide?: number;
  };
  hourly: {
    time: string[];
    pm2_5: (number | undefined)[];
    pm10: (number | undefined)[];
  };
  weather?: {
    windSpeedMps?: number;
    temperatureC?: number;
    relativeHumidityPercent?: number;
  };
  fetchedAt: string;
}

export interface AirSnapshotResult {
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  current: {
    time: string;
    pm25?: number;
    pm10?: number;
    no2?: number;
    so2?: number;
    co?: number;
    o3?: number;
    aqi: AqiResult;
  };
  hourly: {
    time: string;
    pm25?: number;
    pm10?: number;
    aqi: number;
    category: string;
  }[];
  stagnation?: StagnationAnalysisResult | null;
  exposureWindows?: WindowFinderResult | null;
  riskBands: GroupRiskAssessment[];
  meta: {
    isStale: boolean;
    isExpired?: boolean;
    dataAgeMinutes: number;
    dataSource: "live_fetch" | "coalesced" | "stale_cache" | "manual_entry";
    attribution: string;
    manualMode?: "aqi_only" | "pm25_only" | "both";
    methodNote?: string;
  };
}

export function formatIsoWithOffset(localIso: string, offsetSeconds = 0): string {
  if (!localIso) return new Date().toISOString();
  if (localIso.endsWith("Z") || /[+-]\d{2}(:\d{2})?$/.test(localIso)) {
    return localIso;
  }
  const sign = offsetSeconds >= 0 ? "+" : "-";
  const absSeconds = Math.abs(offsetSeconds);
  const hours = String(Math.floor(absSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((absSeconds % 3600) / 60)).padStart(2, "0");
  const offsetStr = `${sign}${hours}:${minutes}`;
  const baseTime = localIso.length === 16 ? `${localIso}:00` : localIso;
  return `${baseTime}${offsetStr}`;
}

function parseOpenMeteoPayload(rawAir: RawAirData, standard: StandardType): AirSnapshotResult {
  const hasCurrentObs = rawAir.current.pm2_5 !== undefined || rawAir.current.pm10 !== undefined;
  const currentAqi = hasCurrentObs
    ? computeAqi({ pm25: rawAir.current.pm2_5, pm10: rawAir.current.pm10 }, standard)
    : {
        aqi: 0,
        category: "moderate" as const,
        categoryLabel: "Data Unavailable",
        dominantPollutant: "None",
        standard,
        colorToken: "aqi-moderate",
      };

  const hourlyList = rawAir.hourly.time.map((time, idx) => {
    const pm25 = rawAir.hourly.pm2_5[idx];
    const pm10 = rawAir.hourly.pm10[idx];
    const hasHourlyObs = typeof pm25 === "number" || typeof pm10 === "number";
    const aqiRes = hasHourlyObs
      ? computeAqi({ pm25, pm10 }, standard)
      : { aqi: 0, category: "moderate" as const };
    return {
      time,
      pm25: typeof pm25 === "number" ? pm25 : undefined,
      pm10: typeof pm10 === "number" ? pm10 : undefined,
      aqi: aqiRes.aqi,
      category: aqiRes.category,
    };
  });

  const stagnation = rawAir.current.pm2_5 !== undefined
    ? analyzeStagnation({
        ...rawAir.weather,
        pm25: rawAir.current.pm2_5,
        pm10: rawAir.current.pm10,
      })
    : null;

  const validPointsForWindows: { time: string; pm25: number }[] = [];
  for (const h of hourlyList) {
    if (typeof h.pm25 === "number") {
      validPointsForWindows.push({ time: h.time, pm25: h.pm25 });
    }
  }

  const exposureWindows = validPointsForWindows.length >= 2
    ? findExposureWindows(validPointsForWindows, 2, rawAir.timezone, rawAir.current.time)
    : null;

  const riskBands = assessAllGroups(currentAqi.category);
  const dataAgeMs = Date.now() - new Date(rawAir.fetchedAt).getTime();
  const isExpired = dataAgeMs > MAX_STALE_CACHE_MS;

  return {
    location: {
      latitude: rawAir.latitude,
      longitude: rawAir.longitude,
      timezone: rawAir.timezone,
    },
    current: {
      time: rawAir.current.time,
      pm25: rawAir.current.pm2_5,
      pm10: rawAir.current.pm10,
      no2: rawAir.current.nitrogen_dioxide,
      so2: rawAir.current.sulphur_dioxide,
      co: rawAir.current.carbon_monoxide,
      o3: rawAir.current.ozone,
      aqi: currentAqi,
    },
    hourly: hourlyList,
    stagnation,
    exposureWindows,
    riskBands,
    meta: {
      isStale: false,
      isExpired,
      dataAgeMinutes: Math.max(0, Math.round(dataAgeMs / 60000)),
      dataSource: "live_fetch",
      attribution: "Data provided by Open-Meteo under CC BY 4.0. Model-based coarse estimates.",
    },
  };
}

async function extractWeather(weatherRes: Response | null): Promise<RawAirData["weather"] | undefined> {
  if (!weatherRes || !weatherRes.ok) {
    return undefined;
  }
  try {
    const wJson = await weatherRes.json();
    if (!wJson.current) return undefined;
    const wind = wJson.current.wind_speed_10m;
    const temp = wJson.current.temperature_2m;
    const rh = wJson.current.relative_humidity_2m;
    if (typeof wind !== "number" || typeof temp !== "number" || typeof rh !== "number") {
      return undefined;
    }
    return {
      windSpeedMps: Math.round(wind * 10) / 10,
      temperatureC: Math.round(temp * 10) / 10,
      relativeHumidityPercent: Math.round(rh),
    };
  } catch {
    return undefined;
  }
}

interface RawAirResponse {
  latitude: number;
  longitude: number;
  timezone?: string;
  utc_offset_seconds?: number;
  current?: {
    time?: string;
    pm2_5?: number;
    pm10?: number;
    nitrogen_dioxide?: number;
    sulphur_dioxide?: number;
    ozone?: number;
    carbon_monoxide?: number;
  };
  hourly?: {
    time?: string[];
    pm2_5?: (number | null)[];
    pm10?: (number | null)[];
  };
}

function formatCurrent(c?: RawAirResponse["current"]): RawAirData["current"] {
  return {
    time: c?.time ?? new Date().toISOString(),
    pm2_5: typeof c?.pm2_5 === "number" ? Math.round(c.pm2_5 * 10) / 10 : undefined,
    pm10: typeof c?.pm10 === "number" ? Math.round(c.pm10) : undefined,
    nitrogen_dioxide: c?.nitrogen_dioxide,
    sulphur_dioxide: c?.sulphur_dioxide,
    ozone: c?.ozone,
    carbon_monoxide: c?.carbon_monoxide,
  };
}

function formatHourly(h?: RawAirResponse["hourly"], utcOffsetSeconds = 0): RawAirData["hourly"] {
  const times = h?.time ?? [];
  const normalizedTimes = times.map((t) => formatIsoWithOffset(t, utcOffsetSeconds));
  return {
    time: normalizedTimes,
    pm2_5: h?.pm2_5?.map((v) => (typeof v === "number" ? Math.round(v * 10) / 10 : undefined)) ?? [],
    pm10: h?.pm10?.map((v) => (typeof v === "number" ? Math.round(v) : undefined)) ?? [],
  };
}

function formatAirPayload(
  airJson: RawAirResponse,
  weatherData?: RawAirData["weather"],
): RawAirData {
  const offset = airJson.utc_offset_seconds ?? 0;
  return {
    latitude: airJson.latitude,
    longitude: airJson.longitude,
    timezone: airJson.timezone ?? "UTC",
    utcOffsetSeconds: offset,
    current: formatCurrent(airJson.current),
    hourly: formatHourly(airJson.hourly, offset),
    weather: weatherData,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchFromOpenMeteo(lat: number, lon: number, timezone = "auto"): Promise<RawAirData> {
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLon = Math.round(lon * 100) / 100;
  const tzParam = encodeURIComponent(timezone || "auto");

  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${roundedLat}&longitude=${roundedLon}&current=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide&hourly=pm2_5,pm10&forecast_days=3&timezone=${tzParam}`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&wind_speed_unit=ms&timezone=${tzParam}`;

  const [airRes, weatherRes] = await Promise.all([
    secureFetch(airUrl, { timeoutMs: 7000 }),
    secureFetch(weatherUrl, { timeoutMs: 7000 }).catch(() => null),
  ]);

  if (!airRes.ok) {
    throw new Error(`Open-Meteo Air API failed with status ${airRes.status}`);
  }

  const airJson: RawAirResponse = await airRes.json();
  const weatherData = await extractWeather(weatherRes);
  return formatAirPayload(airJson, weatherData);
}

/**
 * Fetches air snapshot for coordinates with caching, in-flight coalescing, and stale fallback.
 */
export async function getAirSnapshot(
  lat: number,
  lon: number,
  standard: StandardType = "india_naqi",
  timezone = "auto",
): Promise<AirSnapshotResult> {
  const cacheKey = BoundedLruCache.makeGridKey("air", lat, lon);

  const coalesced = await airLruCache.coalesce(
    cacheKey,
    () => fetchFromOpenMeteo(lat, lon, timezone),
    15 * 60 * 1000,
  );

  const result = parseOpenMeteoPayload(coalesced.value, standard);
  result.meta.isStale = coalesced.isStale;
  result.meta.dataSource = coalesced.source === "stale_cache" ? "stale_cache" : coalesced.source === "coalesced" ? "coalesced" : "live_fetch";

  return result;
}

export { createManualAirSnapshot, type ManualSnapshotInput } from "./manual";

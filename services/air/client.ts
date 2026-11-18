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

export interface RawAirData {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    pm2_5: number;
    pm10: number;
    nitrogen_dioxide?: number;
    sulphur_dioxide?: number;
    ozone?: number;
    carbon_monoxide?: number;
  };
  hourly: {
    time: string[];
    pm2_5: number[];
    pm10: number[];
  };
  weather?: {
    windSpeedMps: number;
    temperatureC: number;
    relativeHumidityPercent: number;
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
    pm25: number;
    pm10: number;
    no2?: number;
    so2?: number;
    co?: number;
    o3?: number;
    aqi: AqiResult;
  };
  hourly: {
    time: string;
    pm25: number;
    pm10: number;
    aqi: number;
    category: string;
  }[];
  stagnation: StagnationAnalysisResult;
  exposureWindows: WindowFinderResult;
  riskBands: GroupRiskAssessment[];
  meta: {
    isStale: boolean;
    dataAgeMinutes: number;
    dataSource: "live_fetch" | "coalesced" | "stale_cache" | "manual_entry";
    attribution: string;
  };
}

function parseOpenMeteoPayload(rawAir: RawAirData, standard: StandardType): AirSnapshotResult {
  const currentAqi = computeAqi(
    { pm25: rawAir.current.pm2_5, pm10: rawAir.current.pm10 },
    standard,
  );

  const hourlyList = rawAir.hourly.time.map((time, idx) => {
    const pm25 = rawAir.hourly.pm2_5[idx] ?? 0;
    const pm10 = rawAir.hourly.pm10[idx] ?? 0;
    const aqiRes = computeAqi({ pm25, pm10 }, standard);
    return { time, pm25, pm10, aqi: aqiRes.aqi, category: aqiRes.category };
  });

  const weather = rawAir.weather ?? { windSpeedMps: 1.5, temperatureC: 12.0, relativeHumidityPercent: 75 };
  const stagnation = analyzeStagnation({
    windSpeedMps: weather.windSpeedMps,
    temperatureC: weather.temperatureC,
    relativeHumidityPercent: weather.relativeHumidityPercent,
    pm25: rawAir.current.pm2_5,
    pm10: rawAir.current.pm10,
  });

  const exposureWindows = findExposureWindows(
    hourlyList.map((h) => ({ time: h.time, pm25: h.pm25 })),
    2,
    rawAir.timezone,
  );

  const riskBands = assessAllGroups(currentAqi.category);
  const dataAgeMs = Date.now() - new Date(rawAir.fetchedAt).getTime();

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
      dataAgeMinutes: Math.max(0, Math.round(dataAgeMs / 60000)),
      dataSource: "live_fetch",
      attribution: "Data provided by Open-Meteo under CC BY 4.0. Model-based coarse estimates.",
    },
  };
}

async function extractWeather(weatherRes: Response | null) {
  if (!weatherRes || !weatherRes.ok) {
    return { windSpeedMps: 1.5, temperatureC: 12.0, relativeHumidityPercent: 75 };
  }
  try {
    const wJson = await weatherRes.json();
    return {
      windSpeedMps: wJson.current?.wind_speed_10m ?? 1.5,
      temperatureC: wJson.current?.temperature_2m ?? 12.0,
      relativeHumidityPercent: wJson.current?.relative_humidity_2m ?? 75,
    };
  } catch {
    return { windSpeedMps: 1.5, temperatureC: 12.0, relativeHumidityPercent: 75 };
  }
}

interface RawAirResponse {
  latitude: number;
  longitude: number;
  timezone?: string;
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
    pm2_5?: number[];
    pm10?: number[];
  };
}

function formatCurrent(c?: RawAirResponse["current"]): RawAirData["current"] {
  return {
    time: c?.time ?? new Date().toISOString(),
    pm2_5: Math.round(c?.pm2_5 ?? 50),
    pm10: Math.round(c?.pm10 ?? 75),
    nitrogen_dioxide: c?.nitrogen_dioxide,
    sulphur_dioxide: c?.sulphur_dioxide,
    ozone: c?.ozone,
    carbon_monoxide: c?.carbon_monoxide,
  };
}

function formatHourly(h?: RawAirResponse["hourly"]): RawAirData["hourly"] {
  return {
    time: h?.time ?? [],
    pm2_5: h?.pm2_5 ?? [],
    pm10: h?.pm10 ?? [],
  };
}

function formatAirPayload(
  airJson: RawAirResponse,
  weatherData: { windSpeedMps: number; temperatureC: number; relativeHumidityPercent: number },
): RawAirData {
  return {
    latitude: airJson.latitude,
    longitude: airJson.longitude,
    timezone: airJson.timezone ?? "UTC",
    current: formatCurrent(airJson.current),
    hourly: formatHourly(airJson.hourly),
    weather: weatherData,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchFromOpenMeteo(lat: number, lon: number): Promise<RawAirData> {
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLon = Math.round(lon * 100) / 100;

  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${roundedLat}&longitude=${roundedLon}&current=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide&hourly=pm2_5,pm10&forecast_days=3&timezone=auto`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`;

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
): Promise<AirSnapshotResult> {
  const cacheKey = BoundedLruCache.makeGridKey("air", lat, lon);

  const coalesced = await airLruCache.coalesce(
    cacheKey,
    () => fetchFromOpenMeteo(lat, lon),
    15 * 60 * 1000,
  );

  const result = parseOpenMeteoPayload(coalesced.value, standard);
  result.meta.isStale = coalesced.isStale;
  result.meta.dataSource = coalesced.source === "stale_cache" ? "stale_cache" : coalesced.source === "coalesced" ? "coalesced" : "live_fetch";

  return result;
}

/**
 * Creates a synthetic air snapshot for manual entry fallback.
 */
export function createManualAirSnapshot(
  pm25: number,
  standard: StandardType = "india_naqi",
  cityName = "Manual Entry",
): AirSnapshotResult {
  const safePm25 = Math.max(0, pm25);
  const safePm10 = Math.round(safePm25 * 1.5);
  const now = new Date();
  const aqiRes = computeAqi({ pm25: safePm25, pm10: safePm10 }, standard);

  const hourly = Array.from({ length: 24 }).map((_, i) => {
    const d = new Date(now.getTime() + i * 3600000);
    return {
      time: d.toISOString(),
      pm25: safePm25,
      pm10: safePm10,
      aqi: aqiRes.aqi,
      category: aqiRes.category,
    };
  });

  const stagnation = analyzeStagnation({
    windSpeedMps: 1.2,
    temperatureC: 11.0,
    relativeHumidityPercent: 80,
    pm25: safePm25,
    pm10: safePm10,
  });

  const exposureWindows = findExposureWindows(
    hourly.map((h) => ({ time: h.time, pm25: h.pm25 })),
    2,
    "UTC",
  );

  return {
    location: { latitude: 0, longitude: 0, timezone: "UTC" },
    current: { time: now.toISOString(), pm25: safePm25, pm10: safePm10, aqi: aqiRes },
    hourly,
    stagnation,
    exposureWindows,
    riskBands: assessAllGroups(aqiRes.category),
    meta: {
      isStale: false,
      dataAgeMinutes: 0,
      dataSource: "manual_entry",
      attribution: `User manually reported air readings for ${cityName}.`,
    },
  };
}

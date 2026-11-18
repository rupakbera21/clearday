/**
 * @file client.ts
 * @description Geocoding service client using Open-Meteo Geocoding API with caching.
 * Addresses problem-statement: Location, tailored to their location and lifestyle.
 */

import { secureFetch } from "../http";
import { logger } from "../logger";
import { LocationResult } from "@/schemas/geo";
import { BoundedLruCache } from "../air/cache";

const geoCache = new BoundedLruCache<LocationResult[]>(50, 60 * 60 * 1000); // 1 hour TTL for cities

interface OpenMeteoGeoRawResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

interface OpenMeteoGeoResponse {
  results?: OpenMeteoGeoRawResult[];
}

/**
 * Searches cities using Open-Meteo geocoding API with bounded caching.
 */
export async function searchCities(query: string, limit = 5): Promise<LocationResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  const cacheKey = `geo:${trimmed}:${limit}`;
  const cached = geoCache.get(cacheKey);
  if (cached && !cached.isStale) {
    return cached.value;
  }

  const encoded = encodeURIComponent(trimmed);
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}&count=${limit}&language=en&format=json`;

  try {
    const res = await secureFetch(url, { timeoutMs: 5000 });
    if (!res.ok) {
      logger.warn("Open-Meteo geocoding returned non-200 status", { status: res.status });
      return cached ? cached.value : [];
    }

    const data: OpenMeteoGeoResponse = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    const parsed: LocationResult[] = data.results.map((item) => ({
      id: item.id,
      name: item.name,
      country: item.country ?? "",
      admin1: item.admin1,
      latitude: Math.round(item.latitude * 100) / 100,
      longitude: Math.round(item.longitude * 100) / 100,
      timezone: item.timezone || "UTC",
    }));

    geoCache.set(cacheKey, parsed);
    return parsed;
  } catch (err) {
    logger.error("Failed to query Open-Meteo geocoding", { error: (err as Error).message });
    return cached ? cached.value : [];
  }
}

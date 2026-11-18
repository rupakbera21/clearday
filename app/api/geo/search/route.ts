/**
 * @file route.ts
 * @description Geocoding search endpoint proxying Open-Meteo with caching and rate limiting.
 * Addresses problem-statement: Location, city search through geocoding.
 */

import { NextResponse } from "next/server";
import { geoSearchQuerySchema } from "@/schemas/geo";
import { searchCities } from "@/services/geo/client";
import { limitGeneral } from "@/services/ratelimit";
import { logger } from "@/services/logger";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimitResult = await limitGeneral(ip);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const parsedQuery = geoSearchQuerySchema.safeParse({ q });
  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: "Invalid search query. Query must be between 2 and 60 characters." },
      { status: 400 },
    );
  }

  try {
    const results = await searchCities(parsedQuery.data.q);
    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    logger.error("Geocoding search route failure", { error: (err as Error).message });
    return NextResponse.json(
      { error: "Failed to resolve location search" },
      { status: 502 },
    );
  }
}

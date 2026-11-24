/**
 * @file route.ts
 * @description Air snapshot endpoint providing current air quality, hourly forecast, and risk bands.
 * Addresses problem-statement: Air snapshot, severe winter smog, India NAQI and US AQI.
 */

import { NextResponse } from "next/server";
import { airSnapshotQuerySchema } from "@/schemas/air";
import { getAirSnapshot } from "@/services/air/client";
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
  const rawParams = {
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
    standard: searchParams.get("standard") || "india_naqi",
    timezone: searchParams.get("timezone") || "auto",
  };

  const parsedQuery = airSnapshotQuerySchema.safeParse(rawParams);
  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: "Invalid coordinates or standard parameter" },
      { status: 400 },
    );
  }

  try {
    const snapshot = await getAirSnapshot(
      parsedQuery.data.lat,
      parsedQuery.data.lon,
      parsedQuery.data.standard,
      parsedQuery.data.timezone,
    );

    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
      },
    });
  } catch (err) {
    logger.error("Air snapshot route failure", { error: (err as Error).message });
    return NextResponse.json(
      {
        error: "Failed to fetch live air quality data",
        ladderFallback: "manual_entry_mode",
      },
      { status: 502 },
    );
  }
}

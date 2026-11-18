/**
 * @file route.ts
 * @description Manual air quality entry endpoint for offline/failure ladder fallback.
 * Addresses problem-statement: Failure ladder for data, manual entry mode.
 */

import { NextResponse } from "next/server";
import { readCappedJson } from "@/services/http";
import { manualAirEntrySchema, ManualAirEntry } from "@/schemas/air";
import { createManualAirSnapshot } from "@/services/air/client";
import { limitGeneral } from "@/services/ratelimit";
import { logger } from "@/services/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimitResult = await limitGeneral(ip);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: ManualAirEntry;
  try {
    body = await readCappedJson<ManualAirEntry>(req, 16 * 1024);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }

  const parsed = manualAirEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid manual entry parameters", details: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    // If AQI provided without PM2.5, estimate PM2.5 from Indian NAQI scale
    const pm25Value = parsed.data.pm25 !== undefined ? parsed.data.pm25 : (parsed.data.aqi ?? 100) * 0.6;
    const snapshot = createManualAirSnapshot(pm25Value, parsed.data.standard, parsed.data.cityName);

    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    logger.error("Manual air entry processing failed", { error: (err as Error).message });
    return NextResponse.json(
      { error: "Failed to generate manual air snapshot" },
      { status: 500 },
    );
  }
}

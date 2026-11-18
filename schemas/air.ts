/**
 * @file air.ts
 * @description Zod schemas for air quality snapshots, hourly forecasts, and manual entry fallback.
 * Addresses problem-statement: severe winter smog and urban air pollution, Failure ladder for data.
 */

import { z } from "zod";

export const airSnapshotQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  standard: z.enum(["india_naqi", "us_aqi"]).default("india_naqi"),
  timezone: z.string().optional().default("auto"),
});

export const manualAirEntrySchema = z.object({
  pm25: z.number().min(0).max(2000).optional(),
  aqi: z.number().min(0).max(500).optional(),
  standard: z.enum(["india_naqi", "us_aqi"]).default("india_naqi"),
  cityName: z.string().min(1).max(100).default("Manual Location"),
  notes: z.string().max(200).optional(),
});

export const hourlyForecastItemSchema = z.object({
  time: z.string(),
  pm25: z.number(),
  pm10: z.number().optional(),
  aqi: z.number(),
  category: z.string(),
});

export type AirSnapshotQuery = z.infer<typeof airSnapshotQuerySchema>;
export type ManualAirEntry = z.infer<typeof manualAirEntrySchema>;
export type HourlyForecastItem = z.infer<typeof hourlyForecastItemSchema>;

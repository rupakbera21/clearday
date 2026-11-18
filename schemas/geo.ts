/**
 * @file geo.ts
 * @description Zod schemas for geocoding and location representation.
 * Addresses problem-statement: tailored to their location and lifestyle, Privacy by design.
 */

import { z } from "zod";

export const coordinatesSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

export const locationResultSchema = z.object({
  id: z.number().or(z.string()),
  name: z.string().min(1).max(100),
  country: z.string().default(""),
  admin1: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string().default("UTC"),
});

export const geoSearchQuerySchema = z.object({
  q: z.string().min(2).max(60),
});

export type LocationResult = z.infer<typeof locationResultSchema>;
export type Coordinates = z.infer<typeof coordinatesSchema>;

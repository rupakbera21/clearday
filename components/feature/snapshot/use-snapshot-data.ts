/**
 * @file use-snapshot-data.ts
 * @description State and data fetching hook for the Air Snapshot screen.
 */

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/use-app-store";
import { LocationResult } from "@/schemas/geo";
import { ManualAirEntry, HourlyAirPoint } from "@/schemas/air";
import { AirSnapshotResult } from "@/services/air/client";
import { AqiCategory } from "@/domain/aqi";

export function generateDefaultHourly(): HourlyAirPoint[] {
  const base = new Date();
  base.setMinutes(0, 0, 0);
  const points: HourlyAirPoint[] = [];
  const pmProfile = [240, 260, 290, 340, 380, 410, 390, 320, 260, 200, 160, 140, 135, 150, 190, 240, 290, 330, 350, 330, 300, 275, 255, 245];
  for (let i = 0; i < 24; i++) {
    const d = new Date(base.getTime() + i * 3600000);
    const pm = pmProfile[i] ?? 200;
    points.push({
      time: d.toISOString(),
      pm25: pm,
      pm10: pm * 1.5,
      aqi: {
        aqi: Math.min(500, Math.round(pm * 1.2)),
        category: (pm > 250 ? "severe" : pm > 120 ? "very_poor" : "poor") as AqiCategory,
        categoryLabel: pm > 250 ? "Severe" : pm > 120 ? "Very Poor" : "Poor",
      },
      temperatureC: 14 + Math.sin(i / 3) * 6,
      windSpeedKmh: 4 + (i > 11 && i < 16 ? 6 : 0),
    });
  }
  return points;
}

export function useSnapshotData() {
  const selectedLocation = useAppStore((state) => state.selectedLocation);
  const setSelectedLocation = useAppStore((state) => state.setSelectedLocation);
  const aqiStandard = useAppStore((state) => state.aqiStandard);
  const airSnapshot = useAppStore((state) => state.airSnapshot);
  const setAirSnapshot = useAppStore((state) => state.setAirSnapshot);
  const isAirLoading = useAppStore((state) => state.isAirLoading);
  const setAirLoading = useAppStore((state) => state.setAirLoading);

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchSnapshot = useCallback(async (loc: LocationResult) => {
    setAirLoading(true);
    setFetchError(null);
    try {
      const url = `/api/air/snapshot?lat=${loc.latitude}&lon=${loc.longitude}&standard=${aqiStandard}&tz=${encodeURIComponent(loc.timezone || "auto")}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Snapshot failed (${res.status})`);
      const data: AirSnapshotResult = await res.json();
      setAirSnapshot(data);
    } catch (err) {
      setFetchError((err as Error).message);
    } finally {
      setAirLoading(false);
    }
  }, [aqiStandard, setAirLoading, setAirSnapshot]);

  useEffect(() => {
    if (selectedLocation) void fetchSnapshot(selectedLocation);
  }, [selectedLocation, fetchSnapshot]);

  const handleManualSubmit = async (entry: ManualAirEntry) => {
    const res = await fetch("/api/air/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error("Failed to process manual reading");
    const data: AirSnapshotResult = await res.json();
    setAirSnapshot(data);
  };

  const hourlyForStrip: HourlyAirPoint[] = airSnapshot?.hourly?.length
    ? airSnapshot.hourly.map((h) => ({
        time: h.time,
        pm25: h.pm25,
        pm10: h.pm10,
        aqi: { aqi: h.aqi, category: (h.category as AqiCategory) || "moderate", categoryLabel: h.category.replace("_", " ") },
      }))
    : generateDefaultHourly();

  return {
    selectedLocation,
    setSelectedLocation,
    aqiStandard,
    airSnapshot,
    isAirLoading,
    fetchError,
    isManualModalOpen,
    setIsManualModalOpen,
    handleManualSubmit,
    hourlyForStrip,
  };
}

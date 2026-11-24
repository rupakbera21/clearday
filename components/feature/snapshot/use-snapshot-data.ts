/**
 * @file use-snapshot-data.ts
 * @description State and data fetching hook for the Air Snapshot screen.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAppStore } from "@/store/use-app-store";
import { LocationResult } from "@/schemas/geo";
import { ManualAirEntry, HourlyAirPoint } from "@/schemas/air";
import { AirSnapshotResult } from "@/services/air/client";
import { AqiCategory } from "@/domain/aqi";

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
  const activeRequestIdRef = useRef(0);

  const fetchSnapshot = useCallback(async (loc: LocationResult) => {
    const requestId = ++activeRequestIdRef.current;
    setAirLoading(true);
    setFetchError(null);
    try {
      const url = `/api/air/snapshot?lat=${loc.latitude}&lon=${loc.longitude}&standard=${aqiStandard}&timezone=${encodeURIComponent(loc.timezone || "auto")}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Snapshot failed (${res.status})`);
      const data: AirSnapshotResult = await res.json();
      if (requestId !== activeRequestIdRef.current) return;
      setAirSnapshot(data);
    } catch (err) {
      if (requestId !== activeRequestIdRef.current) return;
      setFetchError((err as Error).message);
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setAirLoading(false);
      }
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
        pm25: h.pm25 ?? 0,
        pm10: h.pm10,
        aqi: { aqi: h.aqi, category: (h.category as AqiCategory) || "moderate", categoryLabel: h.category.replace("_", " ") },
      }))
    : [];

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

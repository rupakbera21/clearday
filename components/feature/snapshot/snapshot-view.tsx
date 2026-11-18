/**
 * @file snapshot-view.tsx
 * @description Main Air Quality Snapshot view with live fetch, city chips, DayStrip forecast, stagnation panel, and manual fallback.
 * Addresses problem-statement: severe winter smog and urban air pollution, Location, Air snapshot.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/use-app-store";
import { LocationResult } from "@/schemas/geo";
import { ManualAirEntry, HourlyAirPoint } from "@/schemas/air";
import { AirSnapshotResult } from "@/services/air/client";
import { AqiCategory } from "@/domain/aqi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { DayStrip } from "../day-strip";
import { CitySearch } from "./city-search";
import { StagnationPanel } from "./stagnation-panel";
import { ManualEntryModal } from "./manual-entry-modal";

const CITY_SHORTCUTS: LocationResult[] = [
  { id: 1273294, name: "Delhi", country: "India", latitude: 28.61, longitude: 77.21, timezone: "Asia/Kolkata" },
  { id: 1275004, name: "Kolkata", country: "India", latitude: 22.57, longitude: 88.36, timezone: "Asia/Kolkata" },
  { id: 1172451, name: "Lahore", country: "Pakistan", latitude: 31.55, longitude: 74.36, timezone: "Asia/Karachi" },
  { id: 1816670, name: "Beijing", country: "China", latitude: 39.9, longitude: 116.4, timezone: "Asia/Shanghai" },
  { id: 5368361, name: "Los Angeles", country: "United States", latitude: 34.05, longitude: -118.24, timezone: "America/Los_Angeles" },
];

function generateDefaultHourly(): HourlyAirPoint[] {
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

function MetricsGrid({ snapshot }: { snapshot: AirSnapshotResult }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
        <span className="text-2xs text-slate-400 font-medium uppercase">PM2.5</span>
        <p className="text-lg font-bold text-slate-100 tabular-nums">{Math.round(snapshot.current.pm25)} ug/m3</p>
      </div>
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
        <span className="text-2xs text-slate-400 font-medium uppercase">PM10</span>
        <p className="text-lg font-bold text-slate-100 tabular-nums">{Math.round(snapshot.current.pm10)} ug/m3</p>
      </div>
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
        <span className="text-2xs text-slate-400 font-medium uppercase">Dominant</span>
        <p className="text-lg font-bold text-slate-100">{snapshot.current.aqi.dominantPollutant}</p>
      </div>
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
        <span className="text-2xs text-slate-400 font-medium uppercase">Data Source</span>
        <p className="text-xs font-semibold text-slate-200 mt-1 capitalize">{snapshot.meta.dataSource.replace("_", " ")}</p>
      </div>
    </div>
  );
}

function QuickCities({
  selectedId,
  onSelect,
}: {
  selectedId?: string | number;
  onSelect: (loc: LocationResult) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-slate-400 font-medium mr-1">Quick Cities:</span>
      {CITY_SHORTCUTS.map((city) => (
        <button
          key={city.id}
          type="button"
          onClick={() => onSelect(city)}
          className={`px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer touch-target sm:min-h-7 ${
            selectedId === city.id
              ? "bg-sky-950 text-sky-300 border-sky-700 font-semibold"
              : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
          }`}
        >
          {city.name}
        </button>
      ))}
    </div>
  );
}

function SnapshotMainCard({
  snapshot,
  locationName,
  standard,
}: {
  snapshot: AirSnapshotResult;
  locationName?: string;
  standard: string;
}) {
  const aqiCat = snapshot.current.aqi.category;
  const isSevere = aqiCat === "severe" || aqiCat === "very_poor";

  return (
    <div className={`p-6 rounded-2xl border transition-colors ${isSevere ? "bg-slate-900/90 border-rose-900" : "bg-slate-900/60 border-slate-800"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon name="map-pin" size={18} className="text-sky-400" />
            <h2 className="text-xl font-bold text-slate-100">{locationName ?? "Air Snapshot"}</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Updated {snapshot.meta.dataAgeMinutes}m ago via {snapshot.meta.attribution}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-100 tabular-nums">{snapshot.current.aqi.aqi}</span>
            <span className="block text-2xs uppercase tracking-wider text-slate-400">
              {standard === "india_naqi" ? "India NAQI" : "US AQI"}
            </span>
          </div>
          <Badge aqiCategory={aqiCat} className="text-sm px-3 py-1.5">
            {snapshot.current.aqi.categoryLabel}
          </Badge>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-800">
        <MetricsGrid snapshot={snapshot} />
      </div>
    </div>
  );
}

function SnapshotContent({
  isLoading,
  error,
  snapshot,
  locationName,
  standard,
  onManual,
}: {
  isLoading: boolean;
  error: string | null;
  snapshot: AirSnapshotResult | null;
  locationName?: string;
  standard: string;
  onManual: () => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error && !snapshot) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-center space-y-3">
        <p className="text-sm font-semibold text-rose-300">Live air data could not be fetched.</p>
        <Button variant="outline" size="sm" onClick={onManual}>
          Enter Manual Reading
        </Button>
      </div>
    );
  }

  if (!snapshot) return null;

  return (
    <div className="space-y-5">
      <SnapshotMainCard snapshot={snapshot} locationName={locationName} standard={standard} />
      <StagnationPanel stagnation={snapshot.stagnation} />
    </div>
  );
}

export function SnapshotView() {
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

  return (
    <section aria-label="Air Quality Snapshot" className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <CitySearch onSelectLocation={setSelectedLocation} />
        <Button variant="outline" size="sm" onClick={() => setIsManualModalOpen(true)} className="shrink-0 text-xs">
          Manual Entry
        </Button>
      </div>

      <QuickCities selectedId={selectedLocation?.id} onSelect={setSelectedLocation} />
      <DayStrip hourly={hourlyForStrip} windows={airSnapshot?.exposureWindows} currentTimeIso={airSnapshot?.current.time} />
      <SnapshotContent
        isLoading={isAirLoading}
        error={fetchError}
        snapshot={airSnapshot}
        locationName={selectedLocation?.name}
        standard={aqiStandard}
        onManual={() => setIsManualModalOpen(true)}
      />
      <ManualEntryModal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} onSubmit={handleManualSubmit} />
    </section>
  );
}

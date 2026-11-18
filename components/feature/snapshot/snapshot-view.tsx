/**
 * @file snapshot-view.tsx
 * @description Main Air Quality Snapshot view with live fetch, city chips, DayStrip forecast, stagnation panel, and manual fallback.
 * Addresses problem-statement: severe winter smog and urban air pollution, Location, Air snapshot.
 */

"use client";

import React from "react";
import { LocationResult } from "@/schemas/geo";
import { AirSnapshotResult } from "@/services/air/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DayStrip } from "../day-strip";
import { CitySearch } from "./city-search";
import { StagnationPanel } from "./stagnation-panel";
import { OutlookCard } from "./outlook-card";
import { ManualEntryModal } from "./manual-entry-modal";
import { SnapshotMainCard } from "./snapshot-main-card";
import { useSnapshotData } from "./use-snapshot-data";

const CITY_SHORTCUTS: LocationResult[] = [
  { id: 1273294, name: "Delhi", country: "India", latitude: 28.61, longitude: 77.21, timezone: "Asia/Kolkata" },
  { id: 1275004, name: "Kolkata", country: "India", latitude: 22.57, longitude: 88.36, timezone: "Asia/Kolkata" },
  { id: 1172451, name: "Lahore", country: "Pakistan", latitude: 31.55, longitude: 74.36, timezone: "Asia/Karachi" },
  { id: 1816670, name: "Beijing", country: "China", latitude: 39.9, longitude: 116.4, timezone: "Asia/Shanghai" },
  { id: 5368361, name: "Los Angeles", country: "United States", latitude: 34.05, longitude: -118.24, timezone: "America/Los_Angeles" },
];

function QuickCities({
  selectedId,
  onSelect,
}: {
  selectedId?: string | number;
  onSelect: (loc: LocationResult) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span style={{ color: "var(--text-muted)" }} className="text-xs font-medium mr-1 select-none">
        Quick Cities:
      </span>
      {CITY_SHORTCUTS.map((city) => {
        const isSelected = selectedId === city.id;
        return (
          <button
            key={city.id}
            type="button"
            onClick={() => onSelect(city)}
            style={{
              backgroundColor: isSelected ? "var(--accent-soft)" : "var(--bg-surface)",
              borderColor: isSelected ? "var(--accent)" : "var(--border-subtle)",
              color: isSelected ? "var(--accent)" : "var(--text-secondary)",
            }}
            className={`px-3 py-1 text-xs rounded-full border transition-colors cursor-pointer select-none font-medium shadow-2xs hover:bg-black/5 dark:hover:bg-white/5 ${
              isSelected ? "font-semibold" : ""
            }`}
          >
            {city.name}
          </button>
        );
      })}
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
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }

  if (error && !snapshot) {
    return (
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
        className="p-6 rounded-2xl border text-center space-y-3"
      >
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Live air data could not be fetched.</p>
        <Button variant="outline" size="sm" onClick={onManual}>
          Enter Manual Reading
        </Button>
      </div>
    );
  }

  if (!snapshot) return null;

  return (
    <SnapshotMainCard snapshot={snapshot} locationName={locationName} standard={standard} />
  );
}

function SnapshotSearchHeader({
  selectedId,
  onSelectLocation,
  onManual,
}: {
  selectedId?: string | number;
  onSelectLocation: (loc: LocationResult) => void;
  onManual: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <CitySearch onSelectLocation={onSelectLocation} />
        <Button variant="outline" size="sm" onClick={onManual} className="shrink-0 text-xs">
          Manual Entry
        </Button>
      </div>
      <QuickCities selectedId={selectedId} onSelect={onSelectLocation} />
    </div>
  );
}

export function SnapshotView() {
  const {
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
  } = useSnapshotData();

  return (
    <section aria-label="Air Quality Snapshot" className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Air Snapshot
        </h1>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Real-time air quality, lower-exposure outdoor windows, and 24-hour forecasting.
        </p>
      </div>

      <SnapshotSearchHeader
        selectedId={selectedLocation?.id}
        onSelectLocation={setSelectedLocation}
        onManual={() => setIsManualModalOpen(true)}
      />

      <SnapshotContent
        isLoading={isAirLoading}
        error={fetchError}
        snapshot={airSnapshot}
        locationName={selectedLocation?.name}
        standard={aqiStandard}
        onManual={() => setIsManualModalOpen(true)}
      />

      <DayStrip
        hourly={hourlyForStrip}
        windows={airSnapshot?.exposureWindows}
        currentTimeIso={airSnapshot?.current?.time}
      />

      <OutlookCard hourly={airSnapshot?.hourly} />

      {airSnapshot?.stagnation && (
        <StagnationPanel stagnation={airSnapshot.stagnation} />
      )}

      <ManualEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSubmit={handleManualSubmit}
      />
    </section>
  );
}

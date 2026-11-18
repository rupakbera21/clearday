/**
 * @file snapshot-main-card.tsx
 * @description Primary card presenting current AQI, exposure window, PM2.5/PM10, and data provenance.
 */

import React from "react";
import { AirSnapshotResult } from "@/services/air/client";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

function MetricsGrid({ snapshot }: { snapshot: AirSnapshotResult }) {
  const metricBoxStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-surface-elevated)",
    borderColor: "var(--border-subtle)",
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
      <div style={metricBoxStyle} className="p-3 rounded-xl border shadow-2xs">
        <span style={{ color: "var(--text-muted)" }} className="text-2xs font-semibold uppercase tracking-wider block">
          PM2.5 (Fine Particles)
        </span>
        <p style={{ color: "var(--text-primary)" }} className="text-lg font-bold tabular-nums mt-0.5">
          {Math.round(snapshot.current.pm25)} <span className="text-xs font-normal text-muted">µg/m³</span>
        </p>
      </div>

      <div style={metricBoxStyle} className="p-3 rounded-xl border shadow-2xs">
        <span style={{ color: "var(--text-muted)" }} className="text-2xs font-semibold uppercase tracking-wider block">
          PM10 (Coarse Dust)
        </span>
        <p style={{ color: "var(--text-primary)" }} className="text-lg font-bold tabular-nums mt-0.5">
          {Math.round(snapshot.current.pm10)} <span className="text-xs font-normal text-muted">µg/m³</span>
        </p>
      </div>

      <div style={metricBoxStyle} className="p-3 rounded-xl border shadow-2xs">
        <span style={{ color: "var(--text-muted)" }} className="text-2xs font-semibold uppercase tracking-wider block">
          Dominant Pollutant
        </span>
        <p style={{ color: "var(--text-primary)" }} className="text-lg font-bold mt-0.5">
          {snapshot.current.aqi.dominantPollutant}
        </p>
      </div>

      <div style={metricBoxStyle} className="p-3 rounded-xl border shadow-2xs">
        <span style={{ color: "var(--text-muted)" }} className="text-2xs font-semibold uppercase tracking-wider block">
          Data Provenance
        </span>
        <p style={{ color: "var(--text-secondary)" }} className="text-xs font-semibold mt-1 capitalize">
          {snapshot.meta.dataSource.replace("_", " ")}
        </p>
      </div>
    </div>
  );
}

export function SnapshotMainCard({
  snapshot,
  locationName,
  standard,
}: {
  snapshot: AirSnapshotResult;
  locationName?: string;
  standard: string;
}) {
  const aqiCat = snapshot.current.aqi.category;
  const bestWindow = snapshot.exposureWindows?.bestWindow;

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
      className="p-6 rounded-2xl border transition-colors space-y-5 shadow-2xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--accent)" }}>
              <Icon name="map-pin" size={20} />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {locationName ?? "Air Snapshot"}
            </h2>
          </div>
          <p style={{ color: "var(--text-muted)" }} className="text-xs mt-1">
            Updated {snapshot.meta.dataAgeMinutes}m ago via {snapshot.meta.attribution} • Model estimates for guidance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span style={{ color: "var(--text-primary)" }} className="text-3xl sm:text-4xl font-extrabold tabular-nums">
              {snapshot.current.aqi.aqi}
            </span>
            <span style={{ color: "var(--text-muted)" }} className="block text-2xs uppercase tracking-wider font-semibold">
              {standard === "india_naqi" ? "India NAQI" : "US AQI"}
            </span>
          </div>
          <Badge variant="aqi" aqiCategory={aqiCat} className="text-sm px-3.5 py-1.5 shadow-xs">
            {snapshot.current.aqi.categoryLabel}
          </Badge>
        </div>
      </div>

      {bestWindow && (
        <div
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderColor: "var(--border-subtle)",
          }}
          className="p-3.5 rounded-xl border flex items-center justify-between gap-3 flex-wrap"
        >
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--color-aqi-good)" }}>
              <Icon name="shield-check" size={17} />
            </span>
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              Optimal Outdoor Window: {String(bestWindow.startHour).padStart(2, "0")}:00 – {String(bestWindow.endHour).padStart(2, "0")}:00
            </span>
          </div>
          <span style={{ color: "var(--text-muted)" }} className="text-2xs">
            Average PM2.5: {Math.round(bestWindow.avgPm25)} µg/m³
          </span>
        </div>
      )}

      <div style={{ borderColor: "var(--border-subtle)" }} className="pt-4 border-t">
        <MetricsGrid snapshot={snapshot} />
      </div>
    </div>
  );
}

/**
 * @file hourly-card.tsx
 * @description Compact, high-clarity 24h forecast tile with border-highlighted current hour
 * and corner breathing dots for optimal/peak exposure windows.
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { HourlyAirPoint } from "@/schemas/air";
import { WindowFinderResult, getLocalHour } from "@/domain/windows";

function formatHour(isoString: string): string {
  try {
    return `${String(getLocalHour(isoString)).padStart(2, "0")}:00`;
  } catch {
    return isoString.slice(11, 16) || "00:00";
  }
}

function isInsideWindow(
  hour: number,
  windowData: { startHour: number; endHour: number } | null | undefined,
): boolean {
  if (!windowData) return false;
  return hour >= windowData.startHour && hour < windowData.endHour;
}

function CornerBreathingDot({
  isBest,
  isWorst,
}: {
  isBest: boolean;
  isWorst: boolean;
}) {
  if (isBest) {
    return (
      <span
        title="Optimal Window"
        aria-label="Optimal Window"
        style={{
          backgroundColor: "var(--color-aqi-good)",
          boxShadow: "0 0 6px var(--color-aqi-good)",
        }}
        className="w-2 h-2 rounded-full animate-pulse shrink-0"
      />
    );
  }
  if (isWorst) {
    return (
      <span
        title="Peak Exposure"
        aria-label="Peak Exposure"
        style={{
          backgroundColor: "var(--color-aqi-very-poor)",
          boxShadow: "0 0 6px var(--color-aqi-very-poor)",
        }}
        className="w-2 h-2 rounded-full animate-pulse shrink-0"
      />
    );
  }
  return null;
}

export function HourlyCard({
  pt,
  windows,
  currentHour,
}: {
  pt: HourlyAirPoint;
  windows?: WindowFinderResult | null;
  currentHour: number;
}) {
  const hourNum = new Date(pt.time).getHours();
  const isBest = isInsideWindow(hourNum, windows?.bestWindow);
  const isWorst = isInsideWindow(hourNum, windows?.worstWindow);
  const isNow = hourNum === currentHour;

  const tileStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-surface)",
    borderColor: isNow ? "var(--accent)" : "var(--border-subtle)",
    borderWidth: isNow ? "2px" : "1px",
    minWidth: "118px",
    maxWidth: "118px",
    height: "132px",
  };

  return (
    <div
      style={tileStyle}
      className="relative flex flex-col items-center justify-between px-2.5 py-2.5 rounded-xl border shrink-0 transition-all select-none tabular-nums shadow-2xs overflow-hidden"
    >
      <div className="w-full flex items-center justify-between gap-1 leading-none">
        <span
          className="text-xs font-semibold tabular-nums"
          style={{ color: isNow ? "var(--accent)" : "var(--text-primary)" }}
        >
          {formatHour(pt.time)}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {pt.temperatureC !== undefined && (
            <span style={{ color: "var(--text-muted)" }} className="text-2xs font-medium tabular-nums">
              {Math.round(pt.temperatureC)}°C
            </span>
          )}
          <CornerBreathingDot isBest={isBest} isWorst={isWorst} />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center my-0.5 leading-none">
        <span className="text-base font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
          {Math.round(pt.pm25)}
        </span>
        <span className="text-3xs mt-1 font-medium tabular-nums" style={{ color: "var(--text-muted)" }}>
          µg/m³
        </span>
      </div>

      <div className="w-full flex items-center justify-center">
        <Badge
          aqiCategory={pt.aqi.category}
          showShape={false}
          className="text-3xs px-2 py-0.5 truncate whitespace-nowrap max-w-full text-center leading-none"
        >
          {pt.aqi.categoryLabel}
        </Badge>
      </div>
    </div>
  );
}

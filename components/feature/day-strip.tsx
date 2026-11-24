/**
 * @file day-strip.tsx
 * @description Signature Day Strip component displaying a 24-hour horizontal forecast
 * with low-exposure window indicators, semantic AQI shapes, and accessible table view.
 */

"use client";

import React, { useState } from "react";
import { HourlyAirPoint } from "@/schemas/air";
import { WindowFinderResult, getLocalHour } from "@/domain/windows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { HourlyCard } from "./hourly-card";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/table";

export interface DayStripProps {
  hourly: HourlyAirPoint[];
  windows?: WindowFinderResult | null;
  currentTimeIso?: string;
  className?: string;
}

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



function DayStripTable({
  points,
  windows,
  currentHour,
}: {
  points: HourlyAirPoint[];
  windows?: WindowFinderResult | null;
  currentHour: number;
}) {
  return (
    <div data-testid="day-strip-table">
      <Table caption="24-Hour detailed hourly air quality and weather breakdown">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Time</TableHeaderCell>
            <TableHeaderCell>AQI Category</TableHeaderCell>
            <TableHeaderCell>PM2.5 (µg/m³)</TableHeaderCell>
            <TableHeaderCell>Temp</TableHeaderCell>
            <TableHeaderCell>Wind</TableHeaderCell>
            <TableHeaderCell>Exposure Status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {points.map((pt, idx) => {
            const hourNum = new Date(pt.time).getHours();
            const isBest = isInsideWindow(hourNum, windows?.bestWindow);
            const isWorst = isInsideWindow(hourNum, windows?.worstWindow);
            const isNow = hourNum === currentHour;

            return (
              <TableRow key={pt.time || idx}>
                <TableCell className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {formatHour(pt.time)} {isNow ? "(Now)" : ""}
                </TableCell>
                <TableCell>
                  <Badge variant="aqi" aqiCategory={pt.aqi.category}>{pt.aqi.categoryLabel}</Badge>
                </TableCell>
                <TableCell className="font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {Math.round(pt.pm25)}
                </TableCell>
                <TableCell style={{ color: "var(--text-secondary)" }}>
                  {pt.temperatureC !== undefined ? `${Math.round(pt.temperatureC)}°C` : "--"}
                </TableCell>
                <TableCell style={{ color: "var(--text-secondary)" }}>
                  {pt.windSpeedKmh !== undefined ? `${Math.round(pt.windSpeedKmh)} km/h` : "--"}
                </TableCell>
                <TableCell>
                  {isBest ? (
                    <span style={{ color: "var(--color-aqi-good)" }} className="font-semibold text-xs">
                      Lowest Exposure
                    </span>
                  ) : isWorst ? (
                    <span style={{ color: "var(--color-aqi-very-poor)" }} className="font-semibold text-xs">
                      Peak Smog Window
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }} className="text-xs">Standard</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function DayStripCards({
  points,
  windows,
  currentHour,
}: {
  points: HourlyAirPoint[];
  windows?: WindowFinderResult | null;
  currentHour: number;
}) {
  return (
    <div
      role="region"
      data-testid="day-strip-cards"
      aria-label="Horizontal scrollable hourly air forecast strip"
      tabIndex={0}
      className="flex gap-2.5 overflow-x-auto pb-3 pt-1 px-1 focus:outline-hidden rounded-xl"
    >
      {points.map((pt, idx) => (
        <HourlyCard
          key={pt.time || idx}
          pt={pt}
          windows={windows}
          currentHour={currentHour}
        />
      ))}
    </div>
  );
}

function DayStripHeader({
  windows,
  viewMode,
  setViewMode,
}: {
  windows?: WindowFinderResult | null;
  viewMode: "strip" | "table";
  setViewMode: (v: "strip" | "table") => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span style={{ color: "var(--accent)" }}>
            <Icon name="clock" size={18} />
          </span>
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            24-Hour Forecast & Exposure Windows
          </h2>
          {windows?.bestWindow && (
            <Badge variant="success" showShape={false}>
              Best Window: {String(windows.bestWindow.startHour).padStart(2, "0")}:00 – {String(windows.bestWindow.endHour).padStart(2, "0")}:00
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3.5 text-2xs" style={{ color: "var(--text-secondary)" }}>
          <span className="inline-flex items-center gap-1.5">
            <span
              style={{
                backgroundColor: "var(--color-aqi-good)",
                boxShadow: "0 0 6px var(--color-aqi-good)",
              }}
              className="w-2 h-2 rounded-full animate-pulse shrink-0"
            />
            <span>Optimal Window</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              style={{
                backgroundColor: "var(--color-aqi-very-poor)",
                boxShadow: "0 0 6px var(--color-aqi-very-poor)",
              }}
              className="w-2 h-2 rounded-full animate-pulse shrink-0"
            />
            <span>Peak Exposure</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              style={{ borderColor: "var(--accent)" }}
              className="w-2.5 h-2.5 rounded-xs border-2 shrink-0"
            />
            <span>Current Hour</span>
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setViewMode(viewMode === "strip" ? "table" : "strip")}
        aria-label={viewMode === "strip" ? "Switch to accessible table view" : "Switch to horizontal visual strip view"}
        className="text-xs shrink-0 self-start sm:self-auto"
      >
        {viewMode === "strip" ? "Table View" : "Strip View"}
      </Button>
    </div>
  );
}

export function DayStrip({
  hourly,
  windows,
  currentTimeIso,
  className = "",
}: DayStripProps) {
  const [viewMode, setViewMode] = useState<"strip" | "table">("strip");

  if (!hourly || hourly.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-muted)",
        }}
        className="p-6 text-center text-sm rounded-2xl border"
      >
        No hourly forecast data available.
      </div>
    );
  }

  const displayPoints = hourly.slice(0, 24);
  const currentHour = currentTimeIso ? getLocalHour(currentTimeIso) : -1;

  return (
    <section
      aria-label="Hourly air quality and exposure forecast"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
      className={`p-5 rounded-2xl border space-y-4 shadow-2xs ${className}`}
    >
      <DayStripHeader windows={windows} viewMode={viewMode} setViewMode={setViewMode} />

      {viewMode === "table" ? (
        <DayStripTable points={displayPoints} windows={windows} currentHour={currentHour} />
      ) : (
        <DayStripCards points={displayPoints} windows={windows} currentHour={currentHour} />
      )}
    </section>
  );
}

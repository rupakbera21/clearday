/**
 * @file day-strip.tsx
 * @description Signature Day Strip component displaying a 24-72h horizontal hourly forecast
 * with best/worst low-exposure window badges, colorblind AQI shapes, and table view toggle.
 * Addresses problem-statement: Low-emission daily routines, Day planner, Severe winter smog.
 */

"use client";

import React, { useState } from "react";
import { HourlyAirPoint } from "@/schemas/air";
import { WindowFinderResult } from "@/domain/windows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
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
    const d = new Date(isoString);
    return `${String(d.getHours()).padStart(2, "0")}:00`;
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

function getCardHighlightClass(isNow: boolean, isBest: boolean, isWorst: boolean): string {
  if (isNow) return "bg-slate-800 border-sky-400 shadow-md ring-1 ring-sky-400";
  if (isBest) return "bg-emerald-950/40 border-emerald-600/70";
  if (isWorst) return "bg-rose-950/40 border-rose-600/70";
  return "bg-slate-900 border-slate-800 hover:border-slate-700";
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
          <TableHeaderCell>AQI Band</TableHeaderCell>
          <TableHeaderCell>PM2.5 (ug/m3)</TableHeaderCell>
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
              <TableCell className="font-semibold text-slate-200">
                {formatHour(pt.time)} {isNow ? "(Now)" : ""}
              </TableCell>
              <TableCell>
                <Badge aqiCategory={pt.aqi.category}>{pt.aqi.categoryLabel}</Badge>
              </TableCell>
              <TableCell className="font-bold text-slate-100">{Math.round(pt.pm25)}</TableCell>
              <TableCell>{pt.temperatureC !== undefined ? `${Math.round(pt.temperatureC)} C` : "--"}</TableCell>
              <TableCell>{pt.windSpeedKmh !== undefined ? `${Math.round(pt.windSpeedKmh)} km/h` : "--"}</TableCell>
              <TableCell>
                {isBest ? (
                  <span className="text-emerald-400 font-semibold text-xs">Lowest Exposure</span>
                ) : isWorst ? (
                  <span className="text-rose-400 font-semibold text-xs">Peak Smog Window</span>
                ) : (
                  <span className="text-slate-400 text-xs">Standard</span>
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
      className="flex gap-2.5 overflow-x-auto pb-3 pt-1 px-1 focus:ring-2 focus:ring-sky-500 rounded-xl"
    >
      {points.map((pt, idx) => {
        const hourNum = new Date(pt.time).getHours();
        const isBest = isInsideWindow(hourNum, windows?.bestWindow);
        const isWorst = isInsideWindow(hourNum, windows?.worstWindow);
        const isNow = hourNum === currentHour;
        const cardClass = getCardHighlightClass(isNow, isBest, isWorst);

        return (
          <div
            key={pt.time || idx}
            className={`flex flex-col items-center justify-between p-3 rounded-xl border min-w-24 shrink-0 transition-all select-none tabular-nums ${cardClass}`}
          >
            <span className="text-xs font-semibold text-slate-300">{formatHour(pt.time)}</span>

            {isNow && (
              <span className="text-2xs font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-sky-500 text-slate-950 my-1">
                Now
              </span>
            )}

            <div className="my-2 flex flex-col items-center">
              <span className="text-xl font-extrabold text-slate-100">{Math.round(pt.pm25)}</span>
              <span className="text-2xs text-slate-400 font-medium">ug/m3</span>
            </div>

            <Badge aqiCategory={pt.aqi.category} showShape className="text-2xs px-2 py-0.5">
              {pt.aqi.categoryLabel.slice(0, 10)}
            </Badge>

            {isBest ? (
              <span className="mt-2 text-2xs font-bold text-emerald-300 bg-emerald-950/90 px-1.5 py-0.5 rounded-sm border border-emerald-800">
                Best
              </span>
            ) : isWorst ? (
              <span className="mt-2 text-2xs font-bold text-rose-300 bg-rose-950/90 px-1.5 py-0.5 rounded-sm border border-rose-800">
                Avoid
              </span>
            ) : pt.temperatureC !== undefined ? (
              <span className="mt-2 text-2xs text-slate-400">{Math.round(pt.temperatureC)} C</span>
            ) : null}
          </div>
        );
      })}
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
      <div className="p-6 text-center text-sm text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
        No hourly forecast data available.
      </div>
    );
  }

  const displayPoints = hourly.slice(0, 24);
  const currentHour = currentTimeIso ? new Date(currentTimeIso).getHours() : -1;

  return (
    <section aria-label="Hourly air quality and exposure forecast" className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Icon name="clock" size={18} className="text-sky-400" />
            <span>24-Hour Air Quality Outlook</span>
          </h2>
          {windows?.bestWindow && (
            <Badge variant="success" showShape={false}>
              Best Window: {String(windows.bestWindow.startHour).padStart(2, "0")}:00 -{" "}
              {String(windows.bestWindow.endHour).padStart(2, "0")}:00
            </Badge>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(viewMode === "strip" ? "table" : "strip")}
          aria-label={viewMode === "strip" ? "Switch to accessible table view" : "Switch to horizontal visual strip view"}
          className="text-xs shrink-0"
        >
          {viewMode === "strip" ? "Table View" : "Strip View"}
        </Button>
      </div>

      {viewMode === "table" ? (
        <DayStripTable points={displayPoints} windows={windows} currentHour={currentHour} />
      ) : (
        <DayStripCards points={displayPoints} windows={windows} currentHour={currentHour} />
      )}
    </section>
  );
}

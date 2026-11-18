/**
 * @file plan-view.tsx
 * @description Today's Plan screen rendering low-exposure windows and tailored routine blocks.
 * Addresses problem-statement: low-emission daily routines, day planner, Rules first, AI second.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/use-app-store";
import { TailoredPlan, TimeBlock } from "@/schemas/ai";
import { ExposureWindow } from "@/domain/windows";
import { createRuleBasedPlan } from "@/services/ai/prompts/plan";
import { selectKnowledgeItems } from "@/data/knowledge/select";
import { getKnowledgeItemDisplay } from "@/data/knowledge";
import { generateICS, downloadICSFile } from "@/services/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

function PlanWindowsCard({
  bestWindow,
  worstWindow,
  onDownloadReminder,
}: {
  bestWindow?: ExposureWindow | null;
  worstWindow?: ExposureWindow | null;
  onDownloadReminder?: () => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
        className="p-5 rounded-2xl border space-y-2.5 shadow-2xs"
      >
        <div className="flex items-center justify-between">
          <span style={{ color: "var(--color-aqi-good)" }} className="text-xs uppercase font-bold flex items-center gap-1.5">
            <Icon name="sun" size={16} />
            Best Window For Outdoors
          </span>
          <div className="flex items-center gap-2">
            {onDownloadReminder && (
              <button
                type="button"
                onClick={onDownloadReminder}
                style={{
                  color: "var(--color-aqi-good)",
                  borderColor: "var(--color-aqi-good)",
                }}
                className="text-2xs flex items-center gap-1 px-2.5 py-1 rounded-lg border font-medium cursor-pointer hover:opacity-80 transition-opacity"
                aria-label="Add optimal window to calendar"
              >
                <Icon name="calendar" size={12} />
                Add to Calendar
              </button>
            )}
            <Badge variant="success" showShape={false}>Optimal</Badge>
          </div>
        </div>
        <p className="text-2xl font-extrabold tabular-nums tracking-tight" style={{ color: "var(--text-primary)" }}>
          {bestWindow ? `${String(bestWindow.startHour).padStart(2, "0")}:00 – ${String(bestWindow.endHour).padStart(2, "0")}:00` : "13:00 – 15:00"}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {bestWindow?.recommendation ?? "Boundary layer is highest; ambient PM2.5 dips to day's lowest concentration."}
        </p>
      </div>

      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
        className="p-5 rounded-2xl border space-y-2.5 shadow-2xs"
      >
        <div className="flex items-center justify-between">
          <span style={{ color: "var(--color-aqi-very-poor)" }} className="text-xs uppercase font-bold flex items-center gap-1.5">
            <Icon name="alert-triangle" size={16} />
            Avoid Outdoor Movement
          </span>
          <Badge variant="danger" showShape={false}>Peak Smog</Badge>
        </div>
        <p className="text-2xl font-extrabold tabular-nums tracking-tight" style={{ color: "var(--text-primary)" }}>
          {worstWindow ? `${String(worstWindow.startHour).padStart(2, "0")}:00 – ${String(worstWindow.endHour).padStart(2, "0")}:00` : "07:00 – 09:00"}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {worstWindow?.recommendation ?? "Morning surface inversion traps vehicle and biomass emissions. Avoid morning runs and outdoor play."}
        </p>
      </div>
    </div>
  );
}

function SevereModeBanner() {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-aqi-severe)",
        borderColor: "var(--color-aqi-severe)",
      }}
      className="p-4 rounded-xl border space-y-1.5"
    >
      <div className="flex items-center gap-2 font-bold text-sm" style={{ color: "var(--color-aqi-severe)" }}>
        <Icon name="alert-triangle" size={18} />
        <span>Severe-Day Contingency Action Plan</span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>
        When ambient AQI exceeds 400 (Severe), all non-essential outdoor commutes, school sports, and outdoor exercise should be paused. Seal doors with damp towels, operate HEPA filtration continuously on high in sleeping rooms, and wear a certified N95 respirator if stepping outside is unavoidable.
      </p>
    </div>
  );
}

function PlanBlockItem({ block }: { block: TimeBlock }) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface-elevated)",
        borderColor: "var(--border-subtle)",
      }}
      className="p-4 rounded-xl border space-y-2 shadow-2xs"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-sm tabular-nums" style={{ color: "var(--accent)" }}>
            {block.timeRange}
          </span>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {block.activity}
          </span>
        </div>
        <Badge variant="outline" showShape={false} className="capitalize text-2xs">
          {block.microenvironment.replace("_", " ")}
        </Badge>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        <strong style={{ color: "var(--text-primary)" }}>Action:</strong> {block.actionAdvice}
      </p>
      <p className="text-2xs" style={{ color: "var(--text-muted)" }}>
        <strong style={{ color: "var(--text-secondary)" }}>Why:</strong> {block.reason}
      </p>

      {block.citedKnowledgeIds.length > 0 && (
        <div className="flex items-center gap-1.5 pt-1.5 text-2xs flex-wrap" style={{ color: "var(--text-muted)" }}>
          <span>Vetted Guidance:</span>
          {block.citedKnowledgeIds.map((kid) => {
            const display = getKnowledgeItemDisplay(kid);
            return (
              <span
                key={kid}
                title={kid}
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
                className="px-2 py-0.5 rounded-md border font-medium"
              >
                {display.title}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RoutineHeader({
  activePlan,
  severeMode,
  setSevereMode,
  onTailor,
  isLoading,
}: {
  activePlan: TailoredPlan | null;
  severeMode: boolean;
  setSevereMode: (v: boolean) => void;
  onTailor: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {activePlan?.headline ?? "Low-Emission Daily Routine"}
          </h2>
          {activePlan?.isRuleBased && <Badge variant="outline" showShape={false}>Rule-Based</Badge>}
        </div>
        <p className="text-xs mt-1 max-w-xl" style={{ color: "var(--text-secondary)" }}>
          {activePlan?.summary ?? "Prioritize outdoor tasks during lowest-exposure hours and seal indoor living areas during inversion peaks."}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant={severeMode ? "destructive" : "outline"}
          size="sm"
          onClick={() => setSevereMode(!severeMode)}
        >
          {severeMode ? "Severe Mode ON" : "Severe Day Mode"}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onTailor}
          isLoading={isLoading}
          leftIcon={<Icon name="sparkles" size={16} />}
        >
          Tailor with AI
        </Button>
      </div>
    </div>
  );
}

function downloadOptimalWindowIcs(best?: ExposureWindow | null, locationName?: string) {
  if (!best) return;
  const start = new Date();
  start.setHours(best.startHour, 0, 0, 0);
  const end = new Date();
  end.setHours(best.endHour, 0, 0, 0);

  const ics = generateICS({
    title: "Optimal Outdoor Exposure Window (Clearday)",
    description: `Safest outdoor window: ${best.recommendation}. Predicted PM2.5: ~${Math.round(best.avgPm25)} ug/m3.`,
    location: locationName ?? "Current City",
    startDate: start,
    endDate: end,
  });

  downloadICSFile(`clearday-outdoor-window-${best.startHour}h`, ics);
}

export function PlanView() {
  const profile = useAppStore((state) => state.householdProfile);
  const airSnapshot = useAppStore((state) => state.airSnapshot);
  const selectedLocation = useAppStore((state) => state.selectedLocation);
  const activePlan = useAppStore((state) => state.activePlan);
  const setActivePlan = useAppStore((state) => state.setActivePlan);

  const [isLoading, setIsLoading] = useState(false);
  const [severeMode, setSevereMode] = useState(false);

  useEffect(() => {
    if (!activePlan && airSnapshot) {
      const knowledge = selectKnowledgeItems({ limit: 4 });
      const rulePlan = createRuleBasedPlan(profile, airSnapshot.exposureWindows, airSnapshot.riskBands, knowledge);
      setActivePlan(rulePlan);
    }
  }, [activePlan, airSnapshot, profile, setActivePlan]);

  const handleGenerateAiPlan = useCallback(async () => {
    if (!airSnapshot) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/tailor-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, windows: airSnapshot.exposureWindows, riskBands: airSnapshot.riskBands }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.data) setActivePlan(result.data as TailoredPlan);
      }
    } finally {
      setIsLoading(false);
    }
  }, [airSnapshot, profile, setActivePlan]);

  const bestWindow = airSnapshot?.exposureWindows?.bestWindow;
  const onDownloadReminder = bestWindow ? () => downloadOptimalWindowIcs(bestWindow, selectedLocation?.name) : undefined;

  return (
    <section aria-label="Today's Low-Exposure Plan" className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Today's Plan
        </h1>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Hour-by-hour exposure schedule tailored to current air conditions and household sensitivities.
        </p>
      </div>

      <PlanWindowsCard
        bestWindow={bestWindow}
        worstWindow={airSnapshot?.exposureWindows?.worstWindow}
        onDownloadReminder={onDownloadReminder}
      />

      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
        className="p-6 rounded-2xl border space-y-5 shadow-2xs"
      >
        <RoutineHeader
          activePlan={activePlan}
          severeMode={severeMode}
          setSevereMode={setSevereMode}
          onTailor={handleGenerateAiPlan}
          isLoading={isLoading}
        />
        {severeMode && <SevereModeBanner />}
        <div className="space-y-3 pt-2">
          {activePlan?.timeBlocks.map((block) => (
            <PlanBlockItem key={block.timeRange} block={block} />
          ))}
        </div>
      </div>
    </section>
  );
}

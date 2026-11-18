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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

function PlanWindowsCard({
  bestWindow,
  worstWindow,
}: {
  bestWindow?: ExposureWindow | null;
  worstWindow?: ExposureWindow | null;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-emerald-400 flex items-center gap-1.5">
            <Icon name="sun" size={16} />
            Best Window For Outdoors
          </span>
          <Badge variant="success" showShape={false}>Optimal</Badge>
        </div>
        <p className="text-2xl font-extrabold text-emerald-200 tabular-nums">
          {bestWindow ? `${String(bestWindow.startHour).padStart(2, "0")}:00 - ${String(bestWindow.endHour).padStart(2, "0")}:00` : "13:00 - 15:00"}
        </p>
        <p className="text-xs text-emerald-300/90 leading-relaxed">
          {bestWindow?.recommendation ?? "Boundary layer is highest; ambient PM2.5 dips to day's lowest concentration."}
        </p>
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/40 border border-rose-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-rose-400 flex items-center gap-1.5">
            <Icon name="alert-triangle" size={16} />
            Avoid Outdoor Movement
          </span>
          <Badge variant="danger" showShape={false}>Peak Smog</Badge>
        </div>
        <p className="text-2xl font-extrabold text-rose-200 tabular-nums">
          {worstWindow ? `${String(worstWindow.startHour).padStart(2, "0")}:00 - ${String(worstWindow.endHour).padStart(2, "0")}:00` : "07:00 - 09:00"}
        </p>
        <p className="text-xs text-rose-300/90 leading-relaxed">
          {worstWindow?.recommendation ?? "Morning surface inversion traps vehicle and biomass emissions. Avoid morning runs and outdoor play."}
        </p>
      </div>
    </div>
  );
}

function SevereModeBanner() {
  return (
    <div className="p-4 rounded-xl bg-purple-950/60 border border-purple-800 space-y-2">
      <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
        <Icon name="alert-triangle" size={18} />
        <span>Severe-Day Contingency Action Plan</span>
      </div>
      <p className="text-xs text-purple-200 leading-relaxed">
        When ambient AQI exceeds 400 (Severe), all non-essential outdoor commutes, school sports, and outdoor exercise should be paused. Seal doors with damp towels, operate HEPA filtration continuously on high in sleeping rooms, and wear a certified N95 respirator if stepping outside is unavoidable.
      </p>
    </div>
  );
}

function PlanBlockItem({ block }: { block: TimeBlock }) {
  return (
    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-sky-400 tabular-nums">{block.timeRange}</span>
          <span className="text-sm font-semibold text-slate-200">{block.activity}</span>
        </div>
        <Badge variant="outline" showShape={false} className="capitalize text-2xs">
          {block.microenvironment.replace("_", " ")}
        </Badge>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        <strong className="text-slate-100">Action:</strong> {block.actionAdvice}
      </p>
      <p className="text-2xs text-slate-400">
        <strong className="text-slate-300">Why:</strong> {block.reason}
      </p>
      {block.citedKnowledgeIds.length > 0 && (
        <div className="flex items-center gap-1.5 pt-1 text-2xs text-slate-500">
          <span>Vetted Guidance:</span>
          {block.citedKnowledgeIds.map((kid) => (
            <span key={kid} className="px-1.5 py-0.5 rounded-sm bg-slate-800 text-slate-400 border border-slate-700">
              {kid}
            </span>
          ))}
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
          <h2 className="text-lg font-bold text-slate-100">{activePlan?.headline ?? "Low-Emission Daily Routine"}</h2>
          {activePlan?.isRuleBased && <Badge variant="outline" showShape={false}>Rule-Based</Badge>}
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          {activePlan?.summary ?? "Prioritize outdoor tasks during lowest-exposure hours and seal indoor living areas during inversion peaks."}
        </p>
      </div>

      <div className="flex items-center gap-2">
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

export function PlanView() {
  const profile = useAppStore((state) => state.householdProfile);
  const airSnapshot = useAppStore((state) => state.airSnapshot);
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

  return (
    <section aria-label="Today's Low-Exposure Plan" className="space-y-6">
      <PlanWindowsCard
        bestWindow={airSnapshot?.exposureWindows?.bestWindow}
        worstWindow={airSnapshot?.exposureWindows?.worstWindow}
      />

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
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

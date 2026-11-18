/**
 * @file impact-view.tsx
 * @description Impact Lab what-if sandbox calculating inhaled PM2.5 and CO2e differences with grounded AI explanation.
 * Addresses problem-statement: clearly explaining the direct impact of their choices, Impact Lab.
 */

"use client";

import React, { useState, useMemo } from "react";
import { useAppStore, ImpactChoices, BASELINE_IMPACT_CHOICES } from "@/store/use-app-store";
import {
  calculateInhaledExposure,
  ActivitySegment,
  MaskType,
  MicroenvironmentType,
  ExposureEstimateResult,
} from "@/domain/exposure";
import { COMMUTE_EMISSION_FACTORS } from "@/data/parameters";
import { FactItem, ImpactExplanation } from "@/schemas/ai";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

function buildDaySegments(
  ambientPm25: number,
  commuteMode: string,
  commuteKm: number,
  maskType: MaskType,
  purifier: boolean,
  windowBehavior: string,
): ActivitySegment[] {
  const homeEnv: MicroenvironmentType = purifier
    ? "indoors_hepa"
    : windowBehavior === "open"
      ? "indoors_open"
      : "indoors_standard";

  const commuteEnv: MicroenvironmentType =
    commuteMode === "car_recirc" || commuteMode === "metro"
      ? "vehicle_recirc"
      : commuteMode === "cycle_walk"
        ? "active_transit"
        : "vehicle_open";

  const commuteHours = Math.max(0.5, (commuteKm * 2) / 25);

  return [
    { label: "Home Sleep & Evening", durationHours: 12, microenvironment: homeEnv, exertion: "rest", mask: "none", ambientPm25 },
    { label: "Home Day Living", durationHours: Math.max(0, 10 - commuteHours), microenvironment: homeEnv, exertion: "light", mask: "none", ambientPm25 },
    { label: "Daily Commute", durationHours: commuteHours, microenvironment: commuteEnv, exertion: commuteMode === "cycle_walk" ? "moderate" : "rest", mask: maskType, ambientPm25 },
    { label: "Outdoor Tasks & Errands", durationHours: 2, microenvironment: "outdoors", exertion: "light", mask: maskType, ambientPm25 },
  ];
}

function ImpactControls({
  choices,
  updateChoice,
}: {
  choices: ImpactChoices;
  updateChoice: <K extends keyof ImpactChoices>(key: K, value: ImpactChoices[K]) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Select
          label="Commute Mode"
          value={choices.commuteMode}
          onChange={(e) => updateChoice("commuteMode", e.target.value as typeof choices.commuteMode)}
          options={[
            { value: "metro", label: "Metro / Electric Rail" },
            { value: "bus", label: "Public Bus" },
            { value: "car_recirc", label: "Car (Recirculation ON)" },
            { value: "two_wheeler", label: "Motorcycle / Scooter" },
            { value: "cycle_walk", label: "Bicycle / Walking" },
          ]}
        />
        <Select
          label="Mask Type Outdoors"
          value={choices.maskType}
          onChange={(e) => updateChoice("maskType", e.target.value as typeof choices.maskType)}
          options={[
            { value: "n95_fitted", label: "Fitted N95 Respirator" },
            { value: "kn95_earloop", label: "KN95 (Earloop)" },
            { value: "surgical", label: "Surgical Mask" },
            { value: "cloth", label: "Cloth Mask / Scarf" },
            { value: "none", label: "No Mask" },
          ]}
        />
        <Select
          label="Window Behavior"
          value={choices.windowBehavior}
          onChange={(e) => updateChoice("windowBehavior", e.target.value as typeof choices.windowBehavior)}
          options={[
            { value: "closed_standard", label: "Windows Closed" },
            { value: "closed_weatherstripped", label: "Weatherstripped / Sealed" },
            { value: "open", label: "Windows Open" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
        <Switch
          label="Home Air Purifier (HEPA)"
          description="Continuous mechanical filtration in living area"
          checked={choices.airPurifier}
          onChange={(checked) => updateChoice("airPurifier", checked)}
        />
        <Switch
          label="Kitchen Exhaust / Chimney"
          description="Exhaust active during high-heat cooking"
          checked={choices.cookingVentilation}
          onChange={(checked) => updateChoice("cookingVentilation", checked)}
        />
      </div>
    </>
  );
}

function ImpactResultsCards({
  chosenExp,
  baseExp,
  reductionPct,
  co2eAvoided,
  roundTripKm,
}: {
  chosenExp: ExposureEstimateResult;
  baseExp: ExposureEstimateResult;
  reductionPct: number;
  co2eAvoided: number;
  roundTripKm: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
      <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
        <span className="text-xs uppercase font-bold text-sky-400">Estimated Daily Inhaled PM2.5</span>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-100 tabular-nums">
            {Math.round(chosenExp.totalInhaledMassUg.central)}
          </span>
          <span className="text-sm font-semibold text-slate-400">ug / day</span>
          <Badge variant="success" showShape={false} className="ml-auto text-xs">
            -{reductionPct}% Exposure
          </Badge>
        </div>
        <p className="text-xs text-slate-400">
          Down from <strong className="text-slate-200">{Math.round(baseExp.totalInhaledMassUg.central)} ug</strong> in baseline.
          Range: [{Math.round(chosenExp.totalInhaledMassUg.low)} - {Math.round(chosenExp.totalInhaledMassUg.high)} ug].
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
        <span className="text-xs uppercase font-bold text-emerald-400">Avoided Tailpipe Emissions</span>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-100 tabular-nums">{co2eAvoided}</span>
          <span className="text-sm font-semibold text-slate-400">g CO2e / day</span>
        </div>
        <p className="text-xs text-slate-400">
          Personal emissions avoided vs combustion commute over a {roundTripKm} km round-trip.
        </p>
      </div>
    </div>
  );
}

function ImpactExplanationBox({
  explanation,
  isExplaining,
  onExplain,
}: {
  explanation: ImpactExplanation | null;
  isExplaining: boolean;
  onExplain: () => void;
}) {
  return (
    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">Grounded Impact Narrative</span>
        <Button variant="outline" size="sm" onClick={onExplain} isLoading={isExplaining} leftIcon={<Icon name="sparkles" size={14} />}>
          Explain in Plain Words
        </Button>
      </div>
      {explanation ? (
        <div className="space-y-2 pt-1 text-xs text-slate-300">
          <p className="leading-relaxed">{explanation.narrative}</p>
          <div className="flex items-center gap-1.5 flex-wrap text-2xs text-slate-500">
            <span>Verified Fact Citations:</span>
            {explanation.citedFactIds.map((fid) => (
              <span key={fid} className="px-1.5 py-0.5 rounded-sm bg-slate-800 text-slate-300 border border-slate-700">
                {fid}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic">
          Click &quot;Explain in Plain Words&quot; to synthesize an honest, grounded narrative citing these computational facts.
        </p>
      )}
    </div>
  );
}

export function ImpactView() {
  const choices = useAppStore((state) => state.impactChoices);
  const updateChoice = useAppStore((state) => state.updateImpactChoice);
  const airSnapshot = useAppStore((state) => state.airSnapshot);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<ImpactExplanation | null>(null);

  const currentPm25 = airSnapshot?.current.pm25 ?? 180;

  const { baselineExposure, chosenExposure, reductionPct, co2eAvoidedGrams, facts } = useMemo(() => {
    const baseSegments = buildDaySegments(currentPm25, BASELINE_IMPACT_CHOICES.commuteMode, BASELINE_IMPACT_CHOICES.commuteDistanceKm, BASELINE_IMPACT_CHOICES.maskType, BASELINE_IMPACT_CHOICES.airPurifier, BASELINE_IMPACT_CHOICES.windowBehavior);
    const chosenSegments = buildDaySegments(currentPm25, choices.commuteMode, choices.commuteDistanceKm, choices.maskType, choices.airPurifier, choices.windowBehavior);
    const baseExp = calculateInhaledExposure(baseSegments, "adult");
    const chosenExp = calculateInhaledExposure(chosenSegments, "adult");
    const baseUg = Math.round(baseExp.totalInhaledMassUg.central);
    const chosenUg = Math.round(chosenExp.totalInhaledMassUg.central);
    const redPct = baseUg > 0 ? Math.round(((baseUg - chosenUg) / baseUg) * 100) : 0;
    const baseKm = choices.commuteDistanceKm * 2;
    const baseCo2ePerKm = COMMUTE_EMISSION_FACTORS.two_wheeler?.central ?? 110;
    const chosenCo2ePerKm = COMMUTE_EMISSION_FACTORS[choices.commuteMode]?.central ?? 20;
    const co2eAvoided = Math.max(0, Math.round(baseKm * (baseCo2ePerKm - chosenCo2ePerKm)));

    const computedFacts: Record<string, FactItem> = {
      fact_baseline_inhaled: { id: "fact_baseline_inhaled", value: baseUg, label: "Baseline Inhaled PM2.5 (ug)" },
      fact_chosen_inhaled: { id: "fact_chosen_inhaled", value: chosenUg, label: "Chosen Inhaled PM2.5 (ug)" },
      fact_reduction_pct: { id: "fact_reduction_pct", value: redPct, label: "Exposure Reduction (%)" },
      fact_emissions_avoided: { id: "fact_emissions_avoided", value: co2eAvoided, label: "Avoided CO2e (g)" },
    };
    return { baselineExposure: baseExp, chosenExposure: chosenExp, reductionPct: redPct, co2eAvoidedGrams: co2eAvoided, facts: computedFacts };
  }, [choices, currentPm25]);

  const handleExplain = async () => {
    setIsExplaining(true);
    try {
      const res = await fetch("/api/ai/explain-impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facts }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.data) setExplanation(result.data as ImpactExplanation);
      }
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <section aria-label="Impact Lab What-If Sandbox" className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Icon name="activity" size={20} className="text-sky-400" />
            <span>Impact Lab: Personal Exposure & Emissions Sandbox</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Toggle daily choices to observe the mathematical reduction in inhaled PM2.5 and tailpipe emissions.
          </p>
        </div>
        <ImpactControls choices={choices} updateChoice={updateChoice} />
        <ImpactResultsCards
          chosenExp={chosenExposure}
          baseExp={baselineExposure}
          reductionPct={reductionPct}
          co2eAvoided={co2eAvoidedGrams}
          roundTripKm={choices.commuteDistanceKm * 2}
        />
        <ImpactExplanationBox explanation={explanation} isExplaining={isExplaining} onExplain={handleExplain} />
      </div>
    </section>
  );
}

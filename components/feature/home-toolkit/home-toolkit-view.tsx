/**
 * @file home-toolkit-view.tsx
 * @description Home Air Toolkit with purifier & DIY sizing calculator and myth vs fact guide.
 * Addresses problem-statement: indoor air quality hacks, purifier and DIY sizing calculator, myth vs fact.
 */

"use client";

import React, { useState, useMemo } from "react";
import { calculateIndoorAir, IndoorReductionResult } from "@/domain/indoor";
import { selectKnowledgeItems } from "@/data/knowledge/select";
import { KnowledgeItem } from "@/data/knowledge/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

interface CalculatorInputsProps {
  floorAreaM2: number;
  setFloorAreaM2: (v: number) => void;
  ceilingHeightM: number;
  setCeilingHeightM: (v: number) => void;
  windowState: "closed_standard" | "closed_weatherstripped" | "open";
  setWindowState: (v: "closed_standard" | "closed_weatherstripped" | "open") => void;
  cadrM3H: number;
  onCadrChange: (v: number) => void;
}

function CalculatorInputs({
  floorAreaM2,
  setFloorAreaM2,
  ceilingHeightM,
  setCeilingHeightM,
  windowState,
  setWindowState,
  cadrM3H,
  onCadrChange,
}: CalculatorInputsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <Input
        label="Room Area (m²)"
        type="number"
        value={floorAreaM2}
        onChange={(e) => setFloorAreaM2(Math.max(5, Number(e.target.value) || 5))}
      />
      <Input
        label="Ceiling Height (m)"
        type="number"
        step="0.1"
        value={ceilingHeightM}
        onChange={(e) => setCeilingHeightM(Math.max(2, Number(e.target.value) || 2.4))}
      />
      <Select
        label="Window Sealing"
        value={windowState}
        onChange={(e) => setWindowState(e.target.value as typeof windowState)}
        options={[
          { value: "closed_standard", label: "Closed (Standard)" },
          { value: "closed_weatherstripped", label: "Closed (Weatherstripped)" },
          { value: "open", label: "Open Windows" },
        ]}
      />
      <Input
        label="Purifier CADR (m³/h)"
        type="number"
        value={cadrM3H}
        onChange={(e) => onCadrChange(Math.max(0, Number(e.target.value) || 0))}
      />
    </div>
  );
}

function CalculatorResults({
  result,
  ambientPm25,
}: {
  result: IndoorReductionResult;
  ambientPm25: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800">
      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
        <span className="text-xs uppercase font-bold text-slate-400">Total Air Changes / Hr</span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 tabular-nums">
            {result.totalAch.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400">ACH</span>
        </div>
        <p className="text-2xs text-slate-400">
          Clean air: {result.cleanAirAch.toFixed(1)} ACH | Natural: {result.naturalAch.toFixed(1)} ACH
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
        <span className="text-xs uppercase font-bold text-sky-400">Indoor PM2.5 Reduction</span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 tabular-nums">
            {result.reductionPercentage}%
          </span>
          <span className="text-xs text-sky-400 font-semibold">Drop</span>
        </div>
        <p className="text-2xs text-slate-400">
          Estimated indoor PM2.5: ~{result.estimatedIndoorPm25.central} ug/m3 (from {ambientPm25} ug/m3 ambient)
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
        <span className="text-xs uppercase font-bold text-slate-400">Purifier Sizing Status</span>
        <div className="pt-1">
          {result.isAdequatelySized ? (
            <Badge variant="success" showShape={false}>Adequately Sized ({result.cleanAirAch.toFixed(1)} ACH &gt;= 4)</Badge>
          ) : (
            <Badge variant="warning" showShape={false}>Undersized (Target: {result.recommendedCadrM3H} m³/h)</Badge>
          )}
        </div>
        <p className="text-2xs text-slate-400 pt-1">
          Recommended minimum CADR: {result.recommendedCadrM3H} m³/h for this room volume.
        </p>
      </div>
    </div>
  );
}

function MythFactPanel({ items }: { items: KnowledgeItem[] }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-100">Indoor Air Hacks: Myth vs Fact</h3>
        <p className="text-xs text-slate-400 mt-0.5">Evidence-based facts vetted by environmental health research.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
            <span className="text-xs font-bold text-sky-400">{item.title}</span>
            <p className="text-xs text-slate-300 leading-relaxed">{item.guidance}</p>
            <div className="pt-1 text-2xs text-slate-500">
              <span>Evidence: {item.evidenceStrength} | Source: {item.sourceOrg}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomeToolkitView() {
  const [floorAreaM2, setFloorAreaM2] = useState(25);
  const [ceilingHeightM, setCeilingHeightM] = useState(2.8);
  const [windowState, setWindowState] = useState<"closed_standard" | "closed_weatherstripped" | "open">("closed_standard");
  const [cadrM3H, setCadrM3H] = useState(300);
  const [hasPurifier, setHasPurifier] = useState(true);

  const currentAmbientPm25 = 200;

  const result = useMemo(() => {
    return calculateIndoorAir(
      { floorAreaM2, ceilingHeightM, windowState },
      { hasPurifier, cadrM3H },
      currentAmbientPm25,
    );
  }, [floorAreaM2, ceilingHeightM, windowState, hasPurifier, cadrM3H]);

  const mythItems = useMemo(() => {
    return selectKnowledgeItems({ topics: ["myths", "purifiers", "ventilation"], limit: 4 });
  }, []);

  const handleApplyDiyPreset = () => {
    setHasPurifier(true);
    setCadrM3H(480);
  };

  return (
    <section aria-label="Home Air Quality Toolkit" className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Icon name="filter" size={20} className="text-sky-400" />
              <span>Purifier & DIY Box Fan Sizing Calculator</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Physics-based single-compartment mass balance estimating indoor PM2.5 reduction and air changes per hour (ACH).
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleApplyDiyPreset} leftIcon={<Icon name="sparkles" size={14} />}>
            Apply DIY Box Fan Preset (480 m³/h)
          </Button>
        </div>

        <CalculatorInputs
          floorAreaM2={floorAreaM2}
          setFloorAreaM2={setFloorAreaM2}
          ceilingHeightM={ceilingHeightM}
          setCeilingHeightM={setCeilingHeightM}
          windowState={windowState}
          setWindowState={setWindowState}
          cadrM3H={cadrM3H}
          onCadrChange={(val) => {
            setCadrM3H(val);
            setHasPurifier(val > 0);
          }}
        />

        <CalculatorResults result={result} ambientPm25={currentAmbientPm25} />
      </div>

      <MythFactPanel items={mythItems} />
    </section>
  );
}

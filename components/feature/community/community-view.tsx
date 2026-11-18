"use client";

/**
 * @file community-view.tsx
 * @description Community Toolkit for schools, housing societies, and workplaces.
 * Generates printable one-page advisories (@media print) and shareable text templates.
 * Addresses problem-statement: "communities" — printable advisories, actionable collective protocols.
 */

import React, { useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

type AdvisoryType = "school" | "housing" | "workplace";

interface ActionItem {
  threshold: string;
  action: string;
  category: "ventilation" | "activity" | "sensitive_groups" | "community_rules";
}

interface AdvisoryConfig {
  title: string;
  subtitle: string;
  actions: ActionItem[];
}

const COMMUNITY_PROTOCOLS: Record<AdvisoryType, AdvisoryConfig> = {
  school: {
    title: "School Smog Action Plan & Outdoor Advisory",
    subtitle: "Protective guidelines for students, sports, recess, and school buses during elevated AQI.",
    actions: [
      {
        threshold: "AQI > 200 (Poor / Unhealthy)",
        action: "Relocate all outdoor morning assemblies and physical education classes indoors.",
        category: "activity",
      },
      {
        threshold: "AQI > 300 (Very Poor)",
        action: "Suspend all outdoor sports, inter-school athletics, and field trips. Keep classroom windows closed.",
        category: "activity",
      },
      {
        threshold: "AQI > 400 (Severe)",
        action: "Activate virtual learning protocol or mandatory indoor shelter with active classroom air purification.",
        category: "sensitive_groups",
      },
      {
        threshold: "General",
        action: "Strict no-idling enforcement for school buses and parent pickup vehicles within 200m of gates.",
        category: "community_rules",
      },
    ],
  },
  housing: {
    title: "Residential Society & Apartment Complex Clean Air Charter",
    subtitle: "Collective community actions to reduce shared smoke exposure and protect elderly and infant residents.",
    actions: [
      {
        threshold: "Zero Tolerance",
        action: "Strict community prohibition on open leaf burning, waste burning, and construction debris burning.",
        category: "community_rules",
      },
      {
        threshold: "AQI > 200",
        action: "Seal community hall and clubhouse as a designated Clean Air Sanctuary for elders and infants.",
        category: "sensitive_groups",
      },
      {
        threshold: "AQI > 300",
        action: "Halt all dry sweeping of driveways and paths; mandate wet misting or damp mopping to curb dust resuspension.",
        category: "ventilation",
      },
      {
        threshold: "Daily",
        action: "Provide electric heaters or insulated gear to night security staff to prevent biomass/wood warming fires.",
        category: "community_rules",
      },
    ],
  },
  workplace: {
    title: "Workplace & Office Facility Smog Preparedness Advisory",
    subtitle: "Operational measures for employee health, commute safety, and commercial HVAC protection.",
    actions: [
      {
        threshold: "AQI > 200",
        action: "Allow flexible check-in hours to avoid peak rush-hour smog (7:00-9:30 AM) and heavy traffic stagnation.",
        category: "activity",
      },
      {
        threshold: "AQI > 300",
        action: "Mandate Work-From-Home (WFH) for pregnant employees, asthma sufferers, and staff with respiratory vulnerabilities.",
        category: "sensitive_groups",
      },
      {
        threshold: "Facility HVAC",
        action: "Upgrade central AHU filters to MERV 13 minimum; recirculate conditioned indoor air and limit fresh air damper intake to 15%.",
        category: "ventilation",
      },
      {
        threshold: "Field Staff",
        action: "Distribute certified N95 / FFP2 respirators with proper fit guidance to all outdoor security, delivery, and maintenance staff.",
        category: "sensitive_groups",
      },
    ],
  },
};

function AdvisoryHeader({
  selectedType,
  setSelectedType,
  copied,
  onCopy,
  onPrint,
}: {
  selectedType: AdvisoryType;
  setSelectedType: (t: AdvisoryType) => void;
  copied: boolean;
  onCopy: () => void;
  onPrint: () => void;
}) {
  return (
    <div className="print:hidden space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Icon name="community" className="w-6 h-6 text-emerald-400" />
            <span>Community Air Quality Toolkit</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            One-page printable advisories and collective protocols for institutions, apartments, and workplaces.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onCopy} aria-label="Copy plain text advisory">
            <Icon name="check" className="w-4 h-4 text-emerald-400" />
            <span>{copied ? "Copied!" : "Copy Text"}</span>
          </Button>
          <Button variant="primary" size="sm" onClick={onPrint} aria-label="Print advisory one-pager">
            <Icon name="download" className="w-4 h-4" />
            <span>Print One-Pager</span>
          </Button>
        </div>
      </div>

      <div className="flex gap-2 pt-1" role="group" aria-label="Advisory type selector">
        <Button
          variant={selectedType === "school" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setSelectedType("school")}
          aria-pressed={selectedType === "school"}
        >
          Schools & Nurseries
        </Button>
        <Button
          variant={selectedType === "housing" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setSelectedType("housing")}
          aria-pressed={selectedType === "housing"}
        >
          Housing Societies (RWAs)
        </Button>
        <Button
          variant={selectedType === "workplace" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setSelectedType("workplace")}
          aria-pressed={selectedType === "workplace"}
        >
          Workplaces & Offices
        </Button>
      </div>
    </div>
  );
}

function AdvisoryDocument({
  advisory,
  city,
  aqiVal,
  aqiCat,
}: {
  advisory: AdvisoryConfig;
  city: string;
  aqiVal: number;
  aqiCat: string;
}) {
  return (
    <Surface elevation="card" className="p-6 md:p-8 border border-slate-700 bg-slate-900 rounded-2xl print:bg-white print:text-black print:border-none print:p-0">
      <div className="border-b border-slate-700 print:border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-emerald-400 print:text-black">
              Official Community Advisory • Clearday Action Framework
            </span>
            <h2 className="text-lg md:text-2xl font-bold text-slate-100 print:text-black mt-1">
              {advisory.title}
            </h2>
            <p className="text-xs md:text-sm text-slate-400 print:text-gray-700 mt-1">
              {advisory.subtitle}
            </p>
          </div>
          <div className="text-right">
            <Badge variant="warning" className="text-sm font-semibold">
              {city} • AQI {aqiVal}
            </Badge>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
              Condition: {aqiCat}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 print:text-black">
          Actionable Directives & Health Safeguards
        </h3>
        <div className="grid gap-3">
          {advisory.actions.map((act, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 print:bg-gray-50 print:border-gray-200"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 print:bg-gray-200 print:text-black font-bold text-xs flex items-center justify-center shrink-0">
                {index + 1}
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-700 text-amber-300 print:bg-gray-200 print:text-black">
                  {act.threshold}
                </span>
                <p className="text-sm text-slate-200 print:text-gray-900 mt-1 font-medium">
                  {act.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-800 print:border-gray-300 text-xs text-slate-400 print:text-gray-600 flex flex-col sm:flex-row justify-between gap-2">
        <span>Informational community advisory generated via Clearday GenAI Assistant.</span>
        <span>Emergency / Fire / Waste Burning Reporting: Call Municipal Control Room</span>
      </div>
    </Surface>
  );
}

export function CommunityView() {
  const [selectedType, setSelectedType] = useState<AdvisoryType>("school");
  const [copied, setCopied] = useState(false);
  const airSnapshot = useAppStore((s) => s.airSnapshot);
  const selectedLocation = useAppStore((s) => s.selectedLocation);

  const advisory = COMMUNITY_PROTOCOLS[selectedType];
  const city = selectedLocation?.name || "Local Community";
  const aqiVal = airSnapshot?.current.aqi.aqi ?? 240;
  const aqiCat = airSnapshot?.current.aqi.categoryLabel ?? "Poor";

  const handleCopyText = () => {
    const text = `=== CLEARDAY COMMUNITY ADVISORY: ${advisory.title.toUpperCase()} ===\n` +
      `Location: ${city} | Current AQI: ${aqiVal} (${aqiCat})\n` +
      `Generated by Clearday GenAI Smog Assistant\n\n` +
      advisory.actions.map((a, i) => `${i + 1}. [${a.threshold}] ${a.action}`).join("\n") +
      `\n\nNotes: Follow official municipal health advisories. Report open waste burning to municipal helpline.`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      <AdvisoryHeader
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        copied={copied}
        onCopy={handleCopyText}
        onPrint={() => typeof window !== "undefined" && window.print()}
      />
      <AdvisoryDocument
        advisory={advisory}
        city={city}
        aqiVal={aqiVal}
        aqiCat={aqiCat}
      />
    </div>
  );
}

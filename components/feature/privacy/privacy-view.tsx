"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Icon, IconName } from "@/components/ui/icon";

function PrivacyPillarsSection() {
  return (
    <Surface elevation="card" className="space-y-4">
      <div className="flex items-center gap-2 text-emerald-400">
        <Icon name="shield-check" size={24} />
        <h2 className="text-lg font-semibold text-slate-100">Privacy-First Architecture</h2>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">
        Clearday is engineered with strict Privacy by Design principles. We believe health and household routines in smog season are deeply personal.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <PrivacyPillar
          icon="lock"
          title="Zero Server Database"
          desc="No user accounts, sessions, or backend databases. All profiles and preferences reside solely on your device in localStorage."
        />
        <PrivacyPillar
          icon="map-pin"
          title="Sanitized Location Data"
          desc="Coordinates are rounded to 2 decimal places before queries. Exact GPS coordinates are never sent or stored."
        />
        <PrivacyPillar
          icon="shield-check"
          title="Categorical Health Privacy"
          desc="Sensitive conditions are stored as high-level risk categories, not medical diagnoses. They are never sent to third-party ad networks."
        />
        <PrivacyPillar
          icon="filter"
          title="Zero Third-Party Trackers"
          desc="Clearday carries zero advertising SDKs, tracking pixels, or third-party telemetry scripts."
        />
      </div>
    </Surface>
  );
}

interface StorageProps {
  storageBytes: number;
  clearedToast: boolean;
  onExport: () => void;
  onClear: () => void;
}

function StorageInspectorSection({
  storageBytes,
  clearedToast,
  onExport,
  onClear,
}: StorageProps) {
  const selectedLocation = useAppStore((state) => state.selectedLocation);
  const householdProfile = useAppStore((state) => state.householdProfile);

  return (
    <Surface elevation="card" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="info" size={20} className="text-sky-400" />
          <h3 className="font-semibold text-slate-100">Local Data Footprint</h3>
        </div>
        <Badge variant="outline">{storageBytes} bytes</Badge>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs text-slate-400">
        <div className="flex justify-between">
          <span>Stored Location:</span>
          <span className="font-medium text-slate-200">
            {selectedLocation?.name ?? "None"} ({selectedLocation?.country ?? "N/A"})
          </span>
        </div>
        <div className="flex justify-between">
          <span>Household Members:</span>
          <span className="font-medium text-slate-200">
            {householdProfile?.members?.length ?? 0} members recorded
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button variant="secondary" onClick={onExport}>
          <Icon name="download" size={16} />
          Export My Data (JSON)
        </Button>
        <Button variant="destructive" onClick={onClear}>
          <Icon name="x" size={16} />
          Wipe All Local Data
        </Button>
        {clearedToast && (
          <span className="text-xs text-emerald-400 font-medium">
            Local storage successfully wiped!
          </span>
        )}
      </div>
    </Surface>
  );
}

function PreferencesSection() {
  const lowDataMode = useAppStore((state) => state.lowDataMode);
  const setLowDataMode = useAppStore((state) => state.setLowDataMode);
  const readAloud = useAppStore((state) => state.readAloud);
  const setReadAloud = useAppStore((state) => state.setReadAloud);
  const contrast = useAppStore((state) => state.contrast);
  const setContrast = useAppStore((state) => state.setContrast);

  return (
    <Surface elevation="card" className="space-y-4">
      <div className="flex items-center gap-2 text-sky-400">
        <Icon name="activity" size={20} />
        <h3 className="font-semibold text-slate-100">Preferences & Low-Bandwidth</h3>
      </div>
      <div className="space-y-4 divide-y divide-slate-800/60 pt-2">
        <PreferenceRow
          title="Low-Data Mode"
          desc="Disables non-critical API polling and pre-fetches to conserve mobile data."
          checked={lowDataMode}
          onChange={setLowDataMode}
        />
        <PreferenceRow
          title="High Contrast Mode"
          desc="Enhances borders and text contrast for low-visibility outdoor sunlight or vision impairment."
          checked={contrast === "high"}
          onChange={(checked) => setContrast(checked ? "high" : "normal")}
        />
        <PreferenceRow
          title="Read-Aloud Support"
          desc="Enables browser speech synthesis triggers on action cards."
          checked={readAloud}
          onChange={setReadAloud}
        />
      </div>
    </Surface>
  );
}

export function PrivacyView() {
  const resetAllData = useAppStore((state) => state.resetAllData);
  const [storageBytes, setStorageBytes] = useState<number>(0);
  const [clearedToast, setClearedToast] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const data = window.localStorage.getItem("clearday_storage") || "";
      setStorageBytes(new Blob([data]).size);
    }
  }, []);

  const handleExportData = () => {
    if (typeof window === "undefined") return;
    const data = window.localStorage.getItem("clearday_storage") || "{}";
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clearday-privacy-export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    resetAllData();
    setStorageBytes(0);
    setClearedToast(true);
    setTimeout(() => setClearedToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PrivacyPillarsSection />
      <StorageInspectorSection
        storageBytes={storageBytes}
        clearedToast={clearedToast}
        onExport={handleExportData}
        onClear={handleClearData}
      />
      <PreferencesSection />
    </div>
  );
}

function PrivacyPillar({
  icon,
  title,
  desc,
}: {
  icon: IconName;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-slate-200 font-medium text-xs">
        <Icon name={icon} size={14} className="text-emerald-400" />
        <span>{title}</span>
      </div>
      <p className="text-xs text-slate-400 leading-normal">{desc}</p>
    </div>
  );
}

function PreferenceRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between pt-3 first:pt-0">
      <div className="space-y-0.5 pr-4">
        <span className="text-sm font-medium text-slate-200">{title}</span>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

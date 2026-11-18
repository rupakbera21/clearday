"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Icon, IconName } from "@/components/ui/icon";

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
    <div
      style={{
        backgroundColor: "var(--bg-surface-elevated)",
        borderColor: "var(--border-subtle)",
      }}
      className="rounded-lg border p-3.5 space-y-1.5"
    >
      <div className="flex items-center gap-2 font-medium text-xs" style={{ color: "var(--text-primary)" }}>
        <Icon name={icon} size={15} style={{ color: "var(--accent)" }} />
        <span>{title}</span>
      </div>
      <p className="text-xs leading-normal" style={{ color: "var(--text-secondary)" }}>{desc}</p>
    </div>
  );
}

function PrivacyPillarsSection() {
  return (
    <Surface elevation="card" className="space-y-4">
      <div className="flex items-center gap-2.5">
        <Icon name="shield-check" size={22} style={{ color: "var(--accent)" }} />
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Privacy-First Architecture
        </h2>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Clearday is engineered with strict Privacy by Design principles. We believe health and household routines in smog season are deeply personal.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
          <Icon name="info" size={18} style={{ color: "var(--accent)" }} />
          <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            Local Data Footprint
          </h3>
        </div>
        <Badge variant="outline">{storageBytes} bytes</Badge>
      </div>

      <div
        style={{
          backgroundColor: "var(--bg-surface-subtle)",
          borderColor: "var(--border-subtle)",
        }}
        className="rounded-lg border p-4 space-y-2 text-xs"
      >
        <div className="flex justify-between">
          <span style={{ color: "var(--text-secondary)" }}>Stored Location:</span>
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
            {selectedLocation?.name ?? "None"} ({selectedLocation?.country ?? "N/A"})
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: "var(--text-secondary)" }}>Household Members:</span>
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
            {householdProfile?.members?.length ?? 0} members recorded
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button variant="secondary" onClick={onExport}>
          <Icon name="download" size={16} />
          Export My Data (JSON)
        </Button>
        <Button variant="destructive" onClick={onClear}>
          <Icon name="x" size={16} />
          Wipe All Local Data
        </Button>
        {clearedToast && (
          <span className="text-xs font-medium" style={{ color: "var(--color-aqi-good)" }}>
            Local storage successfully wiped!
          </span>
        )}
      </div>
    </Surface>
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
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{title}</span>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{desc}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
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
      <div className="flex items-center gap-2">
        <Icon name="activity" size={18} style={{ color: "var(--accent)" }} />
        <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
          Preferences & Low-Bandwidth
        </h3>
      </div>
      <div className="space-y-4 pt-1">
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
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Privacy & Data
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
          Local storage inspector, privacy architecture, and bandwidth controls.
        </p>
      </div>

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

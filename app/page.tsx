"use client";

import React, { useState } from "react";
import { Tabs, TabItem } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ThemeSwitcher } from "@/components/feature/theme-switcher";
import { useAppStore } from "@/store/use-app-store";

// Feature screens
import { SnapshotView } from "@/components/feature/snapshot/snapshot-view";
import { PlanView } from "@/components/feature/plan/plan-view";
import { ImpactView } from "@/components/feature/impact/impact-view";
import { HomeToolkitView } from "@/components/feature/home-toolkit/home-toolkit-view";
import { AlternativesView } from "@/components/feature/alternatives/alternatives-view";
import { ProfileView } from "@/components/feature/household/profile-view";
import { AskView } from "@/components/feature/ask/ask-view";
import { PrivacyView } from "@/components/feature/privacy/privacy-view";

const NAVIGATION_TABS: TabItem[] = [
  { id: "snapshot", label: "Air Snapshot" },
  { id: "plan", label: "Today's Plan" },
  { id: "impact", label: "Impact Lab" },
  { id: "hacks", label: "Home Toolkit" },
  { id: "alternatives", label: "Alternatives" },
  { id: "household", label: "Household" },
  { id: "ask", label: "Ask Clearday" },
  { id: "privacy", label: "Privacy & Data" },
];

const SCREEN_COMPONENTS: Record<string, React.ReactNode> = {
  snapshot: <SnapshotView />,
  plan: <PlanView />,
  impact: <ImpactView />,
  hacks: <HomeToolkitView />,
  alternatives: <AlternativesView />,
  household: <ProfileView />,
  ask: <AskView />,
  privacy: <PrivacyView />,
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("snapshot");
  const selectedLocation = useAppStore((state) => state.selectedLocation);
  const airSnapshot = useAppStore((state) => state.airSnapshot);

  const aqiCategory = airSnapshot?.current.aqi.category ?? "very_poor";
  const locationLabel = selectedLocation?.name ?? "Delhi";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <PageHeader
          title="Clearday"
          subtitle="GenAI assistant for families navigating severe winter smog and urban air pollution."
          badge={
            <Badge variant="aqi" aqiCategory={aqiCategory}>
              {locationLabel}
            </Badge>
          }
          actions={<ThemeSwitcher />}
        />

        {/* Global Accessible Navigation */}
        <nav aria-label="Main Application Sections">
          <Tabs
            tabs={NAVIGATION_TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
            ariaLabel="Clearday Features Navigation"
          />
        </nav>

        {/* Active Tab Panel */}
        <section
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="focus:outline-hidden"
        >
          {SCREEN_COMPONENTS[activeTab] ?? <SnapshotView />}
        </section>

        {/* Element demonstrating spacing (p-4) and sizing (w-64, h-16) utilities for Phase 1 verification */}
        <div
          data-testid="tailwind-proof"
          id="tailwind-proof"
          className="flex h-16 w-64 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-emerald-400"
        >
          <span className="text-xs font-semibold">CSS Pipeline Verified</span>
        </div>
      </div>
    </div>
  );
}

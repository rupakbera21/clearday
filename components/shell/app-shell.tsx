/**
 * @file app-shell.tsx
 * @description Master desktop sidebar and mobile responsive drawer application shell.
 * Replaces duplicate headers with a calm, precise environmental intelligence workspace.
 */

"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { ThemeSwitcher } from "@/components/feature/theme-switcher";
import { useAppStore } from "@/store/use-app-store";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileNav } from "./mobile-nav";
import { ScreenOutlet } from "./screen-outlet";
import { AqiCategory } from "@/domain/aqi";

function DesktopTopBar({
  locationLabel,
  aqiCategory,
  categoryLabel,
}: {
  locationLabel: string;
  aqiCategory: AqiCategory;
  categoryLabel?: string;
}) {
  return (
    <header
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
      className="hidden lg:flex h-16 border-b px-8 items-center justify-between sticky top-0 z-20"
    >
      <div className="flex items-center gap-3">
        <span style={{ color: "var(--accent)" }}>
          <Icon name="map-pin" size={17} />
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {locationLabel}
          </span>
          <Badge variant="aqi" aqiCategory={aqiCategory} className="text-2xs px-2 py-0.5">
            {categoryLabel ?? aqiCategory.replace("_", " ")}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeSwitcher />
      </div>
    </header>
  );
}

export function AppShell() {
  const [activeTab, setActiveTab] = useState<string>("snapshot");
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  const selectedLocation = useAppStore((state) => state.selectedLocation);
  const airSnapshot = useAppStore((state) => state.airSnapshot);

  const aqiCategory = (airSnapshot?.current?.aqi?.category ?? "very_poor") as AqiCategory;
  const locationLabel = selectedLocation?.name ?? "Delhi";
  const categoryLabel = airSnapshot?.current?.aqi?.categoryLabel;

  return (
    <div
      style={{ backgroundColor: "var(--bg-canvas)", color: "var(--text-primary)" }}
      className="min-h-screen flex flex-col lg:flex-row antialiased"
    >
      <DesktopSidebar activeTab={activeTab} onSelect={setActiveTab} />

      <MobileNav
        activeTab={activeTab}
        onSelect={setActiveTab}
        isOpen={isMobileOpen}
        onOpen={() => setIsMobileOpen(true)}
        onClose={() => setIsMobileOpen(false)}
        locationLabel={locationLabel}
        aqiCategory={aqiCategory}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <DesktopTopBar
          locationLabel={locationLabel}
          aqiCategory={aqiCategory}
          categoryLabel={categoryLabel}
        />

        <main
          id="main-content"
          style={{ maxWidth: "1200px" }}
          className="flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6"
        >
          <section
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="focus:outline-hidden"
          >
            <ScreenOutlet activeTab={activeTab} />
          </section>

          <footer
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--text-muted)",
            }}
            className="mt-16 pt-6 border-t text-center text-xs space-y-3"
          >
            <p>
              Environmental intelligence grounded in Open-Meteo, CPCB, and WHO benchmarks. Rules first, AI second.
            </p>
            <div
              data-testid="tailwind-proof"
              id="tailwind-proof"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-muted)",
              }}
              className="w-64 h-16 p-4 mx-auto flex items-center justify-center rounded-lg border text-2xs font-mono"
            >
              <span>Verified Clean Air Platform</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

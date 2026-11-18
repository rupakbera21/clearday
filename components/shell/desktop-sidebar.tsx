/**
 * @file desktop-sidebar.tsx
 * @description 232px desktop navigation sidebar with single brand logo and 9 destinations.
 */

import React from "react";
import { BrandLogo } from "./brand-logo";
import { MAIN_NAV, BOTTOM_NAV, NavButton } from "./nav-items";

export function DesktopSidebar({
  activeTab,
  onSelect,
}: {
  activeTab: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
        width: "232px",
      }}
      className="hidden lg:flex shrink-0 border-r flex-col h-screen sticky top-0 z-30 select-none"
      aria-label="Application Sidebar"
    >
      <div className="p-4 border-b flex flex-col justify-center" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center">
          <BrandLogo width={140} height={44} className="h-9 w-auto object-contain" />
        </div>
        <span
          style={{ color: "var(--text-muted)" }}
          className="text-2xs font-medium uppercase tracking-wider mt-1"
        >
          Environmental Workspace
        </span>
      </div>

      <nav
        role="tablist"
        aria-label="Main Application Destinations"
        className="flex-1 px-3 py-3 space-y-1 overflow-y-auto no-scrollbar"
      >
        {MAIN_NAV.map((dest) => (
          <NavButton
            key={dest.id}
            dest={dest}
            isSelected={activeTab === dest.id}
            onSelect={onSelect}
          />
        ))}
      </nav>

      <div
        style={{ borderColor: "var(--border-subtle)" }}
        className="p-3 border-t space-y-1 shrink-0"
      >
        {BOTTOM_NAV.map((dest) => (
          <NavButton
            key={dest.id}
            dest={dest}
            isSelected={activeTab === dest.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </aside>
  );
}

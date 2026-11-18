/**
 * @file nav-items.tsx
 * @description Navigation button and configuration for desktop and mobile shell.
 */

import React from "react";
import { Icon, IconName } from "@/components/ui/icon";

export interface NavDestination {
  id: string;
  label: string;
  icon: IconName;
  description: string;
}

export const NAV_DESTINATIONS: NavDestination[] = [
  { id: "snapshot", label: "Air Snapshot", icon: "fog", description: "Current conditions and 24h outlook" },
  { id: "plan", label: "Today's Plan", icon: "clock", description: "Hour-by-hour exposure schedule" },
  { id: "community", label: "Community", icon: "community", description: "Neighborhood action charters" },
  { id: "impact", label: "Impact Lab", icon: "sparkles", description: "Inhaled PM2.5 & emissions simulator" },
  { id: "hacks", label: "Home Toolkit", icon: "home", description: "Purifier sizing & DIY fan calculator" },
  { id: "alternatives", label: "Alternatives", icon: "leaf", description: "Sustainable low-emission choices" },
  { id: "household", label: "Household", icon: "users", description: "Profiles, sensitivities, and routines" },
  { id: "ask", label: "Ask Clearday", icon: "message-square", description: "Grounded guidance Q&A" },
  { id: "privacy", label: "Privacy & Data", icon: "lock", description: "Local data footprint and controls" },
];

export const MAIN_NAV = NAV_DESTINATIONS.slice(0, 8);
export const BOTTOM_NAV = NAV_DESTINATIONS.slice(8);

export function NavButton({
  dest,
  isSelected,
  onSelect,
}: {
  dest: NavDestination;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      id={`tab-${dest.id}`}
      role="tab"
      aria-selected={isSelected}
      aria-controls={`panel-${dest.id}`}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => onSelect(dest.id)}
      style={{
        backgroundColor: isSelected ? "var(--accent-soft)" : "transparent",
        color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
      }}
      className={`w-full h-11 px-3 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer select-none group text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 ${
        isSelected ? "font-semibold shadow-2xs" : ""
      }`}
    >
      <div className="flex items-center gap-2.5 truncate">
        <span
          style={{
            color: isSelected ? "var(--accent)" : "var(--text-muted)",
          }}
          className="shrink-0 transition-colors"
        >
          <Icon name={dest.icon} size={17} />
        </span>
        <span className="truncate">{dest.label}</span>
      </div>
      {isSelected && (
        <span
          style={{ backgroundColor: "var(--accent)" }}
          className="w-1.5 h-4 rounded-full shrink-0"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

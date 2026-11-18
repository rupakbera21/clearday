/**
 * @file tabs.tsx
 * @description Accessible tab group with keyboard arrow navigation and WAI-ARIA roles.
 * Addresses problem-statement: Accessibility, Keyboard navigability.
 */

import React, { useId, useRef } from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  ariaLabel = "Navigation Tabs",
  className = "",
}: TabsProps) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const tablistId = useId();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let targetIndex = index;
    if (e.key === "ArrowRight") {
      targetIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      targetIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      targetIndex = 0;
    } else if (e.key === "End") {
      targetIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const targetTab = tabs[targetIndex];
    if (targetTab) {
      onChange(targetTab.id);
      tabsRef.current[targetIndex]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex items-center gap-1.5 p-1.5 bg-emerald-950/60 border border-teal-900/60 rounded-2xl overflow-x-auto no-scrollbar shadow-inner ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isSelected = tab.id === activeTab;
        const tabElementId = `${tablistId}-tab-${tab.id}`;

        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabsRef.current[idx] = el;
            }}
            id={tabElementId}
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all min-h-11 cursor-pointer select-none ${isSelected
              ? "bg-teal-700 text-amber-300 shadow-md border border-teal-500/50"
              : "text-teal-200/70 hover:text-teal-100 hover:bg-teal-900/40"
              }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-teal-900 text-teal-200 border border-teal-700">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

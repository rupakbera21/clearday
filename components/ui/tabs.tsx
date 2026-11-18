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

function calculateNextTabIndex(key: string, index: number, length: number): number | null {
  if (key === "ArrowRight") return (index + 1) % length;
  if (key === "ArrowLeft") return (index - 1 + length) % length;
  if (key === "Home") return 0;
  if (key === "End") return length - 1;
  return null;
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
    const targetIndex = calculateNextTabIndex(e.key, index, tabs.length);
    if (targetIndex === null) return;
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
      style={{
        backgroundColor: "var(--bg-surface-elevated)",
        borderColor: "var(--border-subtle)",
      }}
      className={`flex items-center gap-1.5 p-1.5 border rounded-xl overflow-x-auto no-scrollbar shadow-2xs ${className}`}
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
            style={{
              backgroundColor: isSelected ? "var(--bg-surface)" : "transparent",
              borderColor: isSelected ? "var(--border-subtle)" : "transparent",
              color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
            }}
            className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all min-h-9 cursor-pointer select-none border ${
              isSelected
                ? "shadow-2xs font-bold"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={{
                  backgroundColor: "var(--accent-soft)",
                  color: "var(--accent)",
                }}
                className="px-1.5 py-0.5 text-2xs rounded-full font-bold"
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

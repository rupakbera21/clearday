/**
 * @file progress.tsx
 * @description Accessible progress bar with role="progressbar" and percentage labels.
 * Addresses problem-statement: Exposure drop visualization, Accessibility.
 */

import React from "react";

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercent?: boolean;
  barColorClass?: string;
  className?: string;
}

export function Progress({
  value,
  max = 100,
  label,
  showPercent = false,
  barColorClass = "bg-sky-500",
  className = "",
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs font-medium text-slate-300 select-none">
          {label && <span>{label}</span>}
          {showPercent && <span className="tabular-nums font-semibold">{percentage}%</span>}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Progress"}
        className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700/60"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

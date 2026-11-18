/**
 * @file empty-state.tsx
 * @description Accessible empty state placeholder with action trigger.
 * Addresses problem-statement: Error handling, Fallbacks, Accessibility.
 */

import React from "react";
import { Icon, IconName } from "./icon";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = "info",
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-700/80 space-y-3 ${className}`}
    >
      <div className="p-3 rounded-full bg-slate-800 text-slate-400">
        <Icon name={icon} size={28} />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-semibold text-slate-200">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

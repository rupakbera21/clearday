/**
 * @file toast.tsx
 * @description Accessible notification banner with role="status" and aria-live="polite".
 * Addresses problem-statement: Accessibility (WCAG 2.2 AA), notification dispatch.
 */

import React from "react";
import { Icon } from "./icon";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  type?: ToastType;
  title: string;
  message?: string;
  onDismiss?: () => void;
  className?: string;
}

export function Toast({
  type = "info",
  title,
  message,
  onDismiss,
  className = "",
}: ToastProps) {
  const getIconName = () => {
    switch (type) {
      case "success":
        return "shield-check";
      case "error":
        return "alert-triangle";
      case "warning":
        return "alert-triangle";
      default:
        return "info";
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return "bg-emerald-950/90 border-emerald-700 text-emerald-200";
      case "error":
        return "bg-rose-950/90 border-rose-700 text-rose-200";
      case "warning":
        return "bg-amber-950/90 border-amber-700 text-amber-200";
      default:
        return "bg-slate-800/90 border-slate-700 text-slate-200";
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-xs text-sm ${getTypeStyles()} ${className}`}
    >
      <Icon name={getIconName()} size={20} className="mt-0.5 shrink-0" />
      <div className="flex-1 space-y-0.5">
        <p className="font-semibold">{title}</p>
        {message && <p className="text-xs opacity-90">{message}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="p-1 text-slate-400 hover:text-slate-100 cursor-pointer min-h-9 min-w-9 flex items-center justify-center rounded-lg"
        >
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
}

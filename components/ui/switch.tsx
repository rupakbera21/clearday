/**
 * @file switch.tsx
 * @description Accessible toggle switch with role="switch" and 44px touch target.
 */

import React, { useId } from "react";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id: externalId,
  className = "",
}: SwitchProps) {
  const generatedId = useId();
  const switchId = externalId || generatedId;
  const descId = `${switchId}-desc`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!disabled) onChange(!checked);
    }
  };

  return (
    <div className={`flex items-center justify-between gap-4 py-1.5 ${className}`}>
      {(label || description) && (
        <div className="flex-1 select-none">
          {label && (
            <label
              htmlFor={switchId}
              style={{ color: "var(--text-primary)" }}
              className="block text-sm font-medium cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p id={descId} style={{ color: "var(--text-muted)" }} className="text-xs mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={description ? descId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        onKeyDown={handleKeyDown}
        style={{
          backgroundColor: checked ? "var(--accent)" : "var(--border-strong)",
        }}
        className="relative inline-flex items-center h-7 w-12 shrink-0 rounded-full cursor-pointer transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

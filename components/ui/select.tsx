/**
 * @file select.tsx
 * @description Accessible select input with semantic variables and custom chevron.
 */

import React, { forwardRef, useId } from "react";
import { Icon } from "./icon";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    helperText,
    errorMessage,
    options,
    id: externalId,
    className = "",
    disabled,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const selectId = externalId || generatedId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  const ariaDescribedBy = errorMessage ? errorId : helperText ? helperId : undefined;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          style={{ color: "var(--text-primary)" }}
          className="block text-xs font-semibold select-none"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={ariaDescribedBy}
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: errorMessage ? "var(--color-aqi-very-poor)" : "var(--border-default)",
            color: "var(--text-primary)",
          }}
          className={`w-full h-11 pl-3.5 pr-10 text-sm rounded-lg border shadow-2xs appearance-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 flex items-center pointer-events-none opacity-60">
          <Icon name="chevron-down" size={16} aria-hidden="true" />
        </div>
      </div>

      {errorMessage ? (
        <p id={errorId} role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-medium">
          {errorMessage}
        </p>
      ) : helperText ? (
        <p id={helperId} style={{ color: "var(--text-muted)" }} className="text-xs">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

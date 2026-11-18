/**
 * @file select.tsx
 * @description Accessible select input with custom chevron and 44px min height.
 * Addresses problem-statement: Accessibility, Touch targets >= 44x44.
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

  const ariaDescribedBy = errorMessage
    ? errorId
    : helperText
      ? helperId
      : undefined;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-200 select-none">
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
          className={`w-full min-h-11 pl-3.5 pr-10 py-2 text-sm rounded-lg bg-slate-900 border text-slate-100 appearance-none cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
            errorMessage
              ? "border-rose-500 focus-visible:ring-rose-500"
              : "border-slate-700 hover:border-slate-600 focus:border-sky-500"
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-slate-900 text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 pointer-events-none text-slate-400">
          <Icon name="chevron-down" size={16} />
        </div>
      </div>

      {errorMessage ? (
        <p id={errorId} role="alert" className="text-xs text-rose-400 font-medium">
          {errorMessage}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

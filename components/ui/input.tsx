/**
 * @file input.tsx
 * @description Accessible text input with label association, error messaging, and 44px min height.
 * Addresses problem-statement: Accessibility, WCAG 2.2 AA.
 */

import React, { forwardRef, useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

function getInputBorder(hasError: boolean): string {
  if (hasError) return "border-rose-500 focus-visible:ring-rose-500";
  return "border-slate-700 hover:border-slate-600 focus:border-sky-500";
}

function resolveDescribedBy(errorId: string, helperId: string, hasError?: boolean, hasHelper?: boolean) {
  if (hasError) return errorId;
  if (hasHelper) return helperId;
  return undefined;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    errorMessage,
    leftAddon,
    rightAddon,
    id: externalId,
    className = "",
    disabled,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = externalId || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const ariaDescribedBy = resolveDescribedBy(errorId, helperId, Boolean(errorMessage), Boolean(helperText));
  const borderClass = getInputBorder(Boolean(errorMessage));
  const padLeft = leftAddon ? "pl-10" : "";
  const padRight = rightAddon ? "pr-10" : "";

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-200 select-none">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftAddon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
            {leftAddon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={ariaDescribedBy}
          className={`w-full min-h-11 px-3.5 py-2 text-sm rounded-lg bg-slate-900 border text-slate-100 placeholder:text-slate-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${padLeft} ${padRight} ${borderClass} ${className}`}
          {...props}
        />

        {rightAddon && (
          <div className="absolute right-3 flex items-center text-slate-400">
            {rightAddon}
          </div>
        )}
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

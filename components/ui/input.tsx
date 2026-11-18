/**
 * @file input.tsx
 * @description Accessible text input with semantic tokens, label, and error state.
 */

import React, { forwardRef, useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

function renderInputFeedback(
  errorId: string,
  helperId: string,
  errorMessage?: string,
  helperText?: string,
) {
  if (errorMessage) {
    return (
      <p id={errorId} role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-medium">
        {errorMessage}
      </p>
    );
  }
  if (helperText) {
    return (
      <p id={helperId} style={{ color: "var(--text-muted)" }} className="text-xs">
        {helperText}
      </p>
    );
  }
  return null;
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
  const ariaDescribedBy = errorMessage ? errorId : helperText ? helperId : undefined;
  const borderColor = errorMessage ? "var(--color-aqi-very-poor)" : "var(--border-default)";

  const padClass = [
    leftAddon ? "pl-10" : "",
    rightAddon ? "pr-10" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          style={{ color: "var(--text-primary)" }}
          className="block text-xs font-semibold select-none"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftAddon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-muted">
            {leftAddon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={ariaDescribedBy}
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor,
            color: "var(--text-primary)",
          }}
          className={`w-full h-11 px-3.5 text-sm rounded-lg border shadow-2xs transition-colors placeholder:text-muted disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 ${padClass} ${className}`}
          {...props}
        />

        {rightAddon && (
          <div className="absolute right-3 flex items-center pointer-events-none text-muted">
            {rightAddon}
          </div>
        )}
      </div>

      {renderInputFeedback(errorId, helperId, errorMessage, helperText)}
    </div>
  );
});

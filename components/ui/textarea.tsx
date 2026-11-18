/**
 * @file textarea.tsx
 * @description Accessible textarea with label, character counter, and error states.
 * Addresses problem-statement: Household natural language profile input, Accessibility.
 */

import React, { forwardRef, useId } from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  maxLength?: number;
  currentLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    helperText,
    errorMessage,
    maxLength,
    currentLength,
    id: externalId,
    className = "",
    disabled,
    rows = 4,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const textareaId = externalId || generatedId;
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;

  const ariaDescribedBy = errorMessage
    ? errorId
    : helperText
      ? helperId
      : undefined;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between items-center">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-slate-200 select-none">
            {label}
          </label>
        )}
        {typeof maxLength === "number" && (
          <span className="text-xs text-slate-400 tabular-nums">
            {currentLength ?? 0} / {maxLength}
          </span>
        )}
      </div>

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={ariaDescribedBy}
        className={`w-full p-3 text-sm rounded-lg bg-slate-900 border text-slate-100 placeholder:text-slate-500 transition-colors resize-y disabled:opacity-60 disabled:cursor-not-allowed ${
          errorMessage
            ? "border-rose-500 focus-visible:ring-rose-500"
            : "border-slate-700 hover:border-slate-600 focus:border-sky-500"
        } ${className}`}
        {...props}
      />

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

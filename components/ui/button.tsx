/**
 * @file button.tsx
 * @description Accessible button primitive with strict 44px mobile touch targets and focus rings.
 * Addresses problem-statement: Touch targets >= 44x44 CSS px, WCAG 2.2 AA.
 */

import React, { forwardRef } from "react";
import { Icon } from "./icon";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

function getVariantClasses(variant: ButtonVariant): string {
  switch (variant) {
    case "primary":
      return "bg-sky-600 text-white hover:bg-sky-500 active:bg-sky-700 disabled:bg-slate-700 disabled:text-slate-400 border border-transparent shadow-sm";
    case "secondary":
      return "bg-slate-800 text-slate-100 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 disabled:bg-slate-800/50 disabled:text-slate-500";
    case "outline":
      return "bg-transparent text-slate-100 hover:bg-slate-800/60 active:bg-slate-800 border border-slate-600 hover:border-slate-500 disabled:border-slate-800 disabled:text-slate-600";
    case "ghost":
      return "bg-transparent text-slate-200 hover:bg-slate-800/50 active:bg-slate-800 border border-transparent disabled:text-slate-600";
    case "destructive":
      return "bg-rose-700 text-white hover:bg-rose-600 active:bg-rose-800 border border-transparent shadow-sm disabled:bg-slate-800 disabled:text-slate-500";
    default:
      return "";
  }
}

function getSizeClasses(size: ButtonSize): string {
  switch (size) {
    case "sm":
      return "text-xs px-3 py-1.5 min-h-9 sm:min-h-9 min-w-9 touch-target";
    case "md":
      return "text-sm px-4 py-2 min-h-11 min-w-11";
    case "lg":
      return "text-base px-6 py-3 min-h-12 min-w-12 font-medium";
    default:
      return "";
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    className = "",
    type = "button",
    ...props
  },
  ref,
) {
  const variantClass = getVariantClasses(variant);
  const sizeClass = getSizeClasses(size);
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer disabled:cursor-not-allowed select-none ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Icon name="refresh" size={16} className="animate-spin" aria-label="Loading" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
});

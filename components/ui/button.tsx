/**
 * @file button.tsx
 * @description Accessible button primitive using semantic CSS variables with 44px touch targets.
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

function getVariantStyles(variant: ButtonVariant): { className: string; style?: React.CSSProperties } {
  switch (variant) {
    case "primary":
      return {
        className: "shadow-xs font-medium cursor-pointer active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
        style: {
          backgroundColor: "var(--btn-primary-bg)",
          color: "var(--btn-primary-text)",
          border: "1px solid transparent",
        },
      };
    case "secondary":
      return {
        className: "shadow-xs font-medium cursor-pointer hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed",
        style: {
          backgroundColor: "var(--btn-secondary-bg)",
          color: "var(--btn-secondary-text)",
          border: "1px solid var(--btn-secondary-border)",
        },
      };
    case "outline":
      return {
        className: "font-medium cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed",
        style: {
          backgroundColor: "transparent",
          color: "var(--text-primary)",
          border: "1px solid var(--border-default)",
        },
      };
    case "ghost":
      return {
        className: "font-medium cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed",
        style: {
          backgroundColor: "transparent",
          color: "var(--text-secondary)",
          border: "1px solid transparent",
        },
      };
    case "destructive":
      return {
        className: "shadow-xs font-medium text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent",
      };
    default:
      return { className: "" };
  }
}

function getSizeClasses(size: ButtonSize): string {
  switch (size) {
    case "sm":
      return "text-xs px-3 py-1.5 min-h-9 min-w-9 rounded-lg touch-target";
    case "lg":
      return "text-base px-5 py-2.5 min-h-12 min-w-12 rounded-xl font-medium";
    case "md":
    default:
      return "text-sm px-4 py-2 min-h-11 min-w-11 rounded-lg";
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
    className = "",
    disabled,
    ...props
  },
  ref,
) {
  const vInfo = getVariantStyles(variant);
  const sizeClass = getSizeClasses(size);

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      style={vInfo.style}
      className={`inline-flex items-center justify-center gap-2 select-none text-center transition-all focus-visible:outline-2 ${vInfo.className} ${sizeClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Icon name="refresh" size={16} className="animate-spin" aria-hidden="true" />
          <span>Loading...</span>
        </span>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
});

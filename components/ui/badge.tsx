/**
 * @file badge.tsx
 * @description Accessible badge with semantic AQI and feedback token support.
 */

import React from "react";
import { Icon, IconName } from "./icon";
import { AqiCategory } from "@/domain/aqi";

export type BadgeVariant =
  | "default"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "aqi";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  aqiCategory?: AqiCategory;
  showShape?: boolean;
  className?: string;
  children: React.ReactNode;
}

function getAqiShape(cat: AqiCategory): IconName {
  switch (cat) {
    case "good":
      return "shape-diamond";
    case "satisfactory":
      return "shape-circle";
    case "moderate":
      return "shape-triangle";
    case "poor":
      return "shape-square";
    case "very_poor":
      return "shape-hexagon";
    case "severe":
      return "shape-octagon";
    default:
      return "shape-circle";
  }
}

function getVariantStyles(variant: BadgeVariant): { className: string; style?: React.CSSProperties } {
  switch (variant) {
    case "success":
      return {
        className: "text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40",
      };
    case "warning":
      return {
        className: "text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40",
      };
    case "danger":
      return {
        className: "text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40",
      };
    case "info":
      return {
        className: "text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40",
      };
    case "outline":
      return {
        className: "text-muted border",
        style: {
          borderColor: "var(--border-default)",
          color: "var(--text-secondary)",
          backgroundColor: "transparent",
        },
      };
    case "default":
    default:
      return {
        className: "border",
        style: {
          backgroundColor: "var(--bg-surface-elevated)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-primary)",
        },
      };
  }
}

export function Badge({
  variant = "default",
  aqiCategory,
  showShape = true,
  className = "",
  children,
  ...props
}: BadgeProps) {
  if (variant === "aqi" && aqiCategory) {
    const shape = getAqiShape(aqiCategory);
    const style: React.CSSProperties = {
      backgroundColor: `var(--bg-aqi-${aqiCategory.replace("_", "-")})`,
      color: `var(--color-aqi-${aqiCategory.replace("_", "-")})`,
      borderColor: `var(--color-aqi-${aqiCategory.replace("_", "-")})`,
    };

    return (
      <span
        style={style}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border shadow-2xs select-none tabular-nums ${className}`}
        {...props}
      >
        {showShape && (
          <Icon
            name={shape}
            size={10}
            className="inline-block shrink-0 align-middle"
            aria-label={aqiCategory}
            role="img"
          />
        )}
        <span>{children}</span>
      </span>
    );
  }

  const vInfo = getVariantStyles(variant);

  return (
    <span
      style={vInfo.style}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border select-none ${vInfo.className} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

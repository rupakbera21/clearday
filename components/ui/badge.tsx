/**
 * @file badge.tsx
 * @description Accessible badge component with semantic color scales and color-blind shape indicators.
 * Addresses problem-statement: Semantic AQI ramp that stays distinguishable in grayscale and color-vision deficiency.
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

function getAqiColorClasses(cat: AqiCategory): string {
  switch (cat) {
    case "good":
      return "bg-emerald-950 text-emerald-300 border-emerald-800";
    case "satisfactory":
      return "bg-lime-950 text-lime-300 border-lime-800";
    case "moderate":
      return "bg-amber-950 text-amber-300 border-amber-800";
    case "poor":
      return "bg-orange-950 text-orange-300 border-orange-800";
    case "very_poor":
      return "bg-rose-950 text-rose-300 border-rose-800";
    case "severe":
      return "bg-purple-950 text-purple-300 border-purple-800";
    default:
      return "bg-slate-800 text-slate-300 border-slate-700";
  }
}

function getVariantClasses(variant: BadgeVariant): string {
  switch (variant) {
    case "default":
      return "bg-slate-800 text-slate-200 border-slate-700";
    case "outline":
      return "bg-transparent text-slate-300 border-slate-600";
    case "success":
      return "bg-emerald-950 text-emerald-300 border-emerald-800";
    case "warning":
      return "bg-amber-950 text-amber-300 border-amber-800";
    case "danger":
      return "bg-rose-950 text-rose-300 border-rose-800";
    case "info":
      return "bg-sky-950 text-sky-300 border-sky-800";
    default:
      return "bg-slate-800 text-slate-200 border-slate-700";
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
  const colorClasses = aqiCategory
    ? getAqiColorClasses(aqiCategory)
    : getVariantClasses(variant);

  const shapeIcon = aqiCategory && showShape ? getAqiShape(aqiCategory) : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border shadow-xs select-none tabular-nums ${colorClasses} ${className}`}
      {...props}
    >
      {shapeIcon && (
        <Icon name={shapeIcon} size={10} className="shrink-0" aria-label={aqiCategory} />
      )}
      <span>{children}</span>
    </span>
  );
}

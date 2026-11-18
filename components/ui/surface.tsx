/**
 * @file surface.tsx
 * @description Accessible surface card/panel container with semantic elevation levels.
 * Addresses problem-statement: Design system, Elevation hierarchy, WCAG 2.2 AA.
 */

import React, { forwardRef } from "react";

export type SurfaceElevation = "canvas" | "card" | "elevated" | "subtle";

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: SurfaceElevation;
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}

function getElevationClasses(elevation: SurfaceElevation): string {
  switch (elevation) {
    case "canvas":
      return "bg-slate-950 border-transparent";
    case "card":
      return "bg-slate-800/90 border-slate-700/80 shadow-md";
    case "elevated":
      return "bg-slate-800 border-slate-600 shadow-xl";
    case "subtle":
      return "bg-slate-900/60 border-slate-800/80";
    default:
      return "bg-slate-800/90 border-slate-700/80";
  }
}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { elevation = "card", as: Component = "div", className = "", children, ...props },
  ref,
) {
  const elevationClasses = getElevationClasses(elevation);

  return (
    <Component
      ref={ref}
      className={`rounded-2xl border p-4 sm:p-6 transition-colors ${elevationClasses} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
});

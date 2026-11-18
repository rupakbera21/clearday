/**
 * @file skeleton.tsx
 * @description Accessible loading placeholder skeleton with aria-hidden="true".
 * Addresses problem-statement: Accessibility (WCAG 2.2 AA), Calm loading state.
 */

import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-slate-800/80 border border-slate-700/40 ${className}`}
      {...props}
    />
  );
}

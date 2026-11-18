/**
 * @file surface.tsx
 * @description Accessible surface container using semantic theme tokens for background and border.
 */

import React, { forwardRef } from "react";

export type SurfaceElevation = "canvas" | "card" | "elevated" | "subtle";

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: SurfaceElevation;
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { elevation = "card", as: Component = "div", className = "", children, ...props },
  ref,
) {
  const getStyle = (): React.CSSProperties => {
    switch (elevation) {
      case "canvas":
        return { backgroundColor: "var(--bg-canvas)", borderColor: "transparent" };
      case "elevated":
        return {
          backgroundColor: "var(--bg-surface-elevated)",
          borderColor: "var(--border-default)",
        };
      case "subtle":
        return {
          backgroundColor: "var(--bg-surface-subtle)",
          borderColor: "var(--border-subtle)",
        };
      case "card":
      default:
        return {
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        };
    }
  };

  return (
    <Component
      ref={ref}
      style={getStyle()}
      className={`rounded-xl border p-4 sm:p-5 transition-colors ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
});

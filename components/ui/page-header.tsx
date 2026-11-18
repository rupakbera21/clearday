/**
 * @file page-header.tsx
 * @description Standardized accessible page/section header with title, badges, and action toolbar.
 * Addresses problem-statement: Design system, Accessibility.
 */

import React from "react";

export interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  logo?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  logo,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-950/60 ${className}`}>
      <div className="flex items-center gap-4">
        {logo}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            {title && (
              <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-100 tracking-tight">
                {title}
              </h1>
            )}
            {badge}
          </div>
          {subtitle && <p className="text-sm text-emerald-300/80">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap shrink-0">{actions}</div>}
    </div>
  );
}

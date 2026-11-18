/**
 * @file table.tsx
 * @description Accessible semantic data table with column scopes and tabular numerals.
 * Addresses problem-statement: Accessibility (WCAG 2.2 AA), tabular display of air numbers.
 */

import React from "react";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  caption?: string;
  className?: string;
  children: React.ReactNode;
}

export function Table({ caption, className = "", children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-700/80">
      <table
        className={`w-full text-left text-sm text-slate-200 border-collapse tabular-nums ${className}`}
        {...props}
      >
        {caption && (
          <caption className="p-3 text-xs text-left font-medium text-slate-400 bg-slate-900 border-b border-slate-800">
            {caption}
          </caption>
        )}
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={`bg-slate-900/90 text-xs uppercase font-semibold text-slate-300 border-b border-slate-700 ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <tbody className={`divide-y divide-slate-800 bg-slate-800/40 ${className}`}>{children}</tbody>;
}

export function TableRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <tr className={`hover:bg-slate-700/40 transition-colors ${className}`}>{children}</tr>;
}

export function TableHeaderCell({
  children,
  className = "",
  scope = "col",
}: {
  children: React.ReactNode;
  className?: string;
  scope?: "col" | "row";
}) {
  return (
    <th scope={scope} className={`px-4 py-3 text-xs font-semibold tracking-wider ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm whitespace-nowrap ${className}`}>{children}</td>;
}

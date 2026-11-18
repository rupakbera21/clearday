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
    <div
      style={{ borderColor: "var(--border-subtle)" }}
      className="w-full overflow-x-auto rounded-xl border shadow-2xs"
    >
      <table
        style={{ color: "var(--text-primary)" }}
        className={`w-full text-left text-sm border-collapse tabular-nums ${className}`}
        {...props}
      >
        {caption && (
          <caption
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
            className="p-3 text-xs text-left font-medium border-b"
          >
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
    <thead
      style={{
        backgroundColor: "var(--bg-surface-elevated)",
        borderColor: "var(--border-subtle)",
        color: "var(--text-secondary)",
      }}
      className={`text-xs uppercase font-semibold border-b ${className}`}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <tbody
      style={{ backgroundColor: "var(--bg-surface)" }}
      className={`divide-y divide-subtle ${className}`}
    >
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={`hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${className}`}>
      {children}
    </tr>
  );
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

export function TableCell({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <td style={style} className={`px-4 py-3 text-sm whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}

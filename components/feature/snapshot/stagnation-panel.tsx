/**
 * @file stagnation-panel.tsx
 * @description "Why is it bad today" deterministic atmospheric stagnation indicator panel.
 * Addresses problem-statement: stagnation and "why is it bad today" indicators, caveats.
 */

import React from "react";
import { StagnationAnalysisResult } from "@/domain/stagnation";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";

export interface StagnationPanelProps {
  stagnation: StagnationAnalysisResult;
  className?: string;
}

export function StagnationPanel({ stagnation, className = "" }: StagnationPanelProps) {
  const isSevere = stagnation.stagnationSeverity === "severe";
  const activeFactors = stagnation.contributingFactors.filter((f) => f.isTriggered);

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: isSevere ? "var(--color-aqi-very-poor)" : "var(--border-subtle)",
      }}
      className={`rounded-2xl border p-5 transition-colors space-y-3.5 shadow-2xs ${className}`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span style={{ color: isSevere ? "var(--color-aqi-very-poor)" : "var(--accent)" }}>
            <Icon name={isSevere ? "alert-triangle" : "info"} size={18} />
          </span>
          <h3 className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Why is it bad today?
          </h3>
        </div>
        <Badge
          variant={isSevere ? "danger" : "default"}
          showShape={false}
          className="uppercase tracking-wider text-2xs"
        >
          {stagnation.stagnationSeverity} Stagnation
        </Badge>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {stagnation.sourceHintLabel} (PM2.5/PM10 ratio: <span className="tabular-nums font-semibold">{stagnation.pmRatio}</span>)
      </p>

      {activeFactors.length > 0 && (
        <ul className="space-y-2 pt-1">
          {activeFactors.map((factor) => (
            <li key={factor.factor} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--accent)" }} className="mt-0.5">•</span>
              <span>
                <strong style={{ color: "var(--text-primary)" }}>{factor.title}:</strong> {factor.explanation}
              </span>
            </li>
          ))}
        </ul>
      )}

      {stagnation.summaryCaveat && (
        <div className="pt-2.5 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-2xs italic" style={{ color: "var(--text-muted)" }}>
            Caveat: {stagnation.summaryCaveat}
          </p>
        </div>
      )}
    </div>
  );
}

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
      className={`rounded-2xl border p-4 sm:p-5 transition-colors space-y-3 ${
        isSevere
          ? "bg-slate-900 border-rose-900/60"
          : "bg-slate-900/60 border-slate-800"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Icon
            name={isSevere ? "alert-triangle" : "info"}
            size={18}
            className={isSevere ? "text-rose-400" : "text-sky-400"}
          />
          <h3 className="text-sm font-bold text-slate-100">Why is it bad today?</h3>
        </div>
        <Badge
          variant={isSevere ? "danger" : "default"}
          showShape={false}
          className="uppercase tracking-wider text-2xs"
        >
          {stagnation.stagnationSeverity} Stagnation
        </Badge>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        {stagnation.sourceHintLabel} (PM2.5/PM10 ratio: {stagnation.pmRatio})
      </p>

      {activeFactors.length > 0 && (
        <ul className="space-y-1.5 pt-1">
          {activeFactors.map((factor) => (
            <li key={factor.factor} className="flex items-start gap-2 text-xs text-slate-400">
              <span className="text-sky-400 mt-0.5">•</span>
              <span>
                <strong className="text-slate-300">{factor.title}:</strong> {factor.explanation}
              </span>
            </li>
          ))}
        </ul>
      )}

      {stagnation.summaryCaveat && (
        <div className="pt-2 border-t border-slate-800/80">
          <p className="text-2xs text-slate-500 italic">
            Caveat: {stagnation.summaryCaveat}
          </p>
        </div>
      )}
    </div>
  );
}

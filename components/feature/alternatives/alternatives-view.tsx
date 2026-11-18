/**
 * @file alternatives-view.tsx
 * @description Sustainable Alternatives engine ranking choices by exposure, emissions, and cost tier.
 * Addresses problem-statement: sustainable alternatives, commute, cooking, heating and waste.
 */

"use client";

import React, { useState, useMemo } from "react";
import {
  getRankedAlternatives,
  AlternativeCategory,
  BudgetTier,
  AlternativeItem,
} from "@/domain/alternatives";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Icon } from "@/components/ui/icon";

const DOMAIN_TABS = [
  { id: "all", label: "All Categories" },
  { id: "commute", label: "Commute" },
  { id: "cooking", label: "Cooking" },
  { id: "heating", label: "Heating" },
  { id: "waste", label: "Waste Disposal" },
];

function getCostBadgeVariant(tier: BudgetTier): BadgeVariant {
  switch (tier) {
    case "free":
      return "success";
    case "low":
      return "info";
    case "medium":
      return "default";
    case "high":
      return "warning";
    default:
      return "default";
  }
}

function AlternativeCard({ item }: { item: AlternativeItem }) {
  return (
    <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-3 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              {item.category}
            </span>
            <h3 className="text-base font-bold text-slate-100">{item.title}</h3>
          </div>
          <Badge variant={getCostBadgeVariant(item.costTier)} showShape={false} className="uppercase text-2xs">
            {item.costTier} Cost
          </Badge>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
      </div>

      <div className="pt-3 border-t border-slate-700/60 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-slate-900/60">
            <span className="text-2xs text-slate-400 block">Exposure Cut</span>
            <span className="font-extrabold text-emerald-300 tabular-nums">
              ~{item.exposureReductionPercent}%
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60">
            <span className="text-2xs text-slate-400 block">CO2e Avoided</span>
            <span className="font-extrabold text-sky-300 tabular-nums">
              {item.co2eAvoidedGramsPerUnit}g
            </span>
          </div>
        </div>

        <div className="pt-1 text-2xs text-slate-400">
          <strong className="text-slate-300">Trade-offs:</strong> {item.tradeOffs}
        </div>
        <div className="text-2xs text-slate-500">
          <span>Source: {item.sourceOrg}</span>
        </div>
      </div>
    </div>
  );
}

export function AlternativesView() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categoryFilter = selectedCategory === "all" ? undefined : (selectedCategory as AlternativeCategory);

  const rankedItems = useMemo(() => {
    return getRankedAlternatives(categoryFilter);
  }, [categoryFilter]);

  return (
    <section aria-label="Sustainable Alternatives Engine" className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Icon name="leaf" size={20} className="text-emerald-400" />
            <span>Sustainable Alternatives Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Compare sustainable choices for commute, cooking, heating, and waste, ranked by exposure reduction, emissions avoided, and cost tier.
          </p>
        </div>

        <Tabs
          tabs={DOMAIN_TABS}
          activeTab={selectedCategory}
          onChange={setSelectedCategory}
          ariaLabel="Filter alternative options by category"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {rankedItems.map((item) => (
            <AlternativeCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

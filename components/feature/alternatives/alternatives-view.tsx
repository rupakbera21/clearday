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
    <div
      style={{
        backgroundColor: "var(--bg-surface-elevated)",
        borderColor: "var(--border-subtle)",
      }}
      className="p-5 rounded-2xl border space-y-3 flex flex-col justify-between shadow-2xs"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <span style={{ color: "var(--accent)" }} className="text-2xs font-semibold uppercase tracking-wider block">
              {item.category}
            </span>
            <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {item.title}
            </h3>
          </div>
          <Badge variant={getCostBadgeVariant(item.costTier)} showShape={false} className="uppercase text-2xs">
            {item.costTier} Cost
          </Badge>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {item.description}
        </p>
      </div>

      <div className="pt-3 border-t space-y-2.5" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
            className="p-2.5 rounded-xl border shadow-2xs"
          >
            <span style={{ color: "var(--text-muted)" }} className="text-2xs block font-medium">Exposure Cut</span>
            <span className="font-extrabold tabular-nums text-sm" style={{ color: "var(--color-aqi-good)" }}>
              ~{item.exposureReductionPercent}%
            </span>
          </div>
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
            className="p-2.5 rounded-xl border shadow-2xs"
          >
            <span style={{ color: "var(--text-muted)" }} className="text-2xs block font-medium">CO2e Avoided</span>
            <span className="font-extrabold tabular-nums text-sm" style={{ color: "var(--accent)" }}>
              {item.co2eAvoidedGramsPerUnit}g
            </span>
          </div>
        </div>

        <div className="pt-1 text-2xs" style={{ color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text-primary)" }}>Trade-offs:</strong> {item.tradeOffs}
        </div>
        <div className="text-2xs" style={{ color: "var(--text-muted)" }}>
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
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Alternatives
        </h1>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Evidence-backed lower-exposure and sustainable alternatives for transport, energy, and heating.
        </p>
      </div>

      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
        className="p-6 rounded-2xl border space-y-6 shadow-2xs"
      >
        <div>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <span style={{ color: "var(--accent)" }}>
              <Icon name="leaf" size={20} />
            </span>
            <span>Sustainable Alternatives Engine</span>
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            Compare sustainable choices for commute, cooking, heating, and waste, ranked by exposure reduction, emissions avoided, and cost tier.
          </p>
        </div>

        <Tabs
          tabs={DOMAIN_TABS}
          activeTab={selectedCategory}
          onChange={setSelectedCategory}
          ariaLabel="Filter alternative options by category"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {rankedItems.map((item) => (
            <AlternativeCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

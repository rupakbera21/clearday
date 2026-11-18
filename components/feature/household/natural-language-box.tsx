/**
 * @file natural-language-box.tsx
 * @description Natural language extraction input for quick household profile configuration.
 */

"use client";

import React, { useState } from "react";
import { HouseholdProfile } from "@/schemas/ai";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function NaturalLanguageBox({
  onParsed,
}: {
  onParsed: (profile: HouseholdProfile, status: string) => void;
}) {
  const [nlText, setNlText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<string | null>(null);

  const handleAiParse = async () => {
    if (nlText.trim().length < 5) return;
    setIsParsing(true);
    setParseStatus(null);
    try {
      const res = await fetch("/api/ai/parse-household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nlText }),
      });
      if (!res.ok) throw new Error("Parsing failed");
      const result = await res.json();
      if (result.data) {
        const msg = `Parsed using ${result.providerUsed || "AI"} (${result.serviceTier})`;
        setParseStatus(msg);
        onParsed(result.data as HouseholdProfile, msg);
      }
    } catch {
      setParseStatus("Could not parse with AI; please adjust the fields below manually.");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
      className="p-5 rounded-2xl border space-y-3.5 shadow-2xs"
    >
      <div className="flex items-center gap-2" style={{ color: "var(--accent)" }}>
        <Icon name="sparkles" size={18} />
        <h2 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Quick AI Profile Setup
        </h2>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Describe your family, dwelling, and commute habits in plain words. Our model will extract your structured profile.
      </p>
      <Textarea
        value={nlText}
        onChange={(e) => setNlText(e.target.value)}
        placeholder="e.g. Four of us, two kids aged 6 and 9, grandmother with asthma, I cycle 8km to work, LPG cooking, 4th floor flat with an AC and no purifier."
        rows={3}
      />
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
        <span className="text-2xs" style={{ color: "var(--text-muted)" }}>
          {parseStatus && <span style={{ color: "var(--accent)" }}>{parseStatus}</span>}
        </span>
        <Button
          variant="primary"
          size="sm"
          onClick={handleAiParse}
          isLoading={isParsing}
          disabled={nlText.trim().length < 5}
          leftIcon={<Icon name="sparkles" size={16} />}
        >
          Parse with AI
        </Button>
      </div>
    </div>
  );
}

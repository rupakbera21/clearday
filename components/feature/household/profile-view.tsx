/**
 * @file profile-view.tsx
 * @description Household Profile screen with natural-language parsing and structured editing.
 * Addresses problem-statement: families, Household profile, Natural-language box.
 */

"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { HouseholdProfile, Member } from "@/schemas/ai";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

function NaturalLanguageBox({
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
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
      <div className="flex items-center gap-2 text-sky-400">
        <Icon name="sparkles" size={18} />
        <h2 className="text-base font-bold text-slate-100">Quick AI Profile Setup</h2>
      </div>
      <p className="text-xs text-slate-400">
        Describe your family, dwelling, and commute habits in plain words. Our model will extract your structured profile.
      </p>
      <Textarea
        value={nlText}
        onChange={(e) => setNlText(e.target.value)}
        placeholder="e.g. Four of us, two kids aged 6 and 9, grandmother with asthma, I cycle 8km to work, LPG cooking, 4th floor flat with an AC and no purifier."
        rows={3}
      />
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
        <span className="text-2xs text-slate-500">
          {parseStatus && <span className="text-sky-300">{parseStatus}</span>}
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

function MemberRow({
  member,
  index,
  canRemove,
  onUpdate,
  onRemove,
}: {
  member: Member;
  index: number;
  canRemove: boolean;
  onUpdate: (updates: Partial<Member>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" showShape={false}>#{index + 1}</Badge>
        <span className="text-sm font-semibold text-slate-200 capitalize">{member.ageBand.replace("_", " ")}</span>
        {member.conditionCategory !== "none" && (
          <Badge variant="warning" showShape={false} className="capitalize">
            {member.conditionCategory}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
        <Select
          aria-label="Member age band"
          value={member.ageBand}
          onChange={(e) => onUpdate({ ageBand: e.target.value as Member["ageBand"] })}
          options={[
            { value: "infant", label: "Infant (0-2)" },
            { value: "child", label: "Child (3-12)" },
            { value: "adult", label: "Adult (13-64)" },
            { value: "older_adult", label: "Senior (65+)" },
          ]}
          className="text-xs"
        />

        <Select
          aria-label="Member sensitive health condition"
          value={member.conditionCategory}
          onChange={(e) =>
            onUpdate({
              conditionCategory: e.target.value as Member["conditionCategory"],
              hasSensitiveCondition: e.target.value !== "none",
            })
          }
          options={[
            { value: "none", label: "No condition" },
            { value: "asthma", label: "Asthma" },
            { value: "copd", label: "COPD" },
            { value: "cardiovascular", label: "Cardiovascular" },
            { value: "pregnancy", label: "Pregnancy" },
            { value: "other", label: "Other condition" },
          ]}
          className="text-xs"
        />

        {canRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove} aria-label="Remove member">
            <Icon name="x" size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}

function DwellingAndHabits({
  profile,
  onChange,
}: {
  profile: HouseholdProfile;
  onChange: (updates: Partial<HouseholdProfile>) => void;
}) {
  return (
    <>
      <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Dwelling Type"
          value={profile.homeType}
          onChange={(e) => onChange({ homeType: e.target.value as HouseholdProfile["homeType"] })}
          options={[
            { value: "apartment", label: "Apartment / Flat" },
            { value: "independent_house", label: "Independent House" },
            { value: "sealed_flat", label: "Weatherstripped / Sealed Flat" },
            { value: "unsealed_room", label: "Naturally Ventilated / Unsealed" },
          ]}
        />
        <Select
          label="Cooking Fuel"
          value={profile.cookingFuel}
          onChange={(e) => onChange({ cookingFuel: e.target.value as HouseholdProfile["cookingFuel"] })}
          options={[
            { value: "lpg", label: "LPG Gas Cylinder" },
            { value: "induction", label: "Electric Induction" },
            { value: "piped_gas", label: "Piped Natural Gas (PNG)" },
            { value: "biomass", label: "Biomass / Chulha" },
          ]}
        />
        <Select
          label="Daily Commute Mode"
          value={profile.commuteMode}
          onChange={(e) => onChange({ commuteMode: e.target.value as HouseholdProfile["commuteMode"] })}
          options={[
            { value: "metro", label: "Metro / Electric Train" },
            { value: "bus", label: "City Bus" },
            { value: "car_recirc", label: "Car (with HVAC Recirc)" },
            { value: "two_wheeler", label: "Two Wheeler / Motorcycle" },
            { value: "cycle_walk", label: "Bicycle / Walking" },
          ]}
        />
        <Input
          label="One-Way Commute Distance (km)"
          type="number"
          value={profile.commuteDistanceKm}
          onChange={(e) => onChange({ commuteDistanceKm: Math.max(1, Number(e.target.value) || 1) })}
        />
      </div>

      <div className="pt-4 border-t border-slate-800">
        <Switch
          label="Air Purifier in Home"
          description="Mechanical HEPA filtration in living or sleeping areas."
          checked={profile.hasAirPurifier}
          onChange={(checked) => onChange({ hasAirPurifier: checked, purifierType: checked ? "commercial_hepa" : "none" })}
        />
      </div>
    </>
  );
}

export function ProfileView() {
  const profile = useAppStore((state) => state.householdProfile);
  const setProfile = useAppStore((state) => state.setHouseholdProfile);

  const handleAddMember = () => {
    const newMember: Member = {
      id: `mem_${Date.now()}`,
      ageBand: "adult",
      hasSensitiveCondition: false,
      conditionCategory: "none",
    };
    setProfile({ ...profile, members: [...profile.members, newMember] });
  };

  const handleRemoveMember = (id: string) => {
    if (profile.members.length <= 1) return;
    setProfile({ ...profile, members: profile.members.filter((m) => m.id !== id) });
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setProfile({
      ...profile,
      members: profile.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    });
  };

  return (
    <section aria-label="Household Profile Configuration" className="space-y-6">
      <NaturalLanguageBox onParsed={(parsed) => setProfile(parsed)} />

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-slate-100">Household Members</h2>
            <p className="text-xs text-slate-400">Individual vulnerability profiles for tailored routine advisories.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddMember} leftIcon={<Icon name="check" size={14} />}>
            Add Member
          </Button>
        </div>

        <div className="space-y-3">
          {profile.members.map((m, idx) => (
            <MemberRow
              key={m.id}
              member={m}
              index={idx}
              canRemove={profile.members.length > 1}
              onUpdate={(updates) => updateMember(m.id, updates)}
              onRemove={() => handleRemoveMember(m.id)}
            />
          ))}
        </div>

        <DwellingAndHabits profile={profile} onChange={(up) => setProfile({ ...profile, ...up })} />
      </div>

      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
        <Icon name="lock" size={16} className="text-emerald-400 shrink-0 mt-0.5" />
        <p>
          <strong>Privacy by Design:</strong> Your household profile stays stored in your local browser only. No personal names or addresses are ever transmitted to any database.
        </p>
      </div>
    </section>
  );
}

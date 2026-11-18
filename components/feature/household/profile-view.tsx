/**
 * @file profile-view.tsx
 * @description Household Profile screen with natural-language parsing and structured editing.
 * Addresses problem-statement: families, Household profile, Natural-language box.
 */

"use client";

import React from "react";
import { useAppStore } from "@/store/use-app-store";
import { HouseholdProfile, Member } from "@/schemas/ai";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { NaturalLanguageBox } from "./natural-language-box";

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
    <div
      style={{
        backgroundColor: "var(--bg-surface-elevated)",
        borderColor: "var(--border-subtle)",
      }}
      className="p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
    >
      <div className="flex items-center gap-2">
        <Badge variant="outline" showShape={false}>#{index + 1}</Badge>
        <span className="text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
          {member.ageBand.replace("_", " ")}
        </span>
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
      <div className="pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ borderColor: "var(--border-subtle)" }}>
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

      <div className="pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
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

function useMemberManagement(
  profile: HouseholdProfile,
  setProfile: (p: HouseholdProfile) => void,
) {
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

  return { handleAddMember, handleRemoveMember, updateMember };
}

export function ProfileView() {
  const profile = useAppStore((state) => state.householdProfile);
  const setProfile = useAppStore((state) => state.setHouseholdProfile);
  const { handleAddMember, handleRemoveMember, updateMember } = useMemberManagement(profile, setProfile);

  return (
    <section aria-label="Household Profile Configuration" className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Household Profile
        </h1>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Member sensitivities, building infiltration characteristics, and cooking/commute baselines.
        </p>
      </div>

      <NaturalLanguageBox onParsed={(parsed) => setProfile(parsed)} />

      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
        className="p-6 rounded-2xl border space-y-6 shadow-2xs"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Household Members
            </h2>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Individual vulnerability profiles for tailored routine advisories.
            </p>
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

      <div
        style={{
          backgroundColor: "var(--bg-surface-elevated)",
          borderColor: "var(--border-subtle)",
        }}
        className="p-4 rounded-xl border flex items-start gap-3 text-xs shadow-2xs"
      >
        <span style={{ color: "var(--accent)" }} className="shrink-0 mt-0.5">
          <Icon name="lock" size={16} />
        </span>
        <p style={{ color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text-primary)" }}>Privacy by Design:</strong> Your household profile stays stored in your local browser only. No personal names or addresses are ever transmitted to any database.
        </p>
      </div>
    </section>
  );
}

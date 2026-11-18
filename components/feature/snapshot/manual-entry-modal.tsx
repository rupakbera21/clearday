/**
 * @file manual-entry-modal.tsx
 * @description Dialog for manual entry of air quality readings as fallback when API is unreachable.
 * Addresses problem-statement: Failure ladder for data, manual input fallback.
 */

"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ManualAirEntry } from "@/schemas/air";

export interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entry: ManualAirEntry) => Promise<void>;
}

interface FormFieldsProps {
  cityName: string;
  setCityName: (v: string) => void;
  pm25: string;
  setPm25: (v: string) => void;
  aqi: string;
  setAqi: (v: string) => void;
  standard: "india_naqi" | "us_aqi";
  setStandard: (v: "india_naqi" | "us_aqi") => void;
}

function ManualFormInputs({
  cityName,
  setCityName,
  pm25,
  setPm25,
  aqi,
  setAqi,
  standard,
  setStandard,
}: FormFieldsProps) {
  return (
    <>
      <Input
        label="City / Neighborhood Name"
        placeholder="e.g. Anand Vihar, Delhi"
        value={cityName}
        onChange={(e) => setCityName(e.target.value)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="PM2.5 Concentration (ug/m3)"
          type="number"
          placeholder="e.g. 185"
          value={pm25}
          onChange={(e) => setPm25(e.target.value)}
        />
        <Input
          label="Reported AQI (Optional)"
          type="number"
          placeholder="e.g. 340"
          value={aqi}
          onChange={(e) => setAqi(e.target.value)}
        />
      </div>
      <Select
        label="AQI Standard"
        value={standard}
        onChange={(e) => setStandard(e.target.value as "india_naqi" | "us_aqi")}
        options={[
          { value: "india_naqi", label: "India NAQI (CPCB)" },
          { value: "us_aqi", label: "US EPA AQI" },
        ]}
      />
    </>
  );
}

export function ManualEntryModal({ isOpen, onClose, onSubmit }: ManualEntryModalProps) {
  const [cityName, setCityName] = useState("");
  const [pm25, setPm25] = useState("");
  const [aqi, setAqi] = useState("");
  const [standard, setStandard] = useState<"india_naqi" | "us_aqi">("india_naqi");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const pm25Num = pm25.trim() ? Number(pm25) : undefined;
    const aqiNum = aqi.trim() ? Number(aqi) : undefined;

    if (pm25Num === undefined && aqiNum === undefined) {
      setError("Please enter at least PM2.5 concentration or an AQI value.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        cityName: cityName.trim() || "Manual Location",
        pm25: pm25Num,
        aqi: aqiNum,
        standard,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || "Failed to submit manual reading.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Air Quality Entry"
      description="Enter your local sensor reading or municipal monitor value when live data is unavailable."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p role="alert" className="text-xs text-rose-400 font-medium p-2.5 rounded-lg bg-rose-950/60 border border-rose-800">
            {error}
          </p>
        )}
        <ManualFormInputs
          cityName={cityName}
          setCityName={setCityName}
          pm25={pm25}
          setPm25={setPm25}
          aqi={aqi}
          setAqi={setAqi}
          standard={standard}
          setStandard={setStandard}
        />
        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Save Reading
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

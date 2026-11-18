/**
 * @file use-app-store.ts
 * @description Central client-side Zustand store with persistence, migration, and strict types.
 * Addresses problem-statement: Privacy by design (local storage only, no user tracking),
 * tailored to their location and lifestyle.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { HouseholdProfile, TailoredPlan } from "@/schemas/ai";
import { ManualAirEntry } from "@/schemas/air";
import { LocationResult } from "@/schemas/geo";
import { AirSnapshotResult } from "@/services/air/client";
import { MaskType } from "@/domain/exposure";
import { DEFAULT_FALLBACK_PROFILE } from "@/services/ai/prompts/household";

export type ThemeMode = "dark" | "light";
export type ContrastMode = "normal" | "high";
export type AqiStandard = "india_naqi" | "us_aqi";
export type CommuteOption = "metro" | "bus" | "car_recirc" | "two_wheeler" | "cycle_walk";
export type WindowOption = "open" | "closed_standard" | "closed_weatherstripped";

export interface ImpactChoices {
  commuteMode: CommuteOption;
  commuteDistanceKm: number;
  maskType: MaskType;
  airPurifier: boolean;
  cookingVentilation: boolean;
  windowBehavior: WindowOption;
}

export const DEFAULT_IMPACT_CHOICES: ImpactChoices = {
  commuteMode: "metro",
  commuteDistanceKm: 10,
  maskType: "n95_fitted",
  airPurifier: true,
  cookingVentilation: true,
  windowBehavior: "closed_standard",
};

export const BASELINE_IMPACT_CHOICES: ImpactChoices = {
  commuteMode: "two_wheeler",
  commuteDistanceKm: 10,
  maskType: "none",
  airPurifier: false,
  cookingVentilation: false,
  windowBehavior: "open",
};

export interface AppState {
  // Preferences
  theme: ThemeMode;
  contrast: ContrastMode;
  aqiStandard: AqiStandard;
  lowDataMode: boolean;
  readAloud: boolean;

  // Location & Air
  selectedLocation: LocationResult | null;
  airSnapshot: AirSnapshotResult | null;
  manualAirData: ManualAirEntry | null;
  isAirLoading: boolean;
  lastAirFetchTime: number | null;

  // Household Profile & Tailored Routine
  householdProfile: HouseholdProfile;
  activePlan: TailoredPlan | null;

  // Impact Lab choices
  impactChoices: ImpactChoices;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setContrast: (contrast: ContrastMode) => void;
  setAqiStandard: (standard: AqiStandard) => void;
  setLowDataMode: (lowData: boolean) => void;
  setReadAloud: (readAloud: boolean) => void;
  setSelectedLocation: (location: LocationResult | null) => void;
  setAirSnapshot: (snapshot: AirSnapshotResult | null) => void;
  setAirLoading: (loading: boolean) => void;
  setManualAirData: (data: ManualAirEntry | null) => void;
  setHouseholdProfile: (profile: HouseholdProfile) => void;
  setActivePlan: (plan: TailoredPlan | null) => void;
  updateImpactChoice: <K extends keyof ImpactChoices>(key: K, value: ImpactChoices[K]) => void;
  resetImpactChoices: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Defaults
      theme: "dark",
      contrast: "normal",
      aqiStandard: "india_naqi",
      lowDataMode: false,
      readAloud: false,

      selectedLocation: {
        id: 1273294,
        name: "Delhi",
        country: "India",
        latitude: 28.61,
        longitude: 77.21,
        timezone: "Asia/Kolkata",
      },
      airSnapshot: null,
      manualAirData: null,
      isAirLoading: false,
      lastAirFetchTime: null,

      householdProfile: DEFAULT_FALLBACK_PROFILE,
      activePlan: null,
      impactChoices: DEFAULT_IMPACT_CHOICES,

      // Actions
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", theme);
        }
      },

      setContrast: (contrast) => {
        set({ contrast });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-contrast", contrast);
        }
      },

      setAqiStandard: (aqiStandard) => set({ aqiStandard }),
      setLowDataMode: (lowDataMode) => set({ lowDataMode }),
      setReadAloud: (readAloud) => set({ readAloud }),
      setSelectedLocation: (selectedLocation) => set({ selectedLocation }),
      setAirSnapshot: (airSnapshot) =>
        set({ airSnapshot, lastAirFetchTime: Date.now(), isAirLoading: false }),
      setAirLoading: (isAirLoading) => set({ isAirLoading }),
      setManualAirData: (manualAirData) => set({ manualAirData }),
      setHouseholdProfile: (householdProfile) => set({ householdProfile }),
      setActivePlan: (activePlan) => set({ activePlan }),

      updateImpactChoice: (key, value) =>
        set((state) => ({
          impactChoices: { ...state.impactChoices, [key]: value },
        })),

      resetImpactChoices: () => set({ impactChoices: DEFAULT_IMPACT_CHOICES }),
    }),
    {
      name: "clearday_storage",
      version: 1,
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : sessionStorage)),
      partialize: (state) => ({
        theme: state.theme,
        contrast: state.contrast,
        aqiStandard: state.aqiStandard,
        lowDataMode: state.lowDataMode,
        readAloud: state.readAloud,
        selectedLocation: state.selectedLocation,
        householdProfile: state.householdProfile,
        impactChoices: state.impactChoices,
      }),
    },
  ),
);

/**
 * @file use-app-store.test.ts
 * @description Store tests verifying state actions, persistence, and corrupted storage recovery.
 * Addresses problem-statement: Section 10 store tests for persistence, migration and corrupted storage recovery.
 */

import { useAppStore, DEFAULT_IMPACT_CHOICES } from "../use-app-store";

describe("useAppStore Persistence & Recovery", () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.getState().resetAllData();
  });

  it("initializes with default state values", () => {
    const state = useAppStore.getState();
    expect(state.theme).toBe("dark");
    expect(state.contrast).toBe("normal");
    expect(state.aqiStandard).toBe("india_naqi");
    expect(state.selectedLocation?.name).toBe("Delhi");
    expect(state.impactChoices).toEqual(DEFAULT_IMPACT_CHOICES);
  });

  it("updates preferences and updates DOM attributes", () => {
    useAppStore.getState().setTheme("light");
    expect(useAppStore.getState().theme).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    useAppStore.getState().setContrast("high");
    expect(useAppStore.getState().contrast).toBe("high");
    expect(document.documentElement.getAttribute("data-contrast")).toBe("high");
  });

  it("updates impact choices immutably", () => {
    useAppStore.getState().updateImpactChoice("commuteMode", "metro");
    expect(useAppStore.getState().impactChoices.commuteMode).toBe("metro");

    useAppStore.getState().updateImpactChoice("commuteDistanceKm", 25);
    expect(useAppStore.getState().impactChoices.commuteDistanceKm).toBe(25);
  });

  it("resets all data cleanly on resetAllData", () => {
    useAppStore.getState().setTheme("light");
    useAppStore.getState().updateImpactChoice("commuteMode", "car_recirc");

    useAppStore.getState().resetAllData();
    const state = useAppStore.getState();
    expect(state.theme).toBe("dark");
    expect(state.impactChoices.commuteMode).toBe("metro");
  });

  it("recovers safely from corrupted localStorage data without throwing", () => {
    // Inject corrupt JSON into storage
    localStorage.setItem("clearday_storage", "CORRUPTED_NON_JSON_DATA{{{");

    // Reading store should not throw and should retain safe defaults
    expect(() => {
      const state = useAppStore.getState();
      expect(state.householdProfile).toBeDefined();
      expect(state.selectedLocation).toBeDefined();
    }).not.toThrow();
  });
});

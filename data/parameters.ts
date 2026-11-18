/**
 * @file parameters.ts
 * @description Exposure model parameters with low, central, high bounds and peer-reviewed sources.
 * Addresses problem-statement: clearly explaining the direct impact of their choices.
 */

export interface BoundedParameter {
  low: number;
  central: number;
  high: number;
  unit: string;
  source: string;
  year: number;
  note: string;
}

/**
 * Inhalation rates (m3/day) by age band and exertion level.
 * Sourced from US EPA Exposure Factors Handbook (2011, Chapter 6).
 */
export const INHALATION_RATES: Record<string, Record<"rest" | "light" | "moderate" | "heavy", BoundedParameter>> = {
  infant: {
    rest: { low: 2.1, central: 2.9, high: 3.8, unit: "m3/day", source: "EPA Exposure Factors Handbook", year: 2011, note: "Age < 1 year" },
    light: { low: 3.5, central: 4.8, high: 6.2, unit: "m3/day", source: "EPA Exposure Factors Handbook", year: 2011, note: "Light activity" },
    moderate: { low: 5.2, central: 7.1, high: 9.0, unit: "m3/day", source: "EPA Exposure Factors Handbook", year: 2011, note: "Moderate play" },
    heavy: { low: 7.0, central: 9.5, high: 12.0, unit: "m3/day", source: "EPA Exposure Factors Handbook", year: 2011, note: "Vigorous activity" },
  },
  child: {
    rest: { low: 4.5, central: 6.1, high: 7.8, unit: "m3/day", source: "EPA Exposure Factors Handbook", year: 2011, note: "Age 1-11 years" },
    light: { low: 7.5, central: 9.8, high: 12.4, unit: "m3/day", source: "EPA Exposure Factors Handbook", year: 2011, note: "Light school activity" },
    moderate: { low: 11.2, central: 14.5, high: 18.2, unit: "m3/day", source: "EPA Exposure Factors Handbook", year: 2011, note: "Active play" },
    heavy: { low: 15.0, central: 19.8, high: 25.0, unit: "m3/day", source: "EPA Exposure Factors Handbook", year: 2011, note: "Vigorous outdoor sport" },
  },
  adult: {
    rest: { low: 6.8, central: 8.5, high: 10.5, unit: "m3/day", source: "EPA Exposure Factors Handbook", year: 2011, note: "Adult sedentary" },
    light: { low: 11.0, central: 14.2, high: 17.5, unit: "m3/day", source: "EPA Exposure Factors Handbook", year: 2011, note: "Desk work / walking" },
    moderate: { low: 18.5, central: 23.0, high: 28.5, unit: "m3/day", source: "EPA Exposure Factors Handbook", year: 2011, note: "Cycling / brisk walking" },
    heavy: { low: 28.0, central: 35.0, high: 43.0, unit: "m3/day", source: "EPA Exposure Factors Handbook", year: 2011, note: "Running / heavy labor" },
  },
  older_adult: {
    rest: { low: 6.0, central: 7.8, high: 9.6, unit: "m3/day", source: "EPA Exposure Factors Handbook", year: 2011, note: "Age 65+" },
    light: { low: 9.8, central: 12.8, high: 15.9, unit: "m3/day", source: "EPA Exposure Factors Handbook", year: 2011, note: "Light movement" },
    moderate: { low: 16.0, central: 20.5, high: 25.2, unit: "m3/day", source: "EPA Exposure Factors Handbook", year: 2011, note: "Walking" },
    heavy: { low: 24.0, central: 30.0, high: 37.0, unit: "m3/day", source: "EPA Exposure Factors Handbook", year: 2011, note: "Strenuous exertion" },
  },
};

/**
 * Indoor/Outdoor infiltration ratio (I/O) under various building envelope conditions.
 * Sourced from Chen & Zhao (Atmospheric Environment 2011) and EPA Indoor Air Quality models.
 */
export const INFILTRATION_RATIOS: Record<string, BoundedParameter> = {
  open_windows: { low: 0.75, central: 0.88, high: 0.98, unit: "ratio", source: "Chen & Zhao, Atmos Environ", year: 2011, note: "Natural cross-ventilation" },
  closed_standard: { low: 0.45, central: 0.60, high: 0.75, unit: "ratio", source: "EPA Indoor Air Quality Models", year: 2018, note: "Closed ordinary urban apartment" },
  tight_sealed: { low: 0.20, central: 0.32, high: 0.45, unit: "ratio", source: "Lawrence Berkeley National Lab (LBNL)", year: 2015, note: "Weather-stripped sealed home" },
};

/**
 * Mask exposure reduction factors (1 - penetration factor) accounting for real-world fit and leakage.
 * Sourced from CDC/NIOSH Respirator Performance Assessments & Mueller et al. (Occup Environ Med 2018).
 */
export const MASK_EFFICIENCY: Record<string, BoundedParameter> = {
  none: { low: 0.0, central: 0.0, high: 0.0, unit: "ratio", source: "Baseline", year: 2024, note: "No facial covering" },
  cloth: { low: 0.15, central: 0.28, high: 0.40, unit: "ratio", source: "CDC NIOSH", year: 2021, note: "Double-layer cotton with realistic edge leakage" },
  surgical: { low: 0.35, central: 0.50, high: 0.65, unit: "ratio", source: "Mueller et al., OEM", year: 2018, note: "Standard 3-ply surgical mask with edge gaps" },
  kn95_earloop: { low: 0.65, central: 0.80, high: 0.90, unit: "ratio", source: "CDC NIOSH Assessment", year: 2022, note: "KN95 / FFP2 with ear loops (leakage ~15-20%)" },
  n95_fitted: { low: 0.88, central: 0.95, high: 0.99, unit: "ratio", source: "NIOSH Certified Standard", year: 2020, note: "Fitted N95 with tight head harness seal" },
};

/**
 * Vehicle microenvironment cabin reduction factors compared to ambient roadway air.
 * Sourced from Hudda & Fruin (Environ Sci Technol 2013).
 */
export const VEHICLE_INFILTRATION: Record<string, BoundedParameter> = {
  open_windows: { low: 0.85, central: 0.95, high: 1.0, unit: "ratio", source: "Hudda & Fruin, EST", year: 2013, note: "Vehicle with open windows" },
  recirc_cabin_filter: { low: 0.15, central: 0.25, high: 0.40, unit: "ratio", source: "Hudda & Fruin, EST", year: 2013, note: "AC on recirculation mode with clean cabin filter" },
  fresh_air_mode: { low: 0.40, central: 0.55, high: 0.70, unit: "ratio", source: "Hudda & Fruin, EST", year: 2013, note: "AC drawing outside air without HEPA" },
  metro_train: { low: 0.30, central: 0.45, high: 0.60, unit: "ratio", source: "Public transit air study", year: 2019, note: "Enclosed air-conditioned rail transit" },
  two_wheeler_cycle: { low: 1.0, central: 1.0, high: 1.0, unit: "ratio", source: "Roadway baseline", year: 2020, note: "Direct exposure on roadway" },
};

/**
 * Commute emission factors (g CO2e/km) by transportation mode.
 * Sourced from DMRC Sustainability Reports, ARAI India, and UK DEFRA.
 */
export const COMMUTE_EMISSION_FACTORS: Record<string, BoundedParameter> = {
  metro: { low: 15, central: 22, high: 35, unit: "g CO2e/km", source: "DMRC Sustainability Report", year: 2022, note: "Electric urban rapid transit" },
  bus: { low: 45, central: 68, high: 95, unit: "g CO2e/km", source: "ARAI / MoPNG", year: 2021, note: "CNG urban bus per passenger-km" },
  car_recirc: { low: 120, central: 165, high: 220, unit: "g CO2e/km", source: "ARAI Drive Cycle", year: 2022, note: "Petrol sedan single-occupant" },
  two_wheeler: { low: 85, central: 110, high: 140, unit: "g CO2e/km", source: "ARAI / CPCB", year: 2021, note: "4-stroke 125cc motorcycle" },
  cycle_walk: { low: 0, central: 0, high: 0, unit: "g CO2e/km", source: "Zero tailpipe", year: 2024, note: "Active non-motorized mobility" },
};

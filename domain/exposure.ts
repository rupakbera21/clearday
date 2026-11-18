/**
 * @file exposure.ts
 * @description Inhaled particulate mass exposure model across diverse microenvironments and activities.
 * Addresses problem-statement: clearly explaining the direct impact of their choices, Impact Lab.
 */

import { INHALATION_RATES, INFILTRATION_RATIOS, MASK_EFFICIENCY, VEHICLE_INFILTRATION } from "../data/parameters";

export type AgeBand = "infant" | "child" | "adult" | "older_adult";
export type ExertionLevel = "rest" | "light" | "moderate" | "heavy";
export type MicroenvironmentType =
  | "indoors_open"
  | "indoors_standard"
  | "indoors_hepa"
  | "outdoors"
  | "vehicle_recirc"
  | "vehicle_open"
  | "active_transit";

export type MaskType = "none" | "cloth" | "surgical" | "kn95_earloop" | "n95_fitted";

export interface BoundedValue {
  low: number;
  central: number;
  high: number;
  unit: string;
}

export interface ActivitySegment {
  label: string;
  durationHours: number;
  microenvironment: MicroenvironmentType;
  exertion: ExertionLevel;
  mask: MaskType;
  ambientPm25: number;
}

export interface ExposureEstimateResult {
  totalInhaledMassUg: BoundedValue;
  hourlySegments: {
    label: string;
    durationHours: number;
    microConcentrationUgM3: BoundedValue;
    inhaledMassUg: BoundedValue;
    maskReductionPercent: number;
  }[];
  assumptions: string[];
}

/**
 * Calculates effective particulate concentration in a microenvironment given ambient air.
 */
export function getMicroenvironmentConcentration(
  env: MicroenvironmentType,
  ambientPm25: number,
): BoundedValue {
  const safeAmbient = Number.isNaN(ambientPm25) || ambientPm25 < 0 ? 0 : ambientPm25;

  switch (env) {
    case "outdoors":
    case "active_transit":
      return { low: safeAmbient, central: safeAmbient, high: safeAmbient, unit: "ug/m3" };

    case "indoors_open": {
      const p = INFILTRATION_RATIOS.open_windows!;
      return {
        low: Math.round(safeAmbient * p.low),
        central: Math.round(safeAmbient * p.central),
        high: Math.round(safeAmbient * p.high),
        unit: "ug/m3",
      };
    }

    case "indoors_standard": {
      const p = INFILTRATION_RATIOS.closed_standard!;
      return {
        low: Math.round(safeAmbient * p.low),
        central: Math.round(safeAmbient * p.central),
        high: Math.round(safeAmbient * p.high),
        unit: "ug/m3",
      };
    }

    case "indoors_hepa": {
      // Standard envelope with active HEPA air purification achieving ~70-85% reduction
      return {
        low: Math.round(safeAmbient * 0.12),
        central: Math.round(safeAmbient * 0.20),
        high: Math.round(safeAmbient * 0.30),
        unit: "ug/m3",
      };
    }

    case "vehicle_recirc": {
      const p = VEHICLE_INFILTRATION.recirc_cabin_filter!;
      return {
        low: Math.round(safeAmbient * p.low),
        central: Math.round(safeAmbient * p.central),
        high: Math.round(safeAmbient * p.high),
        unit: "ug/m3",
      };
    }

    case "vehicle_open": {
      const p = VEHICLE_INFILTRATION.open_windows!;
      return {
        low: Math.round(safeAmbient * p.low),
        central: Math.round(safeAmbient * p.central),
        high: Math.round(safeAmbient * p.high),
        unit: "ug/m3",
      };
    }
  }
}

/**
 * Calculates inhaled PM2.5 mass for a person across a schedule of daily activity segments.
 */
export function calculateInhaledExposure(
  segments: ActivitySegment[],
  ageBand: AgeBand = "adult",
): ExposureEstimateResult {
  let totalLow = 0;
  let totalCentral = 0;
  let totalHigh = 0;

  const hourlySegments = segments.map((seg) => {
    const microConc = getMicroenvironmentConcentration(seg.microenvironment, seg.ambientPm25);
    const maskParam = MASK_EFFICIENCY[seg.mask] ?? MASK_EFFICIENCY.none!;
    const maskPenetration = {
      low: 1 - maskParam.high, // highest mask efficiency gives lowest penetration
      central: 1 - maskParam.central,
      high: 1 - maskParam.low,
    };

    const inhlRateDaily = INHALATION_RATES[ageBand]![seg.exertion];
    // Convert m3/day to m3/hour
    const rateHourly = {
      low: inhlRateDaily.low / 24,
      central: inhlRateDaily.central / 24,
      high: inhlRateDaily.high / 24,
    };

    // Inhaled mass (ug) = Concentration (ug/m3) * InhalationRate (m3/h) * Duration (h) * MaskPenetration
    const segInhaledLow = microConc.low * rateHourly.low * seg.durationHours * maskPenetration.low;
    const segInhaledCentral = microConc.central * rateHourly.central * seg.durationHours * maskPenetration.central;
    const segInhaledHigh = microConc.high * rateHourly.high * seg.durationHours * maskPenetration.high;

    totalLow += segInhaledLow;
    totalCentral += segInhaledCentral;
    totalHigh += segInhaledHigh;

    return {
      label: seg.label,
      durationHours: seg.durationHours,
      microConcentrationUgM3: microConc,
      inhaledMassUg: {
        low: Math.round(segInhaledLow * 10) / 10,
        central: Math.round(segInhaledCentral * 10) / 10,
        high: Math.round(segInhaledHigh * 10) / 10,
        unit: "ug",
      },
      maskReductionPercent: Math.round(maskParam.central * 100),
    };
  });

  return {
    totalInhaledMassUg: {
      low: Math.round(totalLow * 10) / 10,
      central: Math.round(totalCentral * 10) / 10,
      high: Math.round(totalHigh * 10) / 10,
      unit: "ug",
    },
    hourlySegments,
    assumptions: [
      `Inhalation rates derived from US EPA Exposure Factors Handbook (2011) for ${ageBand}.`,
      "Microenvironment penetration factors based on empirical indoor/outdoor infiltration studies.",
      "Mask filtration accounts for real-world face seal leakage.",
    ],
  };
}

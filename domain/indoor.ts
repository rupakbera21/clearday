/**
 * @file indoor.ts
 * @description Single-compartment mass-balance indoor air quality and purifier sizing calculator.
 * Addresses problem-statement: indoor air quality hacks, home air toolkit, purifier sizing.
 */

export interface RoomSpecification {
  floorAreaM2: number;
  ceilingHeightM?: number; // default 2.8m
  windowState: "open" | "closed_standard" | "closed_weatherstripped";
}

export interface PurifierSpecification {
  hasPurifier: boolean;
  type?: "commercial_hepa" | "diy_box_fan" | "none";
  cadrM3H?: number; // Clean Air Delivery Rate in m3/hr
}

export interface IndoorReductionResult {
  roomVolumeM3: number;
  naturalAch: number;
  cleanAirAch: number;
  totalAch: number;
  steadyStateInfiltrationRatio: number;
  estimatedIndoorPm25: {
    low: number;
    central: number;
    high: number;
  };
  reductionPercentage: number;
  recommendedCadrM3H: number;
  isAdequatelySized: boolean;
  caveats: string[];
}

function getExchangeParams(windowState: RoomSpecification["windowState"]): {
  naturalAch: number;
  penetrationFactor: number;
} {
  if (windowState === "open") {
    return { naturalAch: 2.5, penetrationFactor: 0.95 };
  }
  if (windowState === "closed_weatherstripped") {
    return { naturalAch: 0.3, penetrationFactor: 0.65 };
  }
  return { naturalAch: 0.6, penetrationFactor: 0.8 };
}

function determineCadr(purifier: PurifierSpecification): number {
  if (!purifier.hasPurifier) return 0;
  if (purifier.cadrM3H && purifier.cadrM3H > 0) {
    return purifier.cadrM3H;
  }
  if (purifier.type === "diy_box_fan") {
    return 450;
  }
  return 250;
}

/**
 * Calculates indoor particulate concentration using single-compartment mass balance.
 */
export function calculateIndoorAir(
  room: RoomSpecification,
  purifier: PurifierSpecification,
  ambientPm25: number,
): IndoorReductionResult {
  const safeArea = Number.isNaN(room.floorAreaM2) || room.floorAreaM2 <= 0 ? 20 : room.floorAreaM2;
  const height = Number.isNaN(room.ceilingHeightM ?? 2.8) ? 2.8 : Math.max(1, room.ceilingHeightM ?? 2.8);
  const volume = Math.max(1, safeArea * height);
  const safeAmbient = Number.isNaN(ambientPm25) || ambientPm25 < 0 ? 0 : ambientPm25;

  const { naturalAch, penetrationFactor } = getExchangeParams(room.windowState);
  const depositionRate = 0.2;
  const cadr = determineCadr(purifier);

  const cleanAirAch = cadr / volume;
  const totalEffectiveRemoval = naturalAch + depositionRate + cleanAirAch;

  // Steady-state indoor/outdoor ratio: (P * naturalAch) / (naturalAch + deposition + CADR/V)
  const ioRatio = (penetrationFactor * naturalAch) / totalEffectiveRemoval;
  const clampedIoRatio = Math.max(0.05, Math.min(ioRatio, 1.0));

  const centralEstimate = Math.round(safeAmbient * clampedIoRatio);
  const lowEstimate = Math.round(centralEstimate * 0.85);
  const highEstimate = Math.round(centralEstimate * 1.2);

  const baselineUnfilteredRatio = (penetrationFactor * naturalAch) / (naturalAch + depositionRate);
  const reductionPercentage = Math.max(
    0,
    Math.round(((baselineUnfilteredRatio - clampedIoRatio) / baselineUnfilteredRatio) * 100),
  );

  const recommendedCadrM3H = Math.round(volume * 4.5);
  const isAdequatelySized = cleanAirAch >= 4.0;

  const caveats = [
    "Mass-balance estimates assume complete air mixing without internal particulate generation (e.g. cooking, smoking).",
    "Real-world purifier effectiveness drops if internal doors or windows remain open.",
  ];

  if (room.windowState === "open" && purifier.hasPurifier) {
    caveats.push("Warning: Open windows provide high infiltration that overwhelms typical air purifier capacity.");
  }

  return {
    roomVolumeM3: Math.round(volume * 10) / 10,
    naturalAch,
    cleanAirAch: Math.round(cleanAirAch * 10) / 10,
    totalAch: Math.round(totalEffectiveRemoval * 10) / 10,
    steadyStateInfiltrationRatio: Math.round(clampedIoRatio * 100) / 100,
    estimatedIndoorPm25: { low: lowEstimate, central: centralEstimate, high: highEstimate },
    reductionPercentage,
    recommendedCadrM3H,
    isAdequatelySized,
    caveats,
  };
}

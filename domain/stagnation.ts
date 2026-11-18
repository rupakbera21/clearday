/**
 * @file stagnation.ts
 * @description Deterministic meteorological stagnation indicators and combustion vs dust heuristic hints.
 * Addresses problem-statement: severe winter smog and urban air pollution, why is it bad today panel.
 */

export interface MeteorologicalConditions {
  windSpeedMps: number;
  temperatureC: number;
  relativeHumidityPercent: number;
  pm25: number;
  pm10: number;
}

export interface StagnationFactor {
  factor: "low_wind" | "cold_inversion" | "high_humidity" | "combustion_dominance" | "crustal_dust";
  title: string;
  isTriggered: boolean;
  explanation: string;
}

export interface StagnationAnalysisResult {
  stagnationSeverity: "low" | "moderate" | "severe";
  pmRatio: number;
  sourceHint: "combustion_smog" | "crustal_dust" | "mixed";
  sourceHintLabel: string;
  contributingFactors: StagnationFactor[];
  summaryCaveat: string;
}

function determineSeverity(triggeredCount: number, pm25: number): StagnationAnalysisResult["stagnationSeverity"] {
  if (triggeredCount >= 2 && pm25 > 100) {
    return "severe";
  }
  if (triggeredCount >= 1 || pm25 > 60) {
    return "moderate";
  }
  return "low";
}

function classifySource(ratio: number): {
  sourceHint: StagnationAnalysisResult["sourceHint"];
  sourceHintLabel: string;
} {
  if (ratio >= 0.55) {
    return {
      sourceHint: "combustion_smog",
      sourceHintLabel: "Predominantly fine combustion smog (vehicles, biomass burning, industrial emissions)",
    };
  }
  if (ratio < 0.35) {
    return {
      sourceHint: "crustal_dust",
      sourceHintLabel: "Predominantly coarse mineral dust (construction, road dust, soil resuspension)",
    };
  }
  return {
    sourceHint: "mixed",
    sourceHintLabel: "Mixed urban aerosol and regional background",
  };
}

/**
 * Evaluates meteorological stagnation and aerosol characteristics from weather and pollution inputs.
 */
export function analyzeStagnation(conditions: MeteorologicalConditions): StagnationAnalysisResult {
  const pm10 = Math.max(0.1, conditions.pm10);
  const pm25 = Math.max(0, conditions.pm25);
  const ratio = Math.round((pm25 / pm10) * 100) / 100;

  const isLowWind = conditions.windSpeedMps < 2.0;
  const isCold = conditions.temperatureC < 14.0;
  const isHighHumidity = conditions.relativeHumidityPercent > 70;

  let triggeredCount = 0;
  if (isLowWind) triggeredCount++;
  if (isCold) triggeredCount++;
  if (isHighHumidity) triggeredCount++;

  const stagnationSeverity = determineSeverity(triggeredCount, conditions.pm25);
  const { sourceHint, sourceHintLabel } = classifySource(ratio);

  const factors: StagnationFactor[] = [
    {
      factor: "low_wind",
      title: "Atmospheric Calm (Low Wind Speed)",
      isTriggered: isLowWind,
      explanation: isLowWind
        ? `Wind speed is low (${conditions.windSpeedMps} m/s), trapping emissions near ground level.`
        : `Wind speed is moderate (${conditions.windSpeedMps} m/s), facilitating ventilation.`,
    },
    {
      factor: "cold_inversion",
      title: "Winter Temperature Inversion",
      isTriggered: isCold,
      explanation: isCold
        ? `Cold temperatures (${conditions.temperatureC}°C) compress emissions into a shallow surface layer.`
        : `Surface temperatures (${conditions.temperatureC}°C) allow vertical air movement.`,
    },
    {
      factor: "high_humidity",
      title: "Moisture & Secondary Aerosol Formation",
      isTriggered: isHighHumidity,
      explanation: isHighHumidity
        ? `High relative humidity (${conditions.relativeHumidityPercent}%) fosters secondary aerosol growth.`
        : `Relative humidity (${conditions.relativeHumidityPercent}%) is within moderate bounds.`,
    },
    {
      factor: "combustion_dominance",
      title: "Fine Particulate Fraction (PM2.5 / PM10)",
      isTriggered: ratio >= 0.55,
      explanation: `Fine-to-coarse ratio is ${ratio}. Higher ratios indicate elevated contribution from combustion.`,
    },
  ];

  return {
    stagnationSeverity,
    pmRatio: ratio,
    sourceHint,
    sourceHintLabel,
    contributingFactors: factors,
    summaryCaveat:
      "Indicative heuristic estimate derived from coarse meteorological model data. Local hotspots vary across neighborhoods.",
  };
}

/**
 * @file risk.ts
 * @description Evaluates deterministic health risk bands by vulnerable group and AQI category.
 * Addresses problem-statement: families, severe winter smog, health risk bands.
 */

import { AqiCategory } from "./aqi";

export type VulnerableGroup =
  | "general"
  | "children"
  | "older_adults"
  | "pregnancy"
  | "asthma_copd"
  | "outdoor_workers";

export type RiskLevel = "low" | "moderate" | "high" | "very_high" | "hazardous";

export interface GroupRiskAssessment {
  group: VulnerableGroup;
  riskLevel: RiskLevel;
  advisoryText: string;
  actionRequired: string;
  source: string;
}

const RISK_RULES: Record<AqiCategory, Record<VulnerableGroup, { level: RiskLevel; advisory: string; action: string }>> = {
  good: {
    general: { level: "low", advisory: "Air quality is satisfactory; air pollution poses little or no risk.", action: "Normal outdoor activity." },
    children: { level: "low", advisory: "Clean air ideal for outdoor play and physical activity.", action: "Enjoy outdoor play." },
    older_adults: { level: "low", advisory: "No restrictions necessary.", action: "Normal routines." },
    pregnancy: { level: "low", advisory: "Safe ambient environment.", action: "Normal outdoor activity." },
    asthma_copd: { level: "low", advisory: "Low respiratory trigger likelihood.", action: "Maintain routine inhalers." },
    outdoor_workers: { level: "low", advisory: "Safe working air.", action: "Normal shifts." },
  },
  satisfactory: {
    general: { level: "low", advisory: "Air quality is acceptable for most individuals.", action: "Normal outdoor activity." },
    children: { level: "low", advisory: "Minor particulate presence; generally safe.", action: "Normal outdoor play." },
    older_adults: { level: "low", advisory: "Generally well tolerated.", action: "Normal activity." },
    pregnancy: { level: "low", advisory: "Acceptable for outdoor movement.", action: "Normal routines." },
    asthma_copd: { level: "moderate", advisory: "Unusually sensitive individuals may experience minor cough.", action: "Carry reliever inhaler." },
    outdoor_workers: { level: "low", advisory: "Minor dust presence.", action: "Standard work shifts." },
  },
  moderate: {
    general: { level: "moderate", advisory: "May cause breathing discomfort to people with lung disease.", action: "Consider reducing prolonged heavy exertion outdoors." },
    children: { level: "moderate", advisory: "Active children may develop mild irritation during prolonged sports.", action: "Limit strenuous outdoor sports to under 1 hour." },
    older_adults: { level: "moderate", advisory: "Cardiovascular sensitivity elevated slightly.", action: "Take frequent rest breaks during walks." },
    pregnancy: { level: "moderate", advisory: "Submicron particulates begin to accumulate with prolonged exposure.", action: "Avoid congested roads and busy junctions." },
    asthma_copd: { level: "high", advisory: "Increased incidence of wheezing and airway constriction.", action: "Avoid outdoor exercise; keep bronchodilator accessible." },
    outdoor_workers: { level: "moderate", advisory: "Continuous breathing of moderate particulates.", action: "Wear dust protection or basic face covering." },
  },
  poor: {
    general: { level: "high", advisory: "Breathing discomfort to most people on prolonged exposure.", action: "Avoid prolonged outdoor exertion; wear an N95 when commuting." },
    children: { level: "high", advisory: "High risk of coughing and throat irritation in developing lungs.", action: "Cancel outdoor school sports; move recess indoors." },
    older_adults: { level: "high", advisory: "Significantly elevated risk of cardiovascular events.", action: "Stay indoors in filtered rooms; avoid morning walks." },
    pregnancy: { level: "high", advisory: "Elevated systemic inflammatory response across placenta.", action: "Stay in HEPA-filtered rooms; avoid outdoor errands." },
    asthma_copd: { level: "very_high", advisory: "High probability of acute asthma exacerbation.", action: "Strictly avoid going outdoors; use prescribed controllers." },
    outdoor_workers: { level: "high", advisory: "Heavy respiratory exposure during physical labor.", action: "Mandatory N95 respirators; rotate shifts." },
  },
  very_poor: {
    general: { level: "very_high", advisory: "Respiratory illness to the people on prolonged exposure.", action: "Minimize all outdoor exposure; run HEPA air purifiers indoors." },
    children: { level: "very_high", advisory: "Severe lung irritation and acute airway resistance.", action: "Strict indoor stay; suspend outdoor assemblies and games." },
    older_adults: { level: "very_high", advisory: "Severe risk to individuals with heart or lung disease.", action: "Remain indoors in sealed, filtered rooms." },
    pregnancy: { level: "very_high", advisory: "Hazardous particle exposure associated with fetal distress.", action: "Remain in HEPA-filtered living quarters." },
    asthma_copd: { level: "hazardous", advisory: "Severe risk of hospital-level bronchospasm.", action: "Stay in sealed room; have emergency protocol ready." },
    outdoor_workers: { level: "very_high", advisory: "Dangerous occupational inhalation rate.", action: "Halt heavy physical labor outdoors; mandate N95." },
  },
  severe: {
    general: { level: "hazardous", advisory: "Affects healthy people and seriously impacts those with existing diseases.", action: "Avoid all non-essential outdoor movement; seal windows." },
    children: { level: "hazardous", advisory: "Critical risk of acute respiratory distress and bronchitis.", action: "Complete prohibition of outdoor activity; filter home air." },
    older_adults: { level: "hazardous", advisory: "Extreme cardiovascular and cerebrovascular hazard.", action: "Strict indoor shelter; avoid cold exposure." },
    pregnancy: { level: "hazardous", advisory: "Severe toxicity hazard; potential adverse birth outcomes.", action: "Strict indoor confinement in purified environment." },
    asthma_copd: { level: "hazardous", advisory: "Life-threatening exacerbation risk.", action: "Seek medical evaluation at earliest sign of respiratory distress." },
    outdoor_workers: { level: "hazardous", advisory: "Hazardous exposure; emergency conditions.", action: "Suspend all non-essential outdoor work." },
  },
};

/**
 * Assesses deterministic health risk for a specific group based on AQI category.
 */
export function assessGroupRisk(group: VulnerableGroup, category: AqiCategory): GroupRiskAssessment {
  const rule = RISK_RULES[category][group];
  return {
    group,
    riskLevel: rule.level,
    advisoryText: rule.advisory,
    actionRequired: rule.action,
    source: "WHO Air Quality Guidelines (2021) & CPCB Health Advisories",
  };
}

/**
 * Evaluates risk across all sensitive demographic groups for an air quality snapshot.
 */
export function assessAllGroups(category: AqiCategory): GroupRiskAssessment[] {
  const groups: VulnerableGroup[] = [
    "general",
    "children",
    "older_adults",
    "pregnancy",
    "asthma_copd",
    "outdoor_workers",
  ];
  return groups.map((g) => assessGroupRisk(g, category));
}

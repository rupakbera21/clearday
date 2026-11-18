/**
 * @file alternatives.ts
 * @description Ranks sustainable alternatives by exposure reduction, carbon emissions, and cost tier.
 * Addresses problem-statement: sustainable alternatives, low-emission daily routines.
 */

export type AlternativeCategory = "commute" | "cooking" | "heating" | "waste";
export type BudgetTier = "free" | "low" | "medium" | "high";

export interface AlternativeItem {
  id: string;
  category: AlternativeCategory;
  title: string;
  description: string;
  costTier: BudgetTier;
  exposureReductionPercent: number; // Estimated reduction in inhaled PM2.5
  co2eAvoidedGramsPerUnit: number; // Emissions avoided compared to conventional baseline
  unit: string;
  tradeOffs: string;
  realisticFor: string;
  sourceOrg: string;
}

export const ALTERNATIVES_DATA: AlternativeItem[] = [
  // Commute alternatives
  {
    id: "alt_commute_metro_transit",
    category: "commute",
    title: "Shift to Electric Metro / Subway Rail",
    description: "Replace petrol two-wheeler or single-occupancy car with electrified urban rail transit.",
    costTier: "low",
    exposureReductionPercent: 65,
    co2eAvoidedGramsPerUnit: 154,
    unit: "per passenger-km",
    tradeOffs: "Reduces road-level tailpipe inhalation drastically; requires walking to stations and fixed schedules.",
    realisticFor: "Urban commuters living within 2-3 km of rapid transit feeder networks.",
    sourceOrg: "UK DEFRA & DMRC Transit Studies",
  },
  {
    id: "alt_commute_carpool_recirc",
    category: "commute",
    title: "Carpooling with Cabin Recirculation",
    description: "Share vehicle rides while strictly running air conditioning on recirculation mode with a clean cabin filter.",
    costTier: "free",
    exposureReductionPercent: 55,
    co2eAvoidedGramsPerUnit: 96,
    unit: "per passenger-km",
    tradeOffs: "Cuts vehicle emissions per person in half; requires coordinated departure schedules.",
    realisticFor: "Colleagues and neighbors with shared office corridors.",
    sourceOrg: "Hudda & Fruin (EST)",
  },
  {
    id: "alt_commute_ev_two_wheeler",
    category: "commute",
    title: "Switch to Electric Scooter + Fitted N95",
    description: "Replace petrol scooter with an electric two-wheeler and wear a certified N95 respirator during transit.",
    costTier: "high",
    exposureReductionPercent: 70,
    co2eAvoidedGramsPerUnit: 60,
    unit: "per km",
    tradeOffs: "Eliminates local exhaust emissions; requires upfront vehicle capital and charging access.",
    realisticFor: "Households replacing an aging petrol two-wheeler with home charging.",
    sourceOrg: "IEA Global EV Outlook",
  },
  // Cooking alternatives
  {
    id: "alt_cook_induction_stove",
    category: "cooking",
    title: "Electric Induction Cooking with Forced Ventilation",
    description: "Replace or supplement LPG gas burners with high-efficiency electric induction hobs.",
    costTier: "medium",
    exposureReductionPercent: 45,
    co2eAvoidedGramsPerUnit: 170,
    unit: "per meal",
    tradeOffs: "Eliminates gas combustion byproducts (NO2, CO); requires induction-compatible cookware.",
    realisticFor: "Apartments and homes with reliable grid electricity.",
    sourceOrg: "WHO Household Energy Guidelines",
  },
  {
    id: "alt_cook_lidded_steaming",
    category: "cooking",
    title: "Closed-Lid Simmering and Pressure Cooking",
    description: "Use tight-lidded pots and pressure cookers instead of high-heat open wok shallow frying or searing.",
    costTier: "free",
    exposureReductionPercent: 35,
    co2eAvoidedGramsPerUnit: 50,
    unit: "per meal",
    tradeOffs: "Cuts aerosolized cooking oil fumes immediately with zero monetary investment.",
    realisticFor: "All households preparing everyday home meals.",
    sourceOrg: "EPA Indoor Air Division",
  },
  // Heating alternatives
  {
    id: "alt_heat_reverse_ac",
    category: "heating",
    title: "Split AC Heat Pump / Reverse Cycle Heating",
    description: "Use split-system air conditioning in heating mode rather than resistive space blowers or open fires.",
    costTier: "free", // For homes already possessing a heat-pump AC unit
    exposureReductionPercent: 95,
    co2eAvoidedGramsPerUnit: 760,
    unit: "per operating hour",
    tradeOffs: "Delivers 3x thermal efficiency over electric coil heaters; requires a reverse-cycle split unit.",
    realisticFor: "Households with inverter reverse-cycle ACs.",
    sourceOrg: "International Energy Agency (IEA)",
  },
  {
    id: "alt_heat_oil_radiator",
    category: "heating",
    title: "Sealed Oil-Filled Electric Radiator",
    description: "Use sealed convection oil radiators instead of red-hot coil heaters or combustion angithis.",
    costTier: "medium",
    exposureReductionPercent: 90,
    co2eAvoidedGramsPerUnit: 2500,
    unit: "per operating hour vs coal",
    tradeOffs: "Zero toxic combustion emissions or carbon monoxide risk; takes 15 minutes to warm up.",
    realisticFor: "Bedrooms and living rooms needing sustained overnight warmth.",
    sourceOrg: "US CDC / CPCB Safety Advisories",
  },
  // Waste alternatives
  {
    id: "alt_waste_community_compost",
    category: "waste",
    title: "Neighborhood Aerobic Leaf Composting",
    description: "Collect fallen winter dry leaves into aerated mesh compost bins instead of burning piles.",
    costTier: "free",
    exposureReductionPercent: 98,
    co2eAvoidedGramsPerUnit: 2310,
    unit: "per kg dry waste",
    tradeOffs: "Completely eliminates toxic ground-level smoke plumes; requires small community garden space.",
    realisticFor: "Resident Welfare Associations, housing societies, and school campuses.",
    sourceOrg: "IPCC Waste Guidelines / CPCB",
  },
];

const BUDGET_WEIGHTS: Record<BudgetTier, number> = {
  free: 1,
  low: 2,
  medium: 3,
  high: 4,
};

/**
 * Filters and ranks sustainable alternatives based on category and household budget tier.
 */
export function getRankedAlternatives(
  category?: AlternativeCategory,
  maxBudget: BudgetTier = "high",
): AlternativeItem[] {
  const maxBudgetRank = BUDGET_WEIGHTS[maxBudget];

  return ALTERNATIVES_DATA.filter((item) => {
    if (category && item.category !== category) return false;
    const itemBudgetRank = BUDGET_WEIGHTS[item.costTier];
    return itemBudgetRank <= maxBudgetRank;
  }).sort((a, b) => {
    // Sort by exposure reduction descending, then co2e avoided descending
    if (b.exposureReductionPercent !== a.exposureReductionPercent) {
      return b.exposureReductionPercent - a.exposureReductionPercent;
    }
    return b.co2eAvoidedGramsPerUnit - a.co2eAvoidedGramsPerUnit;
  });
}

import { validateGroundedNumbers, FactItem } from "../validator";

describe("services/ai/validator (Grounded-Numbers Rule)", () => {
  const allowedFacts: Record<string, FactItem> = {
    fact_baseline: { id: "fact_baseline", value: 350, label: "Baseline Inhaled PM2.5" },
    fact_chosen: { id: "fact_chosen", value: 120, label: "Chosen Day Inhaled PM2.5" },
    fact_reduction: { id: "fact_reduction", value: 66, label: "Exposure Reduction %" },
  };

  it("passes when all numerals match cited facts exactly", () => {
    const text = "Your daily exposure drops from 350 to 120, giving a 66% reduction.";
    const cited = ["fact_baseline", "fact_chosen", "fact_reduction"];

    const res = validateGroundedNumbers(text, cited, allowedFacts);
    expect(res.isValid).toBe(true);
    expect(res.violations).toHaveLength(0);
  });

  it("fails when model invents a numeral not in the facts", () => {
    // 999 is an invented number!
    const text = "Your daily exposure drops from 350 to 120, saving 999 micrograms.";
    const cited = ["fact_baseline", "fact_chosen"];

    const res = validateGroundedNumbers(text, cited, allowedFacts);
    expect(res.isValid).toBe(false);
    expect(res.violations.some((v) => v.includes("999"))).toBe(true);
  });

  it("fails when model cites a wrong or non-existent fact ID", () => {
    const text = "Your daily exposure drops from 350 to 120.";
    const cited = ["fact_baseline", "fact_non_existent_id"];

    const res = validateGroundedNumbers(text, cited, allowedFacts);
    expect(res.isValid).toBe(false);
    expect(res.violations.some((v) => v.includes("fact_non_existent_id"))).toBe(true);
  });

  it("allows clock times (08:00) and whitelisted profile numbers without fact citations", () => {
    const text = "At 08:00, 2 children should stay indoors where exposure drops to 120.";
    const cited = ["fact_chosen"];
    const whitelisted = new Set(["2"]);

    const res = validateGroundedNumbers(text, cited, allowedFacts, whitelisted);
    expect(res.isValid).toBe(true);
  });
});

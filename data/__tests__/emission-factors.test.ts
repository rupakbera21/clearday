import { EMISSION_FACTORS } from "../emission-factors";

describe("data/emission-factors", () => {
  it("enforces that every entry has unit, valid source URL, year, and ordered bounds", () => {
    expect(EMISSION_FACTORS.length).toBeGreaterThanOrEqual(12);

    for (const factor of EMISSION_FACTORS) {
      expect(factor.id.length).toBeGreaterThan(0);
      expect(["commute", "cooking", "heating", "electricity", "waste"]).toContain(factor.category);
      expect(factor.unit.length).toBeGreaterThan(0);
      expect(factor.low).toBeLessThanOrEqual(factor.central);
      expect(factor.central).toBeLessThanOrEqual(factor.high);

      // Verifiable source URL
      expect(factor.sourceUrl.startsWith("https://")).toBe(true);
      expect(factor.sourceOrg.length).toBeGreaterThan(0);
      expect(factor.year).toBeGreaterThanOrEqual(2006);
      expect(factor.notes.length).toBeGreaterThan(0);
    }
  });

  it("ensures no duplicate ids exist in emission factors", () => {
    const ids = new Set<string>();
    for (const f of EMISSION_FACTORS) {
      expect(ids.has(f.id)).toBe(false);
      ids.add(f.id);
    }
  });
});

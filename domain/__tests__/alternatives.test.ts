import { getRankedAlternatives } from "../alternatives";

describe("domain/alternatives", () => {
  it("filters alternatives by budget tier", () => {
    const freeOnly = getRankedAlternatives("commute", "free");
    expect(freeOnly.every((item) => item.costTier === "free")).toBe(true);

    const highBudget = getRankedAlternatives("commute", "high");
    expect(highBudget.length).toBeGreaterThanOrEqual(freeOnly.length);
  });

  it("ranks alternatives by exposure reduction descending", () => {
    const all = getRankedAlternatives();
    for (let i = 0; i < all.length - 1; i++) {
      expect(all[i]!.exposureReductionPercent).toBeGreaterThanOrEqual(
        all[i + 1]!.exposureReductionPercent,
      );
    }
  });
});

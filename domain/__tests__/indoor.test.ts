import * as fc from "fast-check";
import { calculateIndoorAir, RoomSpecification } from "../indoor";

describe("domain/indoor", () => {
  it("calculates room volume, ACH, and indoor reduction percentage correctly", () => {
    const res = calculateIndoorAir(
      { floorAreaM2: 20, ceilingHeightM: 3.0, windowState: "closed_standard" },
      { hasPurifier: true, type: "commercial_hepa", cadrM3H: 300 },
      200,
    );

    expect(res.roomVolumeM3).toBe(60);
    expect(res.cleanAirAch).toBe(5);
    expect(res.isAdequatelySized).toBe(true);
    expect(res.reductionPercentage).toBeGreaterThan(60);
    expect(res.estimatedIndoorPm25.low).toBeLessThanOrEqual(res.estimatedIndoorPm25.central);
    expect(res.estimatedIndoorPm25.central).toBeLessThanOrEqual(res.estimatedIndoorPm25.high);
  });

  describe("Property tests (fast-check)", () => {
    it("more filtration never raises exposure (monotonicity)", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 10, max: 100, noNaN: true }), // area m2
          fc.float({ min: 10, max: 500, noNaN: true }), // ambient PM2.5
          fc.float({ min: 50, max: 300, noNaN: true }), // CADR 1
          fc.float({ min: 301, max: 800, noNaN: true }), // CADR 2 (strictly higher)
          (area, ambient, cadr1, cadr2) => {
            const res1 = calculateIndoorAir(
              { floorAreaM2: area, windowState: "closed_standard" },
              { hasPurifier: true, cadrM3H: cadr1 },
              ambient,
            );
            const res2 = calculateIndoorAir(
              { floorAreaM2: area, windowState: "closed_standard" },
              { hasPurifier: true, cadrM3H: cadr2 },
              ambient,
            );

            expect(res2.estimatedIndoorPm25.central).toBeLessThanOrEqual(
              res1.estimatedIndoorPm25.central,
            );
          },
        ),
      );
    });

    it("results never go negative and ranges are strictly ordered low <= central <= high", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 5, max: 200, noNaN: true }),
          fc.float({ min: 0, max: 1000, noNaN: true }),
          fc.constantFrom("open", "closed_standard", "closed_weatherstripped"),
          (area, ambient, windowState) => {
            const res = calculateIndoorAir(
              { floorAreaM2: area, windowState: windowState as RoomSpecification["windowState"] },
              { hasPurifier: true, cadrM3H: 250 },
              ambient,
            );

            expect(res.estimatedIndoorPm25.low).toBeGreaterThanOrEqual(0);
            expect(res.estimatedIndoorPm25.low).toBeLessThanOrEqual(res.estimatedIndoorPm25.central);
            expect(res.estimatedIndoorPm25.central).toBeLessThanOrEqual(res.estimatedIndoorPm25.high);
          },
        ),
      );
    });
  });
});

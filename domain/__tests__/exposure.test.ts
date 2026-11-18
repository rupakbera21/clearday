import * as fc from "fast-check";
import {
  calculateInhaledExposure,
  getMicroenvironmentConcentration,
  ActivitySegment,
  MicroenvironmentType,
} from "../exposure";

describe("domain/exposure", () => {
  it("computes inhaled PM2.5 with ordered intervals (low <= central <= high)", () => {
    const segments: ActivitySegment[] = [
      {
        label: "Sleep indoors",
        durationHours: 8,
        microenvironment: "indoors_hepa",
        exertion: "rest",
        mask: "none",
        ambientPm25: 180,
      },
      {
        label: "Bike commute",
        durationHours: 1,
        microenvironment: "active_transit",
        exertion: "moderate",
        mask: "n95_fitted",
        ambientPm25: 250,
      },
    ];

    const result = calculateInhaledExposure(segments, "adult");
    expect(result.totalInhaledMassUg.low).toBeLessThanOrEqual(result.totalInhaledMassUg.central);
    expect(result.totalInhaledMassUg.central).toBeLessThanOrEqual(result.totalInhaledMassUg.high);
    expect(result.hourlySegments).toHaveLength(2);
  });

  describe("Property tests (fast-check)", () => {
    it("ensures microenvironment concentration is always non-negative and low <= central <= high", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1000, noNaN: true }),
          fc.constantFrom(
            "indoors_open",
            "indoors_standard",
            "indoors_hepa",
            "outdoors",
            "vehicle_recirc",
            "vehicle_open",
            "active_transit",
          ),
          (ambient, env) => {
            const conc = getMicroenvironmentConcentration(env as MicroenvironmentType, ambient);
            expect(conc.low).toBeGreaterThanOrEqual(0);
            expect(conc.low).toBeLessThanOrEqual(conc.central);
            expect(conc.central).toBeLessThanOrEqual(conc.high);
          },
        ),
      );
    });

    it("ensures fitted N95 respirator always yields lower inhaled mass than no mask", () => {
      fc.assert(
        fc.property(fc.float({ min: 10, max: 500, noNaN: true }), (ambient) => {
          const segNoMask: ActivitySegment = {
            label: "Walk",
            durationHours: 1,
            microenvironment: "outdoors",
            exertion: "light",
            mask: "none",
            ambientPm25: ambient,
          };

          const segN95: ActivitySegment = {
            ...segNoMask,
            mask: "n95_fitted",
          };

          const resNoMask = calculateInhaledExposure([segNoMask], "adult");
          const resN95 = calculateInhaledExposure([segN95], "adult");

          expect(resN95.totalInhaledMassUg.central).toBeLessThan(
            resNoMask.totalInhaledMassUg.central,
          );
        }),
      );
    });
  });
});

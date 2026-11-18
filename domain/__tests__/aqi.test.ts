import * as fc from "fast-check";
import { computeAqi } from "../aqi";

describe("domain/aqi", () => {
  describe("Breakpoint boundaries and clamping", () => {
    it("computes exact boundary values for India NAQI", () => {
      // 0 ug/m3 -> 0
      expect(computeAqi({ pm25: 0 }, "india_naqi").aqi).toBe(0);
      // 30 ug/m3 -> 50 (Good boundary)
      expect(computeAqi({ pm25: 30 }, "india_naqi").aqi).toBe(50);
      // 60 ug/m3 -> 100 (Satisfactory boundary)
      expect(computeAqi({ pm25: 60 }, "india_naqi").aqi).toBe(100);
      // 90 ug/m3 -> 200 (Moderate boundary)
      expect(computeAqi({ pm25: 90 }, "india_naqi").aqi).toBe(200);
      // 120 ug/m3 -> 300 (Poor boundary)
      expect(computeAqi({ pm25: 120 }, "india_naqi").aqi).toBe(300);
      // 250 ug/m3 -> 400 (Very Poor boundary)
      expect(computeAqi({ pm25: 250 }, "india_naqi").aqi).toBe(400);
      // 380 ug/m3 -> 500 (Severe boundary)
      expect(computeAqi({ pm25: 380 }, "india_naqi").aqi).toBe(500);
    });

    it("clamps values exceeding maximum breakpoint scale to 500", () => {
      expect(computeAqi({ pm25: 800 }, "india_naqi").aqi).toBe(500);
      expect(computeAqi({ pm25: 1200 }, "india_naqi").category).toBe("severe");
    });

    it("handles zero and negative or NaN inputs safely", () => {
      expect(computeAqi({ pm25: -20 }, "india_naqi").aqi).toBe(0);
      expect(computeAqi({ pm25: NaN }, "india_naqi").aqi).toBe(0);
    });

    it("computes US EPA AQI breakpoints correctly", () => {
      expect(computeAqi({ pm25: 9.0 }, "us_aqi").aqi).toBe(50);
      expect(computeAqi({ pm25: 35.4 }, "us_aqi").aqi).toBe(100);
      expect(computeAqi({ pm25: 55.4 }, "us_aqi").aqi).toBe(150);
    });

    it("identifies dominant pollutant accurately", () => {
      const pm25Dominant = computeAqi({ pm25: 100, pm10: 50 }, "india_naqi");
      expect(pm25Dominant.dominantPollutant).toBe("PM2.5");

      const pm10Dominant = computeAqi({ pm25: 20, pm10: 200 }, "india_naqi");
      expect(pm10Dominant.dominantPollutant).toBe("PM10");
    });
  });

  describe("Property-based testing (fast-check)", () => {
    it("never produces an AQI below 0 or above 500", () => {
      fc.assert(
        fc.property(fc.float({ min: -50, max: 2000, noNaN: false }), (pm25) => {
          const res = computeAqi({ pm25 }, "india_naqi");
          expect(res.aqi).toBeGreaterThanOrEqual(0);
          expect(res.aqi).toBeLessThanOrEqual(500);
        }),
      );
    });

    it("is monotonic: higher concentrations never yield a lower AQI", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 500 }),
          fc.float({ min: 0, max: 500 }),
          (c1, c2) => {
            const low = Math.min(c1, c2);
            const high = Math.max(c1, c2);
            const aqiLow = computeAqi({ pm25: low }, "india_naqi").aqi;
            const aqiHigh = computeAqi({ pm25: high }, "india_naqi").aqi;
            expect(aqiHigh).toBeGreaterThanOrEqual(aqiLow);
          },
        ),
      );
    });
  });
});

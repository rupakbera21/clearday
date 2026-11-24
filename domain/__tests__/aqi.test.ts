import * as fc from "fast-check";
import { computeAqi, getCategoryAndToken } from "../aqi";

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
      expect(computeAqi({ pm25: 600 }, "us_aqi").aqi).toBe(500);
      expect(computeAqi({ pm25: 600 }, "us_aqi").category).toBe("severe");
    });

    it("handles zero and negative or NaN inputs safely", () => {
      expect(computeAqi({ pm25: -20 }, "india_naqi").aqi).toBe(0);
      expect(computeAqi({ pm25: NaN }, "india_naqi").aqi).toBe(0);
      expect(computeAqi({ pm25: Infinity }, "india_naqi").aqi).toBe(0);
    });

    it("computes US EPA AQI breakpoints correctly with 2024 revised standard", () => {
      // Good boundary (0.0 - 9.0)
      expect(computeAqi({ pm25: 9.0 }, "us_aqi").aqi).toBe(50);
      expect(computeAqi({ pm25: 9.0 }, "us_aqi").categoryLabel).toBe("Good");

      // Decimal resolution: 9.05 rounds to 9.1 per EPA AirNow guidance (Moderate, AQI 51)
      const res905 = computeAqi({ pm25: 9.05 }, "us_aqi");
      expect(res905.aqi).toBe(51);
      expect(res905.categoryLabel).toBe("Moderate");

      // Moderate boundary (9.1 - 35.4)
      expect(computeAqi({ pm25: 35.4 }, "us_aqi").aqi).toBe(100);
      expect(computeAqi({ pm25: 35.4 }, "us_aqi").categoryLabel).toBe("Moderate");

      // Unhealthy for Sensitive Groups boundary (35.5 - 55.4)
      expect(computeAqi({ pm25: 55.4 }, "us_aqi").aqi).toBe(150);
      expect(computeAqi({ pm25: 55.4 }, "us_aqi").categoryLabel).toBe("Unhealthy for Sensitive Groups");

      // Unhealthy boundary (55.5 - 125.4)
      expect(computeAqi({ pm25: 125.4 }, "us_aqi").aqi).toBe(200);
      expect(computeAqi({ pm25: 125.4 }, "us_aqi").categoryLabel).toBe("Unhealthy");

      // Very Unhealthy boundary (125.5 - 225.4)
      expect(computeAqi({ pm25: 225.4 }, "us_aqi").aqi).toBe(300);
      expect(computeAqi({ pm25: 225.4 }, "us_aqi").categoryLabel).toBe("Very Unhealthy");

      // Hazardous boundary (225.5 - 325.4)
      expect(computeAqi({ pm25: 325.4 }, "us_aqi").aqi).toBe(400);
      expect(computeAqi({ pm25: 325.4 }, "us_aqi").categoryLabel).toBe("Hazardous");

      // Decimal rounding near upper boundary: 325.44 rounds to 325.4 (AQI 400)
      expect(computeAqi({ pm25: 325.44 }, "us_aqi").aqi).toBe(400);

      // Top Hazardous boundary (325.5 - 500.4)
      expect(computeAqi({ pm25: 325.5 }, "us_aqi").aqi).toBe(401);
      expect(computeAqi({ pm25: 500.4 }, "us_aqi").aqi).toBe(500);
      expect(computeAqi({ pm25: 500.4 }, "us_aqi").categoryLabel).toBe("Hazardous");
    });

    it("identifies dominant pollutant accurately", () => {
      const pm25Dominant = computeAqi({ pm25: 100, pm10: 50 }, "india_naqi");
      expect(pm25Dominant.dominantPollutant).toBe("PM2.5");

      const pm10Dominant = computeAqi({ pm25: 20, pm10: 200 }, "india_naqi");
      expect(pm10Dominant.dominantPollutant).toBe("PM10");

      const pm10Only = computeAqi({ pm10: 150 }, "india_naqi");
      expect(pm10Only.dominantPollutant).toBe("PM10");
      expect(pm10Only.aqi).toBeGreaterThan(0);
    });

    it("derives category and label directly for AQI values", () => {
      expect(getCategoryAndToken(200, "india_naqi")).toEqual({
        category: "moderate",
        label: "Moderate",
        token: "aqi-moderate",
      });
      expect(getCategoryAndToken(300, "india_naqi")).toEqual({
        category: "poor",
        label: "Poor",
        token: "aqi-poor",
      });
      expect(getCategoryAndToken(200, "us_aqi")).toEqual({
        category: "poor",
        label: "Unhealthy",
        token: "aqi-poor",
      });
    });
  });

  describe("Property-based testing (fast-check)", () => {
    it("never produces an AQI below 0 or above 500", () => {
      fc.assert(
        fc.property(fc.float({ min: -50, max: 2000, noNaN: false }), (pm25) => {
          const resIndia = computeAqi({ pm25 }, "india_naqi");
          expect(resIndia.aqi).toBeGreaterThanOrEqual(0);
          expect(resIndia.aqi).toBeLessThanOrEqual(500);

          const resUs = computeAqi({ pm25 }, "us_aqi");
          expect(resUs.aqi).toBeGreaterThanOrEqual(0);
          expect(resUs.aqi).toBeLessThanOrEqual(500);
        }),
      );
    });

    it("is monotonic: higher concentrations never yield a lower AQI for India NAQI", () => {
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

    it("is monotonic: higher concentrations never yield a lower AQI for US EPA AQI", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 600 }),
          fc.float({ min: 0, max: 600 }),
          (c1, c2) => {
            const low = Math.min(c1, c2);
            const high = Math.max(c1, c2);
            const aqiLow = computeAqi({ pm25: low }, "us_aqi").aqi;
            const aqiHigh = computeAqi({ pm25: high }, "us_aqi").aqi;
            expect(aqiHigh).toBeGreaterThanOrEqual(aqiLow);
          },
        ),
      );
    });
  });
});

import { analyzeStagnation } from "../stagnation";

describe("domain/stagnation", () => {
  it("triggers severe stagnation under low wind, cold, and high humidity during smog", () => {
    const res = analyzeStagnation({
      windSpeedMps: 1.1,
      temperatureC: 9.5,
      relativeHumidityPercent: 85,
      pm25: 280,
      pm10: 360,
    });

    expect(res).not.toBeNull();
    expect(res!.stagnationSeverity).toBe("severe");
    expect(res!.sourceHint).toBe("combustion_smog");
    expect(res!.pmRatio).toBeGreaterThan(0.55);
  });

  it("detects crustal dust dominance when coarse fraction is high", () => {
    const res = analyzeStagnation({
      windSpeedMps: 4.5,
      temperatureC: 22,
      relativeHumidityPercent: 40,
      pm25: 45,
      pm10: 250,
    });

    expect(res).not.toBeNull();
    expect(res!.sourceHint).toBe("crustal_dust");
    expect(res!.pmRatio).toBeLessThan(0.35);
  });
});

import { findExposureWindows, getLocalHour, HourlyPoint } from "../windows";

describe("domain/windows", () => {
  const samplePoints: HourlyPoint[] = [
    { time: "2026-11-18T00:00:00Z", pm25: 280 },
    { time: "2026-11-18T01:00:00Z", pm25: 310 },
    { time: "2026-11-18T02:00:00Z", pm25: 340 },
    { time: "2026-11-18T03:00:00Z", pm25: 290 },
    { time: "2026-11-18T12:00:00Z", pm25: 45 },
    { time: "2026-11-18T13:00:00Z", pm25: 50 },
    { time: "2026-11-18T14:00:00Z", pm25: 55 },
    { time: "2026-11-18T20:00:00Z", pm25: 220 },
  ];

  it("finds lowest-exposure (best) and peak (worst) windows correctly", () => {
    const result = findExposureWindows(samplePoints, 2, "UTC");
    expect(result.bestWindow).not.toBeNull();
    expect(result.worstWindow).not.toBeNull();

    expect(result.bestWindow?.avgPm25).toBeLessThan(60);
    expect(result.worstWindow?.avgPm25).toBeGreaterThan(300);
  });

  it("handles timezone shifts correctly across Indian Standard Time and New York", () => {
    // 00:00:00 UTC = 05:30 in Asia/Kolkata (hour 5)
    const istHour = getLocalHour("2026-11-18T00:00:00Z", "Asia/Kolkata");
    expect(istHour).toBe(5);

    // 00:00:00 UTC = 19:00 on previous day in America/New_York (EST, UTC-5)
    const nyHour = getLocalHour("2026-11-18T00:00:00Z", "America/New_York");
    expect(nyHour).toBe(19);
  });

  it("handles month ends and year rollover cleanly", () => {
    const monthEndPoint = "2026-12-31T23:00:00Z";
    const hour = getLocalHour(monthEndPoint, "UTC");
    expect(hour).toBe(23);

    const istHour = getLocalHour(monthEndPoint, "Asia/Kolkata");
    expect(istHour).toBe(4); // 04:30 on 2027-01-01
  });

  it("handles empty or single point inputs safely", () => {
    const res = findExposureWindows([], 2);
    expect(res.bestWindow).toBeNull();
    expect(res.worstWindow).toBeNull();
  });
});

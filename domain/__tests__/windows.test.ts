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
    { time: "2026-11-18T15:00:00Z", pm25: 60 },
    { time: "2026-11-18T20:00:00Z", pm25: 220 },
  ];

  it("finds lowest-exposure (best) and peak (worst) windows correctly", () => {
    const result = findExposureWindows(samplePoints, 2, "UTC");
    expect(result.bestWindow).not.toBeNull();
    expect(result.worstWindow).not.toBeNull();

    expect(result.bestWindow?.avgPm25).toBeLessThan(60);
    expect(result.worstWindow?.avgPm25).toBeGreaterThan(300);
  });

  it("rejects non-consecutive readings (e.g. 6-hour or 9-hour gap)", () => {
    const gappedPoints: HourlyPoint[] = [
      { time: "2026-11-18T08:00:00Z", pm25: 40 },
      { time: "2026-11-18T14:00:00Z", pm25: 45 }, // 6-hour gap
    ];
    const res = findExposureWindows(gappedPoints, 2, "UTC");
    expect(res.bestWindow).toBeNull();
    expect(res.worstWindow).toBeNull();
  });

  it("handles offsetless local timestamps from Open-Meteo consistently on UTC servers", () => {
    // Open-Meteo returns timestamps like "2026-11-18T08:00" representing local time in Kolkata
    const kolkataLocalString = "2026-11-18T08:00";
    const hour = getLocalHour(kolkataLocalString, "Asia/Kolkata");
    expect(hour).toBe(8);

    // If string has Z (UTC), 08:00Z in Asia/Kolkata (+5:30) is 13:30 (hour 13)
    const utcString = "2026-11-18T08:00:00Z";
    expect(getLocalHour(utcString, "Asia/Kolkata")).toBe(13);
  });

  it("excludes elapsed windows when recommending what to do next", () => {
    const continuousDay: HourlyPoint[] = [
      { time: "2026-11-18T08:00:00Z", pm25: 20 }, // 08:00 - 10:00 avg: 22.5 (lowest)
      { time: "2026-11-18T09:00:00Z", pm25: 25 },
      { time: "2026-11-18T10:00:00Z", pm25: 80 },
      { time: "2026-11-18T14:00:00Z", pm25: 40 },
      { time: "2026-11-18T15:00:00Z", pm25: 45 }, // 14:00 - 16:00 avg: 42.5 (upcoming lowest)
      { time: "2026-11-18T16:00:00Z", pm25: 50 },
    ];
    // When current time is 12:00, the 08:00 window has already elapsed
    const res = findExposureWindows(continuousDay, 2, "UTC", "2026-11-18T12:00:00Z");
    expect(res.bestWindow?.startHour).toBe(14);
    expect(res.bestWindow?.avgPm25).toBe(42.5);
  });

  it("handles timezone shifts correctly across Indian Standard Time and New York", () => {
    // 00:00:00 UTC = 05:30 in Asia/Kolkata (hour 5)
    const istHour = getLocalHour("2026-11-18T00:00:00Z", "Asia/Kolkata");
    expect(istHour).toBe(5);

    // 00:00:00 UTC = 19:00 on previous day in America/New_York (EST, UTC-5)
    const nyHour = getLocalHour("2026-11-18T00:00:00Z", "America/New_York");
    expect(nyHour).toBe(19);
  });

  it("handles daylight saving transitions cleanly", () => {
    // Before DST fall back in New York (EDT, UTC-4): 2026-10-31 12:00 UTC = 08:00 EDT
    const edtHour = getLocalHour("2026-10-31T12:00:00Z", "America/New_York");
    expect(edtHour).toBe(8);

    // After DST fall back in New York (EST, UTC-5): 2026-11-05 12:00 UTC = 07:00 EST
    const estHour = getLocalHour("2026-11-05T12:00:00Z", "America/New_York");
    expect(estHour).toBe(7);
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

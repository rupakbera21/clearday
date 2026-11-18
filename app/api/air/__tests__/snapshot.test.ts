import { GET } from "../snapshot/route";
import * as airClient from "@/services/air/client";
import * as ratelimitService from "@/services/ratelimit";
import { StagnationAnalysisResult } from "@/domain/stagnation";
import { WindowFinderResult } from "@/domain/windows";

describe("GET /api/air/snapshot", () => {
  it("returns 200 with air snapshot and Cache-Control header", async () => {
    const airSpy = jest.spyOn(airClient, "getAirSnapshot").mockResolvedValueOnce({
      location: { latitude: 28.61, longitude: 77.2, timezone: "Asia/Kolkata" },
      current: {
        time: "2026-11-18T12:00:00Z",
        pm25: 180,
        pm10: 240,
        aqi: {
          aqi: 345,
          category: "very_poor",
          categoryLabel: "Very Poor",
          dominantPollutant: "PM2.5",
          standard: "india_naqi",
          colorToken: "aqi-very-poor",
        },
      },
      hourly: [],
      stagnation: {} as unknown as StagnationAnalysisResult,
      exposureWindows: {} as unknown as WindowFinderResult,
      riskBands: [],
      meta: {
        isStale: false,
        dataAgeMinutes: 2,
        dataSource: "live_fetch",
        attribution: "Open-Meteo",
      },
    });

    const req = new Request("http://localhost:3000/api/air/snapshot?lat=28.61&lon=77.20");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.current.aqi.category).toBe("very_poor");
    expect(res.headers.get("Cache-Control")).toContain("public");

    airSpy.mockRestore();
  });

  it("returns 400 on invalid or out-of-bounds coordinates", async () => {
    const req = new Request("http://localhost:3000/api/air/snapshot?lat=95&lon=77.20");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 502 with ladderFallback when upstream fails", async () => {
    const airSpy = jest
      .spyOn(airClient, "getAirSnapshot")
      .mockRejectedValueOnce(new Error("Network timeout"));

    const req = new Request("http://localhost:3000/api/air/snapshot?lat=28.61&lon=77.20");
    const res = await GET(req);

    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.ladderFallback).toBe("manual_entry_mode");

    airSpy.mockRestore();
  });

  it("returns 429 when rate limit is exceeded", async () => {
    const limitSpy = jest
      .spyOn(ratelimitService, "limitGeneral")
      .mockResolvedValueOnce({ success: false });

    const req = new Request("http://localhost:3000/api/air/snapshot?lat=28.61&lon=77.20");
    const res = await GET(req);
    expect(res.status).toBe(429);

    limitSpy.mockRestore();
  });
});

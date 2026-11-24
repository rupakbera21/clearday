import { POST } from "../manual/route";
import * as ratelimitService from "@/services/ratelimit";

describe("POST /api/air/manual", () => {
  it("creates a snapshot from manual PM2.5 reading without inventing PM10 or forecast", async () => {
    const payload = JSON.stringify({
      pm25: 180,
      standard: "india_naqi",
      cityName: "Lahore",
    });

    const req = new Request("http://localhost:3000/api/air/manual", {
      method: "POST",
      body: payload,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.current.pm25).toBe(180);
    expect(data.current.pm10).toBeUndefined();
    expect(data.current.aqi.isParticulateEstimate).toBe(true);
    expect(data.hourly).toEqual([]);
    expect(data.stagnation).toBeNull();
    expect(data.exposureWindows).toBeNull();
    expect(data.meta.dataSource).toBe("manual_entry");
    expect(data.meta.attribution).toContain("Lahore");
    expect(data.riskBands.length).toBe(6);
  });

  it("preserves exact entered AQI 200 without inventing pollutants or forecast (audit reproduction)", async () => {
    const payload = JSON.stringify({
      aqi: 200,
      standard: "india_naqi",
      cityName: "Delhi",
    });

    const req = new Request("http://localhost:3000/api/air/manual", {
      method: "POST",
      body: payload,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    // Must preserve exact entered AQI 200 and Moderate category (India NAQI 101-200 is Moderate)
    expect(data.current.aqi.aqi).toBe(200);
    expect(data.current.aqi.categoryLabel).toBe("Moderate");
    expect(data.current.pm25).toBeUndefined();
    expect(data.current.pm10).toBeUndefined();
    expect(data.hourly).toEqual([]);
    expect(data.stagnation).toBeNull();
    expect(data.exposureWindows).toBeNull();
    expect(data.meta.dataSource).toBe("manual_entry");
  });

  it("handles US AQI manual entry with correct category", async () => {
    const payload = JSON.stringify({
      aqi: 155,
      standard: "us_aqi",
      cityName: "Los Angeles",
    });

    const req = new Request("http://localhost:3000/api/air/manual", {
      method: "POST",
      body: payload,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.current.aqi.aqi).toBe(155);
    expect(data.current.aqi.categoryLabel).toBe("Unhealthy");
    expect(data.current.pm25).toBeUndefined();
  });

  it("returns 400 when body exceeds size limit or invalid JSON", async () => {
    const req = new Request("http://localhost:3000/api/air/manual", {
      method: "POST",
      body: "{invalid-json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    const limitSpy = jest
      .spyOn(ratelimitService, "limitGeneral")
      .mockResolvedValueOnce({ success: false });

    const req = new Request("http://localhost:3000/api/air/manual", {
      method: "POST",
      body: JSON.stringify({ pm25: 100 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);

    limitSpy.mockRestore();
  });
});

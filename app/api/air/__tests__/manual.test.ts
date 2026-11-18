import { POST } from "../manual/route";
import * as ratelimitService from "@/services/ratelimit";

describe("POST /api/air/manual", () => {
  it("creates a synthetic air snapshot from manual PM2.5 reading", async () => {
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
    expect(data.meta.dataSource).toBe("manual_entry");
    expect(data.meta.attribution).toContain("Lahore");
    expect(data.riskBands.length).toBe(6);
  });

  it("creates a snapshot from manual AQI reading", async () => {
    const payload = JSON.stringify({
      aqi: 350,
      standard: "india_naqi",
    });

    const req = new Request("http://localhost:3000/api/air/manual", {
      method: "POST",
      body: payload,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.current.pm25).toBe(210);
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

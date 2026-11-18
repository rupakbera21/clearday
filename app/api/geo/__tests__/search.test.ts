import { GET } from "../search/route";
import * as geoClient from "@/services/geo/client";
import * as ratelimitService from "@/services/ratelimit";

describe("GET /api/geo/search", () => {
  it("returns 200 with locations and Cache-Control header", async () => {
    const geoSpy = jest.spyOn(geoClient, "searchCities").mockResolvedValueOnce([
      {
        id: 1,
        name: "Delhi",
        country: "India",
        latitude: 28.65,
        longitude: 77.23,
        timezone: "Asia/Kolkata",
      },
    ]);

    const req = new Request("http://localhost:3000/api/geo/search?q=delhi");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Delhi");
    expect(res.headers.get("Cache-Control")).toContain("public");

    geoSpy.mockRestore();
  });

  it("returns 400 on empty or too short query", async () => {
    const req = new Request("http://localhost:3000/api/geo/search?q=x");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limit exceeded", async () => {
    const limitSpy = jest
      .spyOn(ratelimitService, "limitGeneral")
      .mockResolvedValueOnce({ success: false });

    const req = new Request("http://localhost:3000/api/geo/search?q=kolkata");
    const res = await GET(req);
    expect(res.status).toBe(429);

    limitSpy.mockRestore();
  });
});

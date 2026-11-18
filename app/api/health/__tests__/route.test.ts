import { GET } from "../route";
import * as ratelimitService from "@/services/ratelimit";
import * as httpService from "@/services/http";

describe("GET /api/health", () => {
  it("returns booleans and commit hash without leaking secrets", async () => {
    const req = new Request("http://localhost:3000/api/health", {
      headers: { "x-forwarded-for": "127.0.0.1" },
    });
    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(typeof data.geminiConfigured).toBe("boolean");
    expect(typeof data.groqConfigured).toBe("boolean");
    expect(typeof data.upstashReachable).toBe("boolean");
    expect(typeof data.openMeteoReachable).toBe("boolean");
    expect(typeof data.commit).toBe("string");
  });

  it("returns 429 when rate limit is exceeded", async () => {
    const limitSpy = jest
      .spyOn(ratelimitService, "limitGeneral")
      .mockResolvedValueOnce({ success: false });

    const req = new Request("http://localhost:3000/api/health");
    const response = await GET(req);

    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toBe("Too many requests");

    limitSpy.mockRestore();
  });

  it("checks Upstash reachability when configured", async () => {
    const origUrl = process.env.UPSTASH_REDIS_REST_URL;
    const origToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.UPSTASH_REDIS_REST_URL = "https://example-upstash.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

    const fetchSpy = jest.spyOn(httpService, "secureFetch").mockImplementation(async (url) => {
      if (url.includes("example-upstash")) {
        return new Response("OK", { status: 200 });
      }
      return new Response(JSON.stringify({ current: { pm2_5: 45 } }), { status: 200 });
    });

    const req = new Request("http://localhost:3000/api/health");
    const response = await GET(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.upstashReachable).toBe(true);
    expect(data.openMeteoReachable).toBe(true);

    fetchSpy.mockRestore();
    process.env.UPSTASH_REDIS_REST_URL = origUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = origToken;
  });
});

import { POST } from "../parse-household/route";
import { orchestrator } from "@/services/ai/orchestrator";
import * as ratelimitService from "@/services/ratelimit";

describe("POST /api/ai/parse-household", () => {
  it("returns 400 if text is missing or too short", async () => {
    const req = new Request("http://localhost:3000/api/ai/parse-household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "hi" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 200 with parsed profile when orchestrator succeeds", async () => {
    const orchSpy = jest.spyOn(orchestrator, "execute").mockResolvedValueOnce({
      data: {
        members: [
          { role: "self", ageBand: "adult", sensitiveCategory: "none" },
          { role: "child", ageBand: "child", sensitiveCategory: "none" },
        ],
        lifestyle: {
          commuteMode: "bicycle",
          commuteDistanceKm: 10,
          outdoorExerciseHours: 1,
          cookingFuel: "lpg",
        },
        home: {
          homeType: "apartment",
          airPurifierCount: 1,
          hasAc: true,
          windowQuality: "standard",
        },
      },
      serviceTier: "primary",
      providerUsed: "gemini",
      cached: false,
    });

    const req = new Request("http://localhost:3000/api/ai/parse-household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Two of us, one kid, I cycle 10km to work, 1 purifier" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.members.length).toBe(2);
    expect(body.serviceTier).toBe("primary");

    orchSpy.mockRestore();
  });

  it("returns 429 when rate limit is exceeded", async () => {
    const rateSpy = jest.spyOn(ratelimitService, "limitGeneration").mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const req = new Request("http://localhost:3000/api/ai/parse-household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Household description text here" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    rateSpy.mockRestore();
  });
});

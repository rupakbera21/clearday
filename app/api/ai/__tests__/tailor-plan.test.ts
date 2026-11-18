import { POST } from "../tailor-plan/route";
import { orchestrator } from "@/services/ai/orchestrator";
import { HouseholdProfile, TailoredPlan } from "@/schemas/ai";

describe("POST /api/ai/tailor-plan", () => {
  const validProfile: HouseholdProfile = {
    members: [
      { id: "mem_1", ageBand: "adult", hasSensitiveCondition: false, conditionCategory: "none" },
    ],
    homeType: "apartment",
    hasAirPurifier: false,
    purifierType: "none",
    cookingFuel: "lpg",
    heatingMethod: "none",
    commuteMode: "metro",
    commuteDistanceKm: 10,
    budgetTier: "medium",
  };

  it("returns 400 when profile is missing or invalid", async () => {
    const req = new Request("http://localhost:3000/api/ai/tailor-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: { members: [] } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 with tailored plan when orchestrator succeeds", async () => {
    const mockPlan: TailoredPlan = {
      headline: "Low-Exposure Day Plan",
      summary: "Plan for moderate day",
      timeBlocks: [
        {
          timeRange: "06:00 - 08:00",
          activity: "Morning Routine",
          microenvironment: "indoors_standard",
          actionAdvice: "Keep windows shut",
          reason: "Avoid morning peak",
          citedFactIds: [],
          citedKnowledgeIds: [],
        },
      ],
      isRuleBased: false,
      serviceTier: "primary",
    };

    const orchSpy = jest.spyOn(orchestrator, "execute").mockResolvedValueOnce({
      data: mockPlan,
      serviceTier: "primary",
      providerUsed: "gemini",
      cached: false,
    });

    const req = new Request("http://localhost:3000/api/ai/tailor-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: validProfile,
        windows: null,
        riskBands: [],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.timeBlocks.length).toBe(1);
    expect(body.data.headline).toBe("Low-Exposure Day Plan");
    orchSpy.mockRestore();
  });

  it("returns rule-based fallback when orchestrator fails", async () => {
    const orchSpy = jest.spyOn(orchestrator, "execute").mockRejectedValueOnce(new Error("AI Crash"));

    const req = new Request("http://localhost:3000/api/ai/tailor-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: validProfile,
        windows: null,
        riskBands: [],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.serviceTier).toBe("rule_based");
    expect(body.data.timeBlocks.length).toBeGreaterThan(0);
    orchSpy.mockRestore();
  });
});

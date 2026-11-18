import { POST } from "../ask/route";
import { orchestrator } from "@/services/ai/orchestrator";

describe("POST /api/ai/ask", () => {
  const baseQuery = {
    currentAqi: 280,
    currentPm25: 160,
  };

  it("returns 400 when question is too short or invalid", async () => {
    const req = new Request("http://localhost:3000/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...baseQuery, question: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("intercepts acute symptoms and returns emergency advisory without calling AI", async () => {
    const orchSpy = jest.spyOn(orchestrator, "execute");

    const req = new Request("http://localhost:3000/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...baseQuery,
        question: "My mother has severe chest pain and cannot breathe",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.citedKnowledgeIds).toContain("kb_symptoms_urgent_care");
    expect(body.data.safetyNotice).toContain("Emergency advisory");
    expect(body.serviceTier).toBe("rule_based");
    expect(orchSpy).not.toHaveBeenCalled();

    orchSpy.mockRestore();
  });

  it("returns 200 with grounded answer when orchestrator succeeds", async () => {
    const orchSpy = jest.spyOn(orchestrator, "execute").mockResolvedValueOnce({
      data: {
        answer: "N95 masks filter at least 95% of airborne particles when properly fitted.",
        citedKnowledgeIds: ["core_masks_types"],
        actionableTakeaways: ["Ensure tight nose clip seal"],
        safetyNotice: "Informational guidance only.",
        isRuleBased: false,
        serviceTier: "primary",
      },
      serviceTier: "primary",
      providerUsed: "gemini",
      cached: false,
    });

    const req = new Request("http://localhost:3000/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...baseQuery,
        question: "Are cloth masks effective against smog?",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.citedKnowledgeIds).toContain("core_masks_types");
    expect(body.serviceTier).toBe("primary");

    orchSpy.mockRestore();
  });

  it("returns fallback answer when orchestrator fails", async () => {
    const orchSpy = jest.spyOn(orchestrator, "execute").mockRejectedValueOnce(new Error("AI Down"));

    const req = new Request("http://localhost:3000/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...baseQuery,
        question: "Should I run my air purifier all night?",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.serviceTier).toBe("rule_based");
    expect(body.data.safetyNotice).toBeDefined();

    orchSpy.mockRestore();
  });
});

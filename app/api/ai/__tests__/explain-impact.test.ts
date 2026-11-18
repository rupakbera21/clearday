import { POST } from "../explain-impact/route";
import { orchestrator } from "@/services/ai/orchestrator";
import { ImpactExplanation } from "@/schemas/ai";

describe("POST /api/ai/explain-impact", () => {
  const sampleFacts = {
    fact_baseline_inhaled: { id: "fact_baseline_inhaled", value: 350, label: "Baseline Inhaled (ug)" },
    fact_chosen_inhaled: { id: "fact_chosen_inhaled", value: 120, label: "Chosen Inhaled (ug)" },
    fact_reduction_pct: { id: "fact_reduction_pct", value: 65, label: "Reduction (%)" },
    fact_emissions_avoided: { id: "fact_emissions_avoided", value: 200, label: "Emissions Avoided (g)" },
  };

  it("returns 400 when facts are missing", async () => {
    const req = new Request("http://localhost:3000/api/ai/explain-impact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 with impact explanation when orchestrator succeeds", async () => {
    const mockExplanation: ImpactExplanation = {
      narrative: "Your daily exposure drops from 350 to 120 (a 65% reduction), avoiding 200 g CO2e.",
      baselineInhaledUg: 350,
      chosenInhaledUg: 120,
      reductionPercentage: 65,
      emissionsAvoidedGrams: 200,
      citedFactIds: [
        "fact_baseline_inhaled",
        "fact_chosen_inhaled",
        "fact_reduction_pct",
        "fact_emissions_avoided",
      ],
      isRuleBased: false,
      serviceTier: "primary",
    };

    const orchSpy = jest.spyOn(orchestrator, "execute").mockResolvedValueOnce({
      data: mockExplanation,
      serviceTier: "primary",
      providerUsed: "gemini",
      cached: false,
    });

    const req = new Request("http://localhost:3000/api/ai/explain-impact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facts: sampleFacts }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.citedFactIds.length).toBe(4);
    expect(body.data.narrative).toContain("350");
    orchSpy.mockRestore();
  });

  it("returns template fallback when orchestrator fails", async () => {
    const orchSpy = jest.spyOn(orchestrator, "execute").mockRejectedValueOnce(new Error("AI down"));

    const req = new Request("http://localhost:3000/api/ai/explain-impact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facts: sampleFacts }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.serviceTier).toBe("rule_based");
    expect(body.data.narrative).toBeDefined();
    orchSpy.mockRestore();
  });
});

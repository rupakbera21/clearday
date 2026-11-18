import { assessGroupRisk, assessAllGroups } from "../risk";

describe("domain/risk", () => {
  it("returns low risk across groups for good air quality", () => {
    const assessment = assessGroupRisk("children", "good");
    expect(assessment.riskLevel).toBe("low");
    expect(assessment.actionRequired).toContain("outdoor play");
  });

  it("escalates asthma/COPD risk to hazardous in severe category", () => {
    const assessment = assessGroupRisk("asthma_copd", "severe");
    expect(assessment.riskLevel).toBe("hazardous");
    expect(assessment.advisoryText).toContain("Life-threatening");
  });

  it("assesses all 6 vulnerable groups", () => {
    const all = assessAllGroups("very_poor");
    expect(all).toHaveLength(6);
    expect(all.every((item) => item.source.includes("WHO"))).toBe(true);
  });
});

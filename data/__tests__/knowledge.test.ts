import {
  ALL_KNOWLEDGE_ITEMS,
  selectKnowledgeItems,
  KNOWLEDGE_TOPICS,
  KNOWLEDGE_AUDIENCES,
} from "../knowledge";

describe("data/knowledge", () => {
  it("contains between 30 and 60 vetted guidance items", () => {
    expect(ALL_KNOWLEDGE_ITEMS.length).toBeGreaterThanOrEqual(30);
    expect(ALL_KNOWLEDGE_ITEMS.length).toBeLessThanOrEqual(60);
  });

  it("enforces no duplicate ids and valid fields across all items", () => {
    const ids = new Set<string>();
    const validTopics = new Set<string>(KNOWLEDGE_TOPICS);
    const validAudiences = new Set<string>(KNOWLEDGE_AUDIENCES);

    for (const item of ALL_KNOWLEDGE_ITEMS) {
      expect(ids.has(item.id)).toBe(false);
      ids.add(item.id);

      expect(validTopics.has(item.topic)).toBe(true);
      expect(item.audience.length).toBeGreaterThan(0);
      for (const aud of item.audience) {
        expect(validAudiences.has(aud)).toBe(true);
      }

      expect(item.title.length).toBeGreaterThan(5);
      expect(item.guidance.length).toBeGreaterThan(20);
      expect(["high", "medium", "low"]).toContain(item.evidenceStrength);
      expect(item.caveats.length).toBeGreaterThan(10);
      expect(item.sourceUrl.startsWith("https://")).toBe(true);
      expect(item.year).toBeGreaterThanOrEqual(2010);
      // Valid YYYY-MM-DD format
      expect(/^\d{4}-\d{2}-\d{2}$/.test(item.lastReviewed)).toBe(true);
    }
  });

  it("selects top k items deterministically using audience and keywords", () => {
    const selected = selectKnowledgeItems({
      topics: ["masks"],
      audiences: ["children"],
      keywords: ["respirator", "pediatric"],
      limit: 3,
    });

    expect(selected.length).toBeLessThanOrEqual(3);
    expect(selected[0]?.id).toBe("kb_mask_children");

    // Deterministic selection returns identical order on repeated calls
    const repeated = selectKnowledgeItems({
      topics: ["masks"],
      audiences: ["children"],
      keywords: ["respirator", "pediatric"],
      limit: 3,
    });
    expect(selected.map((s) => s.id)).toEqual(repeated.map((s) => s.id));
  });
});

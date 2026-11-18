import { matchIndianCities, INDIAN_CITIES_CATALOG } from "../indian-cities";

describe("data/indian-cities", () => {
  it("contains pre-seeded catalog of major Indian cities", () => {
    expect(INDIAN_CITIES_CATALOG.length).toBeGreaterThan(30);
    const delhi = INDIAN_CITIES_CATALOG.find((c) => c.name === "Delhi");
    expect(delhi).toBeDefined();
    expect(delhi?.country).toBe("India");
    expect(delhi?.timezone).toBe("Asia/Kolkata");
  });

  it("returns empty array when query is empty or whitespace", () => {
    expect(matchIndianCities("")).toEqual([]);
    expect(matchIndianCities("   ")).toEqual([]);
  });

  it("matches cities by prefix and clamps to default limit of 5", () => {
    const results = matchIndianCities("m");
    expect(results.length).toBeLessThanOrEqual(5);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name.toLowerCase().startsWith("m")).toBe(true);
  });

  it("matches cities by substring or state name", () => {
    const results = matchIndianCities("pun");
    expect(results.length).toBeGreaterThan(0);
    const hasPuneOrPunjab = results.some(
      (c) => c.name.toLowerCase().includes("pun") || (c.admin1 ?? "").toLowerCase().includes("pun"),
    );
    expect(hasPuneOrPunjab).toBe(true);
  });

  it("respects custom limit", () => {
    const results = matchIndianCities("d", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });
});

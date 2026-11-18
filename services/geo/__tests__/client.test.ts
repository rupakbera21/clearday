import { searchCities } from "../client";
import * as httpService from "../../http";
import geoFixture from "@/tests/fixtures/open-meteo-geo.json";

describe("services/geo/client", () => {
  it("returns parsed and rounded city locations", async () => {
    const fetchSpy = jest.spyOn(httpService, "secureFetch").mockResolvedValueOnce(
      new Response(JSON.stringify(geoFixture), { status: 200 }),
    );

    const results = await searchCities("delhi");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toBe("Delhi");
    expect(results[0]?.latitude).toBe(28.65);
    expect(results[0]?.longitude).toBe(77.23);
    expect(results[0]?.timezone).toBe("Asia/Kolkata");

    fetchSpy.mockRestore();
  });

  it("returns cached result without redundant network call", async () => {
    const fetchSpy = jest.spyOn(httpService, "secureFetch");

    const cachedResults = await searchCities("delhi");
    expect(cachedResults[0]?.name).toBe("Delhi");
    // fetchSpy not called because it hit cache
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("returns empty array on queries shorter than 2 characters", async () => {
    const res = await searchCities("a");
    expect(res).toEqual([]);
  });
});

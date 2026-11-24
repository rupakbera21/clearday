import { getAirSnapshot, createManualAirSnapshot } from "../client";
import * as httpService from "../../http";
import airFixture from "@/tests/fixtures/open-meteo-air.json";

describe("services/air/client", () => {
  it("fetches and parses air snapshot with computed AQI and stagnation", async () => {
    const fetchSpy = jest.spyOn(httpService, "secureFetch").mockImplementation(async (url) => {
      if (url.includes("air-quality")) {
        return new Response(JSON.stringify(airFixture), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          current: { wind_speed_10m: 1.2, temperature_2m: 11.5, relative_humidity_2m: 82 },
        }),
        { status: 200 },
      );
    });

    const snapshot = await getAirSnapshot(28.61, 77.20, "india_naqi");

    expect(snapshot.location.latitude).toBe(28.625);
    expect(snapshot.current.pm25).toBe(245.5);
    expect(snapshot.current.aqi.category).toBe("very_poor");
    expect(snapshot.stagnation?.stagnationSeverity).toBe("severe");
    expect(snapshot.exposureWindows?.bestWindow).not.toBeNull();
    expect(snapshot.riskBands.length).toBe(6);

    fetchSpy.mockRestore();
  });

  it("creates valid manual snapshot preserving exact reading without inventing forecast", () => {
    const manual = createManualAirSnapshot({ pm25: 320, standard: "india_naqi", cityName: "Patna" });

    expect(manual.current.pm25).toBe(320);
    expect(manual.current.aqi.category).toBe("severe");
    expect(manual.meta.dataSource).toBe("manual_entry");
    expect(manual.meta.attribution).toContain("Patna");
    expect(manual.hourly).toEqual([]);
    expect(manual.exposureWindows).toBeNull();
    expect(manual.stagnation).toBeNull();
  });

  it("passes timezone to Open-Meteo and handles missing weather data safely", async () => {
    let capturedAirUrl = "";
    let capturedWeatherUrl = "";

    const fetchSpy = jest.spyOn(httpService, "secureFetch").mockImplementation(async (url) => {
      if (url.includes("air-quality")) {
        capturedAirUrl = url;
        return new Response(JSON.stringify(airFixture), { status: 200 });
      }
      capturedWeatherUrl = url;
      // Simulate weather endpoint 503 or empty
      return new Response(JSON.stringify({}), { status: 503 });
    });

    const snapshot = await getAirSnapshot(22.57, 88.36, "india_naqi", "Asia/Kolkata");

    expect(capturedAirUrl).toContain("timezone=Asia%2FKolkata");
    expect(capturedWeatherUrl).toContain("wind_speed_unit=ms");
    expect(capturedWeatherUrl).toContain("timezone=Asia%2FKolkata");
    // With weather missing, stagnation returns clean caveat instead of failing
    expect(snapshot.stagnation?.summaryCaveat).toBeDefined();

    fetchSpy.mockRestore();
  });
});

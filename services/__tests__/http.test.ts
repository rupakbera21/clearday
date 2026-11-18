import { validateCoordinates, secureFetch, readCappedJson, HttpError } from "../http";

describe("http service", () => {
  describe("validateCoordinates", () => {
    it("accepts valid coordinates", () => {
      expect(() => validateCoordinates(28.61, 77.2)).not.toThrow();
      expect(() => validateCoordinates(-90, 180)).not.toThrow();
      expect(() => validateCoordinates(90, -180)).not.toThrow();
    });

    it("rejects out of bounds coordinates", () => {
      expect(() => validateCoordinates(91, 0)).toThrow(HttpError);
      expect(() => validateCoordinates(-91, 0)).toThrow(HttpError);
      expect(() => validateCoordinates(0, 181)).toThrow(HttpError);
      expect(() => validateCoordinates(0, -181)).toThrow(HttpError);
      expect(() => validateCoordinates(NaN, 0)).toThrow(HttpError);
    });
  });

  describe("secureFetch SSRF Protection & Behavior", () => {
    it("rejects hosts not in allowlist", async () => {
      await expect(
        secureFetch("https://malicious-internal-service.local/leak"),
      ).rejects.toThrow("is not allowed");
    });

    it("enforces timeout properly", async () => {
      const abortError = new Error("AbortError");
      abortError.name = "AbortError";
      const fetchSpy = jest.spyOn(globalThis, "fetch").mockRejectedValueOnce(abortError);

      await expect(
        secureFetch("https://air-quality-api.open-meteo.com/v1/air-quality", { timeoutMs: 50 }),
      ).rejects.toThrow("Request timed out");

      fetchSpy.mockRestore();
    });

    it("rejects responses exceeding max size limit", async () => {
      const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("Large content", {
          headers: { "content-length": "10000000" },
        }),
      );

      await expect(
        secureFetch("https://air-quality-api.open-meteo.com/v1/air-quality", { maxSizeBytes: 100 }),
      ).rejects.toThrow("Response exceeded maximum size limit");

      fetchSpy.mockRestore();
    });
  });

  describe("readCappedJson", () => {
    it("reads valid json within limit", async () => {
      const payload = JSON.stringify({ name: "Delhi", aqi: 350 });
      const req = new Request("https://example.com", {
        method: "POST",
        body: payload,
      });

      const data = await readCappedJson<{ name: string; aqi: number }>(req);
      expect(data.name).toBe("Delhi");
      expect(data.aqi).toBe(350);
    });

    it("rejects bodies exceeding byte cap", async () => {
      const hugeString = "x".repeat(200);
      const payload = JSON.stringify({ data: hugeString });
      const req = new Request("https://example.com", {
        method: "POST",
        body: payload,
      });

      await expect(readCappedJson(req, 100)).rejects.toThrow(HttpError);
    });

    it("rejects invalid json format", async () => {
      const req = new Request("https://example.com", {
        method: "POST",
        body: "{not-valid-json",
      });

      await expect(readCappedJson(req, 1000)).rejects.toThrow("Invalid JSON in request body");
    });

    it("rejects empty body", async () => {
      const req = {
        body: null,
      } as unknown as Request;

      await expect(readCappedJson(req)).rejects.toThrow("Empty request body");
    });
  });
});

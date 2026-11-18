import { env } from "../env";

describe("env service", () => {
  it("provides valid environment defaults", () => {
    expect(env).toBeDefined();
    expect(env.GEMINI_MODEL).toBe("gemini-2.5-flash");
    expect(env.GROQ_MODEL).toBe("qwen/qwen3.8-27b");
    expect(typeof env.GEMINI_API_KEY).toBe("string");
    expect(typeof env.GROQ_API_KEY).toBe("string");
  });

  it("handles environment variables with surrounding quotes correctly", () => {
    const origKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = '"test-quoted-key"';
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const reloaded = require("../env");
    expect(reloaded.env.GEMINI_API_KEY).toBe("test-quoted-key");

    process.env.GEMINI_API_KEY = "'single-quoted-key'";
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const reloaded2 = require("../env");
    expect(reloaded2.env.GEMINI_API_KEY).toBe("single-quoted-key");

    process.env.GEMINI_API_KEY = origKey;
  });

  it("handles empty or invalid env cases", () => {
    process.env.UPSTASH_REDIS_REST_URL = "not-a-valid-url";
    jest.resetModules();
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../env");
    }).toThrow("Environment validation failed");
    delete process.env.UPSTASH_REDIS_REST_URL;
  });
});

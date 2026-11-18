import {
  isProviderTripped,
  recordProviderFailure,
  recordProviderSuccess,
} from "../circuit-breaker";

describe("services/ai/circuit-breaker", () => {
  beforeEach(async () => {
    await recordProviderSuccess("gemini");
    await recordProviderSuccess("groq");
  });

  it("trips circuit immediately on fatal quota or auth error", async () => {
    expect(await isProviderTripped("gemini")).toBe(false);

    await recordProviderFailure("gemini", true); // immediate trip
    expect(await isProviderTripped("gemini")).toBe(true);

    await recordProviderSuccess("gemini");
    expect(await isProviderTripped("gemini")).toBe(false);
  });

  it("trips circuit after 2 consecutive non-fatal failures", async () => {
    await recordProviderFailure("groq", false);
    expect(await isProviderTripped("groq")).toBe(false);

    await recordProviderFailure("groq", false);
    expect(await isProviderTripped("groq")).toBe(true);

    await recordProviderSuccess("groq");
    expect(await isProviderTripped("groq")).toBe(false);
  });
});

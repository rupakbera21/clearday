import { limitGeneral, limitGeneration } from "../ratelimit";

describe("ratelimit service", () => {
  it("allows requests under the rate limit in memory store", async () => {
    const res = await limitGeneral("test-client-1");
    expect(res.success).toBe(true);
  });

  it("limits requests exceeding sliding window threshold in memory fallback", async () => {
    const clientId = "burst-client";
    // Generation limit is 10 requests per minute
    for (let i = 0; i < 10; i++) {
      await limitGeneration(clientId);
    }
    const eleventh = await limitGeneration(clientId);
    expect(eleventh.success).toBe(false);
  });

  it("tests general limiter threshold in memory fallback", async () => {
    const clientId = "burst-general";
    for (let i = 0; i < 60; i++) {
      await limitGeneral(clientId);
    }
    const sixtyFirst = await limitGeneral(clientId);
    expect(sixtyFirst.success).toBe(false);
  });
});

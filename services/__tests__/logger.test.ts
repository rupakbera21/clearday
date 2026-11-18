import { logger } from "../logger";

describe("logger service", () => {
  it("redacts sensitive fields like coordinates, health, and prompts", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

    logger.error("Test error", {
      latitude: 28.61,
      longitude: 77.20,
      health: "asthma",
      prompt: "secret instruction",
      safeKey: "public-val",
    });

    expect(errorSpy).toHaveBeenCalled();
    const loggedOutput = errorSpy.mock.calls[0]![0];
    const parsed = JSON.parse(loggedOutput);

    expect(parsed.context.latitude).toBe("[REDACTED]");
    expect(parsed.context.longitude).toBe("[REDACTED]");
    expect(parsed.context.health).toBe("[REDACTED]");
    expect(parsed.context.prompt).toBe("[REDACTED]");
    expect(parsed.context.safeKey).toBe("public-val");

    logger.info("Test info", { apiKey: "secret-key" });
    const infoOutput = infoSpy.mock.calls[0]![0];
    expect(JSON.parse(infoOutput).context.apiKey).toBe("[REDACTED]");

    errorSpy.mockRestore();
    infoSpy.mockRestore();
  });
});

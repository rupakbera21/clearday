import { z } from "zod";
import { AIOrchestrator } from "../orchestrator";
import { LLMProvider } from "../types";
import { ProviderError } from "../gemini";
import { resetAllBreakers } from "../circuit-breaker";

class FakeProvider implements LLMProvider {
  public callCount = 0;
  constructor(
    public name: "gemini" | "groq",
    private behavior: (prompt: string) => Promise<string>,
  ) {}

  async generate(prompt: string): Promise<string> {
    this.callCount++;
    return this.behavior(prompt);
  }
}

const testSchema = z.object({
  answer: z.string(),
  count: z.number(),
});

describe("AIOrchestrator", () => {
  beforeEach(() => {
    resetAllBreakers();
  });
  it("uses primary provider (Gemini) when it succeeds", async () => {
    const fakeGemini = new FakeProvider("gemini", async () =>
      JSON.stringify({ answer: "Gemini succeeded", count: 1 }),
    );
    const fakeGroq = new FakeProvider("groq", async () =>
      JSON.stringify({ answer: "Groq succeeded", count: 2 }),
    );

    const orchestrator = new AIOrchestrator(fakeGemini, fakeGroq);
    const res = await orchestrator.execute({
      taskName: "test",
      schema: testSchema,
      prompt: "test",
      fallbackGenerator: () => ({ answer: "Rule-based", count: 0 }),
    });

    expect(res.serviceTier).toBe("primary");
    expect(res.providerUsed).toBe("gemini");
    expect(res.data.answer).toBe("Gemini succeeded");
    expect(fakeGemini.callCount).toBe(1);
    expect(fakeGroq.callCount).toBe(0);
  });

  it("falls through immediately to Groq on quota or 404 without retries", async () => {
    const fakeGemini = new FakeProvider("gemini", async () => {
      throw new ProviderError("Quota exceeded 429", 429, true);
    });
    const fakeGroq = new FakeProvider("groq", async () =>
      JSON.stringify({ answer: "Groq backup answered", count: 5 }),
    );

    const orchestrator = new AIOrchestrator(fakeGemini, fakeGroq);
    const res = await orchestrator.execute({
      taskName: "test",
      schema: testSchema,
      prompt: "test",
      fallbackGenerator: () => ({ answer: "Rule-based", count: 0 }),
    });

    expect(res.serviceTier).toBe("backup");
    expect(res.providerUsed).toBe("groq");
    expect(res.data.answer).toBe("Groq backup answered");
    // Gemini was only called once because isImmediateFallthrough = true
    expect(fakeGemini.callCount).toBe(1);
    expect(fakeGroq.callCount).toBe(1);
  });

  it("returns labelled rule-based fallback when both providers fail", async () => {
    const fakeGemini = new FakeProvider("gemini", async () => {
      throw new ProviderError("Gemini down", 500, true);
    });
    const fakeGroq = new FakeProvider("groq", async () => {
      throw new ProviderError("Groq down", 500, true);
    });

    const orchestrator = new AIOrchestrator(fakeGemini, fakeGroq);
    const res = await orchestrator.execute({
      taskName: "test",
      schema: testSchema,
      prompt: "test",
      fallbackGenerator: () => ({ answer: "Rule-based fallback", count: 42 }),
    });

    expect(res.serviceTier).toBe("rule_based");
    expect(res.providerUsed).toBe("rule_based");
    expect(res.data.answer).toBe("Rule-based fallback");
    expect(res.data.count).toBe(42);
  });

  it("returns cached result when identical inputs are executed", async () => {
    const fakeGemini = new FakeProvider("gemini", async () =>
      JSON.stringify({ answer: "Cache test", count: 10 }),
    );
    const fakeGroq = new FakeProvider("groq", async () =>
      JSON.stringify({ answer: "Groq", count: 0 }),
    );

    const orchestrator = new AIOrchestrator(fakeGemini, fakeGroq);
    const first = await orchestrator.execute({
      taskName: "test",
      schema: testSchema,
      prompt: "test-cache",
      cacheKeyData: { q: "test" },
      fallbackGenerator: () => ({ answer: "Fallback", count: 0 }),
    });

    const second = await orchestrator.execute({
      taskName: "test",
      schema: testSchema,
      prompt: "test-cache",
      cacheKeyData: { q: "test" },
      fallbackGenerator: () => ({ answer: "Fallback", count: 0 }),
    });

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(fakeGemini.callCount).toBe(1); // Not called a second time
  });
});

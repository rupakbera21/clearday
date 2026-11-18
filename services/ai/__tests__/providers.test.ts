import { GoogleGenAI } from "@google/genai";
import { GeminiProvider } from "../gemini";
import { GroqProvider } from "../groq";
import * as httpService from "@/services/http";

describe("GeminiProvider", () => {
  it("throws 401 when API key is missing", async () => {
    const origKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const provider = new GeminiProvider("");
    await expect(provider.generate("test prompt")).rejects.toThrow(
      "Gemini API key is not configured",
    );

    process.env.GEMINI_API_KEY = origKey;
  });

  it("successfully calls GoogleGenAI client and returns text", async () => {
    const provider = new GeminiProvider("dummy-key");
    // Mock the internal client generateContent
    // @ts-expect-error accessing private client for unit test
    provider.client = {
      models: {
        generateContent: jest.fn().mockResolvedValue({ text: '{"result":"success"}' }),
      },
    } as unknown as GoogleGenAI;

    const res = await provider.generate("test prompt", { jsonMode: true });
    expect(res).toBe('{"result":"success"}');
  });

  it("flags quota / 404 errors as immediate fallthrough", async () => {
    const provider = new GeminiProvider("dummy-key");
    const quotaErr = Object.assign(new Error("RESOURCE_EXHAUSTED quota exceeded"), { status: 429 });
    // @ts-expect-error accessing private client for unit test
    provider.client = {
      models: {
        generateContent: jest.fn().mockRejectedValue(quotaErr),
      },
    } as unknown as GoogleGenAI;

    await expect(provider.generate("test prompt")).rejects.toMatchObject({
      isImmediateFallthrough: true,
    });
  });

  it("throws on empty response", async () => {
    const provider = new GeminiProvider("dummy-key");
    // @ts-expect-error accessing private client for unit test
    provider.client = {
      models: {
        generateContent: jest.fn().mockResolvedValue({ text: null }),
      },
    } as unknown as GoogleGenAI;

    await expect(provider.generate("test prompt")).rejects.toThrow(
      "Empty response returned from Gemini",
    );
  });
});

describe("GroqProvider", () => {
  it("throws 401 when API key is missing", async () => {
    const origKey = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;

    const provider = new GroqProvider("");
    await expect(provider.generate("test prompt")).rejects.toThrow(
      "Groq API key is not configured",
    );

    process.env.GROQ_API_KEY = origKey;
  });

  it("successfully calls secureFetch and returns message content", async () => {
    const fetchSpy = jest.spyOn(httpService, "secureFetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: '{"answer":"groq_ok"}' } }],
      }),
    } as unknown as Response);

    const provider = new GroqProvider("dummy-key");
    const res = await provider.generate("test prompt", { jsonMode: true });
    expect(res).toBe('{"answer":"groq_ok"}');

    fetchSpy.mockRestore();
  });

  it("flags quota and 401 errors as immediate fallthrough", async () => {
    const fetchSpy = jest.spyOn(httpService, "secureFetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Invalid API key or quota exceeded",
    } as unknown as Response);

    const provider = new GroqProvider("dummy-key");
    await expect(provider.generate("test prompt")).rejects.toMatchObject({
      isImmediateFallthrough: true,
    });

    fetchSpy.mockRestore();
  });

  it("throws ProviderError on empty response choices", async () => {
    const fetchSpy = jest.spyOn(httpService, "secureFetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [] }),
    } as unknown as Response);

    const provider = new GroqProvider("dummy-key");
    await expect(provider.generate("test prompt")).rejects.toThrow(
      "Empty response returned from Groq",
    );

    fetchSpy.mockRestore();
  });
});

/**
 * @file concurrency.test.ts
 * @description Concurrency stress test firing 50 concurrent requests through AIOrchestrator.
 * Addresses problem-statement: Section 9 Efficiency, concurrency cap, in-flight map drain, LRU bound and bounded heap.
 */

import { z } from "zod";
import { AIOrchestrator } from "../orchestrator";
import { LLMProvider } from "../types";

describe("Phase 7: AI Orchestrator Concurrency & In-Flight Map Drain", () => {
  const testSchema = z.object({
    result: z.string(),
    count: z.number(),
  });

  it("coalesces 50 concurrent identical requests down to exactly 1 upstream call and drains in-flight map", async () => {
    let callCount = 0;

    const slowProvider: LLMProvider = {
      name: "gemini",
      generate: jest.fn(async () => {
        callCount++;
        // Simulate 40ms upstream inference latency
        await new Promise((r) => setTimeout(r, 40));
        return JSON.stringify({ result: "coalesced_success", count: 42 });
      }),
    };

    const orchestrator = new AIOrchestrator(slowProvider, slowProvider);

    // Fire 50 concurrent requests with identical cacheKeyData
    const requests = Array.from({ length: 50 }, (_, i) =>
      orchestrator.execute({
        taskName: "coalesce_stress",
        schema: testSchema,
        prompt: `identical_prompt_${i}`,
        fallbackGenerator: () => ({ result: "fallback", count: 0 }),
        cacheKeyData: { query: "identical_household_query" },
      }),
    );

    const results = await Promise.all(requests);

    // Assert: Exactly 1 upstream call made despite 50 concurrent requests
    expect(callCount).toBe(1);

    // Assert: All 50 requests received the correct result
    expect(results).toHaveLength(50);
    for (const res of results) {
      expect(res.data.result).toBe("coalesced_success");
      expect(res.data.count).toBe(42);
    }

    // Assert: In-flight map is completely drained to 0
    expect(orchestrator.getInFlightCount()).toBe(0);
    expect(orchestrator.getActiveConcurrency()).toBe(0);
  });

  it("enforces concurrency cap (max 8) across 50 distinct requests and bounds LRU cache", async () => {
    let currentConcurrent = 0;
    let peakConcurrent = 0;
    const initialHeapMb = process.memoryUsage().heapUsed / 1024 / 1024;

    const concurrentProvider: LLMProvider = {
      name: "gemini",
      generate: jest.fn(async () => {
        currentConcurrent++;
        if (currentConcurrent > peakConcurrent) {
          peakConcurrent = currentConcurrent;
        }
        await new Promise((r) => setTimeout(r, 15));
        currentConcurrent--;
        return JSON.stringify({ result: "distinct_success", count: 1 });
      }),
    };

    const orchestrator = new AIOrchestrator(concurrentProvider, concurrentProvider);

    // Fire 50 distinct requests
    const distinctRequests = Array.from({ length: 50 }, (_, i) =>
      orchestrator.execute({
        taskName: "concurrency_cap_stress",
        schema: testSchema,
        prompt: `distinct_prompt_${i}`,
        fallbackGenerator: () => ({ result: "fallback", count: 0 }),
        cacheKeyData: { id: i },
      }),
    );

    const results = await Promise.all(distinctRequests);

    expect(results).toHaveLength(50);

    // Assert: Peak concurrency never exceeded the cap of 8
    expect(peakConcurrent).toBeLessThanOrEqual(8);
    expect(orchestrator.getActiveConcurrency()).toBe(0);
    expect(orchestrator.getInFlightCount()).toBe(0);

    // Assert: Cache size bounded and does not exceed capacity (80)
    expect(orchestrator.getCacheSize()).toBeLessThanOrEqual(80);

    // Assert: Heap memory remains bounded (delta < 20MB)
    const finalHeapMb = process.memoryUsage().heapUsed / 1024 / 1024;
    expect(finalHeapMb - initialHeapMb).toBeLessThan(20);
  });
});

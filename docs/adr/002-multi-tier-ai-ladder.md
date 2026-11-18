# ADR 002: Multi-Tier Resilient AI Orchestrator Ladder

## Status
Accepted

## Context
Upstream AI providers experience quota exhaustion (HTTP 429), regional outages, or network latency spikes during peak usage. A single provider dependency causes catastrophic UX failure during a live challenge.

## Decision
We implement a three-tier AI fallback ladder managed by `services/ai/orchestrator.ts`:
1. **Tier 1 (Primary)**: Google Gemini (`gemini-2.5-flash`) via official SDK.
2. **Tier 2 (Secondary)**: Groq (`qwen/qwen-2.5-32b-instruct`) via OpenAI-compatible endpoints.
3. **Tier 3 (Offline Rule Fallback)**: Deterministic rule-based template engine.

Immediate fallthrough is triggered on 401, 404, or 429 status codes without wasting latency on useless retries.

## Consequences
- The application never crashes due to AI provider failure.
- Circuit breakers (Upstash Redis / in-memory) protect downstream systems from hammering dead endpoints.

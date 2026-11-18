# ADR 001: Pure Mathematical Domain Engine Independent of Generative AI

## Status
Accepted

## Context
Air pollution guidance involves high-stakes human health decisions (asthma risk in children, cardiovascular strain during severe inversion smog). Large Language Models frequently hallucinate numerical indices, air quality thresholds, CADR metrics, or emergency symptom advice.

## Decision
We separate all domain logic into pure deterministic TypeScript modules (`domain/aqi.ts`, `domain/indoor.ts`, `domain/windows.ts`, `domain/exposure.ts`, `domain/risk.ts`, `domain/stagnation.ts`). All numerical outputs, risk categorizations, and window recommendations are calculated by code before invoking any LLM.

## Consequences
- Guarantees 100% deterministic safety: the application remains fully functional and reliable even during complete API outages.
- Unit tests can verify mathematical correctness and edge cases without mocking LLMs or paying API tokens.

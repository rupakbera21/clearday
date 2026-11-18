# ADR 003: Grounded-Numbers Post-Processing Verification

## Status
Accepted

## Context
When an LLM summarizes exposure numbers or explains why a routine was selected, it may invent or drift numbers (e.g. reporting 45 µg/m³ instead of the computed 240 µg/m³).

## Decision
We enforce a strict grounded-numbers validation gate (`services/ai/validator.ts`). The orchestrator feeds the model a map of verified computed facts (`fact_current_pm25`, `fact_reduction_pct`, etc.). The post-processor parses all numbers in the generated text; any number not present in the fact registry or safe whitelist causes output rejection and fallback to verified deterministic templates.

## Consequences
- Eliminates numerical hallucinations in all user-facing narratives.
- Enforces strict traceability from computational domain engines to prose.

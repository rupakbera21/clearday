# Clearday

> GenAI assistant for families and communities facing severe winter smog and urban air pollution.

## Overview

Clearday is a calm, deterministic instrument designed to help families and vulnerable individuals minimize toxic particulate exposure and reduce household emissions during winter smog events. Built upon a "Rules first, AI second" architecture, Clearday guarantees that critical safety, physical mass balance, and exposure calculations are computed deterministically in code, while generative models personalize, explain, and ground recommendations without hallucinated figures.

---

## Requirement Traceability Matrix

| Problem Statement Phrase | Implementation Feature | Code Implementation | Verification & Tests |
|---|---|---|---|
| **GenAI-powered assistant** | Multi-provider fallback orchestration (Gemini primary, Groq secondary, rule-based fallback), grounded-numbers validator, circuit breaker | `services/ai/orchestrator.ts`, `services/ai/gemini.ts`, `services/ai/groq.ts`, `services/ai/validator.ts` | `services/ai/__tests__/orchestrator.test.ts`, `services/ai/__tests__/validator.test.ts`, `services/ai/__tests__/concurrency.test.ts` |
| **families** | Household vulnerability profile, sensitive condition categories, natural-language parsing | `schemas/ai.ts`, `components/feature/household/profile-view.tsx` | `app/api/ai/__tests__/parse-household.test.ts`, `store/__tests__/use-app-store.test.ts` |
| **communities** | Community collective guidance, vetted public health advisories, and emission scaling | `data/knowledge/items-core.ts`, `data/knowledge/items-extended.ts`, `schemas/ai.ts` | `data/__tests__/knowledge.test.ts`, `domain/__tests__/alternatives.test.ts` |
| **severe winter smog and urban air pollution** | Live and forecast air quality, India NAQI & US AQI computed in code, stagnation analysis ("Why is it bad today"), Severe-day mode | `domain/aqi.ts`, `domain/stagnation.ts`, `components/feature/snapshot/snapshot-view.tsx` | `domain/__tests__/aqi.test.ts`, `domain/__tests__/stagnation.test.ts`, `tests/layout.spec.ts` |
| **low-emission daily routines** | Day planner finding lowest-exposure windows (midday boundary layer rise) vs inversion peaks | `domain/windows.ts`, `components/feature/plan/plan-view.tsx`, `components/feature/day-strip.tsx` | `domain/__tests__/windows.test.ts`, `app/api/ai/__tests__/tailor-plan.test.ts` |
| **indoor air quality hacks** | Home air toolkit: single-compartment mass balance CADR & DIY box fan sizing calculator, ACH metrics, myth vs fact | `domain/indoor.ts`, `components/feature/home-toolkit/home-toolkit-view.tsx` | `domain/__tests__/indoor.test.ts`, `tests/e2e.spec.ts` |
| **sustainable alternatives** | Alternatives engine for commute, cooking, heating, and waste ranked by exposure reduction, emissions avoided, and cost tier | `domain/alternatives.ts`, `components/feature/alternatives/alternatives-view.tsx` | `domain/__tests__/alternatives.test.ts`, `data/__tests__/emission-factors.test.ts` |
| **tailored to their location and lifestyle** | Geocoded location search, local timezone alignment, live Open-Meteo data, local persistent profile | `services/air/client.ts`, `services/geo/client.ts`, `store/use-app-store.ts` | `services/air/__tests__/client.test.ts`, `services/geo/__tests__/client.test.ts` |
| **clearly explaining the direct impact of their choices** | Impact Lab: personal what-if sandbox calculating daily inhaled PM2.5 (ug) and CO2e avoided with grounded citations | `domain/exposure.ts`, `components/feature/impact/impact-view.tsx` | `domain/__tests__/exposure.test.ts`, `app/api/ai/__tests__/explain-impact.test.ts` |

---

## Core Product Principles

1. **Rules First, AI Second**: Safety-critical advice comes from deterministic engines (`domain/`) and a 32-item vetted knowledge base (`data/knowledge/`). If AI fails or is throttled, complete rule-based plans render instantly.
2. **Numbers Come From Code, Never From Models**: GenAI models receive computed facts with IDs and are validated by `services/ai/validator.ts`. Numerals without matching verified fact IDs trigger automatic repair or template fallback.
3. **Honesty About Uncertainty**: All estimates provide low-central-high ranges with documented peer-reviewed assumptions in `data/parameters.ts` and `data/emission-factors.ts`.
4. **Health Safety**: Informational guidance only. Symptom language triggers immediate urgent-care guidance (`kb_symptoms_urgent_care`).
5. **Privacy by Design**: Zero server database, zero tracking cookies. Location and household profiles exist exclusively on the user's device in `localStorage`.
6. **Lean & Accessible**: Public repo under 10 MB, zero bloated UI kits, 100% accessible via WCAG 2.2 AA standards (`jest-axe` verified).

---

## Architecture & Data Flow

- **Frontend Shell**: Next.js 15 (App Router), Tailwind CSS v4, Zustand store with persistence and versioning.
- **Deterministic Domain Engines**: Pure functions in `domain/` (zero external dependencies) calculating AQI breakpoints, exposure inhalation, air changes per hour, and stagnation.
- **Resilient AI Pipeline**: Primary Gemini (`gemini-3.8-flash`), secondary Groq (`qwen/qwen3.8-27b`), circuit-breaker protection (`services/ai/circuit-breaker.ts`), and in-flight request coalescing (`services/ai/orchestrator.ts`).
- **Data Service & Fallback Ladder**: Open-Meteo Air Quality & Geocoding APIs with bounded LRU caching (15 min TTL) -> stale cache -> manual sensor entry mode.

---

## Verification & Testing

Clearday enforces strict automated verification gates:
```bash
# Run all verification checks (tokens, lint, typecheck, coverage tests, build, docs)
npm run verify

# Run Playwright browser layout and E2E tests (real Chrome across 4 viewports)
npx playwright test

# Run component accessibility tests
npx jest components/feature/__tests__/axe.test.tsx
```

All 36 Playwright browser tests pass across Mobile (360px, 390px), Tablet (768px), and Desktop (1280px).

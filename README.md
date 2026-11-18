# Clearday

> GenAI assistant for families and communities facing winter smog and urban air pollution.

## Overview

Clearday is a calm, deterministic instrument designed to help families and vulnerable individuals minimize toxic particulate exposure and reduce household emissions during winter smog events.

## Architecture

- **Deterministic Core**: Pure mathematical domain models in `domain/hash.ts` (and upcoming domain engines) calculate air quality metrics, exposure, and risk without relying on stochastic LLM behavior.
- **Resilient AI Layer**: Multi-provider fallback orchestration with Gemini as primary and Groq as backup.
- **Privacy by Design**: Client-side location and profile processing; zero persistent server database tracking.

## Phase 1 Foundations Verified

- Strict TypeScript with `noUncheckedIndexedAccess`.
- Next.js 15 App Router with Tailwind CSS v4 verified via Chrome Playwright layout tests.
- Comprehensive security headers with Content Security Policy (no `unsafe-eval`).
- Outbound SSRF-protected HTTP client with host allowlists and streaming body caps in `services/http.ts`.
- Privacy-preserving logger in `services/logger.ts` redacting coordinates and sensitive attributes.
- Health endpoint in `app/api/health/route.ts` rate-limited via `services/ratelimit.ts`.

## Verification

Run all verification gates:
```bash
npm run verify
```

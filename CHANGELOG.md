# Changelog

All notable changes to Clearday will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-11-18

### Added
- Complete Phase 4 AI layer with resilient multi-provider ladder: Gemini primary (`gemini-3.8-flash`), Groq secondary (`qwen/qwen3.8-27b`), and deterministic rule-based fallback.
- Output cleaner in `services/ai/cleaner.ts` stripping `<think>` tags, markdown code blocks, and sanitizing user prompt text.
- Grounded-numbers validator in `services/ai/validator.ts` strictly ensuring every numeral in AI narrative maps to a verified computed fact ID.
- Upstash Redis circuit breaker with local in-memory fallback in `services/ai/circuit-breaker.ts` (60s cooldown on exhaustion/auth failure).
- Central AI orchestrator in `services/ai/orchestrator.ts` handling retries, circuit breaking, schema validation, and canonical response caching.
- Four bounded API route handlers with rate limiting, Zod schema validation, and rule-based safety fallback:
  - `POST /api/ai/parse-household`: Parses natural language household descriptions into validated profiles.
  - `POST /api/ai/tailor-plan`: Synthesizes routine plans tailored to outdoor exposure windows and vulnerable members.
  - `POST /api/ai/explain-impact`: Explains personal exposure and emissions differences using verified computational facts.
  - `POST /api/ai/ask`: Grounded safety-constrained Q&A with immediate emergency symptom interception.
- Complete unit and integration test suite across 31 test suites (110 tests) with 85%+ coverage on services and app/api.

## [0.3.0] - 2026-11-18

### Added
- Complete Phase 3 data services: Open-Meteo Air Quality & Weather client in `services/air/client.ts`.
- Geocoding client with city search and caching in `services/geo/client.ts`.
- Bounded LRU cache with TTL, in-flight request coalescing, and stale-fallback in `services/air/cache.ts`.
- REST endpoints: `GET /api/geo/search`, `GET /api/air/snapshot`, and `POST /api/air/manual`.
- Data failure ladder: fresh live fetch -> coalesced in-flight -> stale cache -> manual entry fallback.
- Recorded realistic test fixtures in `tests/fixtures/` and 21 new integration tests with failure injection.

## [0.2.0] - 2026-11-18

### Added
- Complete Phase 2 mathematical domain engines: AQI (`domain/aqi.ts`), Risk (`domain/risk.ts`), Windows (`domain/windows.ts`), Exposure (`domain/exposure.ts`), Indoor mass-balance (`domain/indoor.ts`), Alternatives (`domain/alternatives.ts`), Stagnation heuristics (`domain/stagnation.ts`).
- Empirical parameter datasets in `data/parameters.ts` and `data/emission-factors.ts` with complete uncertainty ranges and peer-reviewed citations.
- Vetted knowledge base in `data/knowledge/` with 32 structured guidance items and deterministic selection function.
- Exhaustive property tests with `fast-check` proving monotonicity and interval bounds across all engines.
- Detailed parameter and breakpoint documentation in `docs/ASSUMPTIONS.md` and `docs/DATA_SOURCES.md`.

## [0.1.0] - 2026-11-18

### Added
- Phase 1 scaffolding with strict TypeScript (`noUncheckedIndexedAccess`), Next.js 15 App Router, and Tailwind CSS v4.
- Security headers and CSP enforcing no `unsafe-eval`.
- SSRF-protected HTTP client with host allowlist and streaming response size caps in `services/http.ts`.
- Privacy-first structured logging in `services/logger.ts` redacting coordinates and sensitive attributes.
- Environment validation with quote stripping in `services/env.ts`.
- Rate limiting with sliding window and local in-memory fallback in `services/ratelimit.ts`.
- Deterministic canonical hash utility in `domain/hash.ts`.
- Health check API endpoint in `app/api/health/route.ts`.
- Design token compliance check script in `scripts/check-tokens.mjs`.
- Documentation path validator in `scripts/check-docs.mjs`.
- Smoke test script in `scripts/smoke.mjs`.
- Playwright layout tests proving Tailwind CSS v4 pipeline in Chrome across mobile and desktop viewports.
- GitHub Actions CI workflow in `.github/workflows/ci.yml`.

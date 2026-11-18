# Changelog

All notable changes to Clearday will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0] - 2026-11-18

### Added
- Phase 9 Documentation, Architecture Diagrams, and Submission Packaging:
  - System Architecture Specification in `docs/ARCHITECTURE.md` with Mermaid topology, data flow, and multi-tier AI sequence diagrams.
  - Clinical & Air Safety Framework in `docs/SAFETY.md` detailing non-medical advisory boundaries, regex red-flag symptom emergency interception, and zero-unverified-numbers validation.
  - Hackathon Evaluation & Traceability Map in `docs/EVALUATION_MAP.md` mapping all 6 judging criteria to implementation files and algorithms.
  - Executive Submission Notes in `docs/SUBMISSION_NOTES.md`.
  - 4 Architectural Decision Records in `docs/adr/`:
    - `001-deterministic-domain-engine.md`: Pure mathematical domain engine independent of LLMs.
    - `002-multi-tier-ai-ladder.md`: Multi-tier fallback ladder (Gemini -> Groq -> Rule-Based).
    - `003-grounded-numbers-validator.md`: Grounded-numbers post-processing verification.
    - `004-zero-database-privacy.md`: Zero-server database client-side privacy architecture.
  - Verified repository git tracked footprint is 0.84 MB (strictly below the 10 MB ceiling).

## [0.8.0] - 2026-11-18

### Added
- Complete Phase 8 Community Toolkit, Outlook & Productivity Enhancements:
  - Community Toolkit Screen (`components/feature/community/community-view.tsx`): 1-page printable (@media print) advisories and shareable copyable protocol templates tailored for Schools & Nurseries, Housing Societies (RWAs), and Commercial Workplaces.
  - RFC 5545 iCalendar (`.ics`) generation and one-click calendar reminder export for optimal low-exposure outdoor windows (`services/calendar.ts`, `services/__tests__/calendar.test.ts`).
  - 72-Hour Multi-Day Smog & Inversion Outlook card (`components/feature/snapshot/outlook-card.tsx`) analyzing 3-day meteorological dispersion and stagnation risk.
  - SpeechSynthesis integration in Ask Clearday (`components/feature/ask/ask-view.tsx`) for voice read-aloud in English, Hindi, and Bengali.
  - Integration of Community view into global tabbed navigation shell (`app/page.tsx`).
  - Jest-axe WCAG 2.2 AA accessibility verification extended to CommunityView with zero violations.

## [0.7.0] - 2026-11-18

### Added
- Phase 7 Review Gate, Traceability, Concurrency, and Accessibility Hardening:
  - Requirement Traceability Matrix in `README.md` mapping every phrase of problem statement to implementation files and tests.
  - Concurrency slot acquisition (max 8 concurrent upstream calls) and in-flight promise coalescing in `AIOrchestrator` (`services/ai/orchestrator.ts`).
  - Unit tests verifying 50 concurrent identical requests coalesce to 1 upstream call, in-flight map drains to 0, peak concurrency <= 8, cache bounded <= 80, and memory delta < 20MB (`services/ai/__tests__/concurrency.test.ts`).
  - Zustand store resilience and corruption recovery test suite in `store/__tests__/use-app-store.test.ts`.
  - Comprehensive WCAG 2.2 AA accessibility test suite via `jest-axe` in `components/feature/__tests__/axe.test.tsx` verifying zero automated accessibility violations across all feature screens.
  - Automated documentation path existence validation script (`scripts/check-docs.mjs`).
  - Fresh-clone verification test passing in isolated temporary directory.

## [0.6.0] - 2026-11-18

### Added
- Complete Phase 6 Tier 1 Screens and Accessible Tab Navigation:
  - Screen 1: Air Quality Snapshot (`components/feature/snapshot/`) with live geocoding city search, quick city shortcuts (Delhi, Kolkata, Lahore, Beijing, Los Angeles), DayStrip 24h hourly forecast, metrics grid, stagnation panel ("Why is it bad today"), and manual sensor entry modal.
  - Screen 2: Household Profile (`components/feature/household/profile-view.tsx`) with natural-language prompt parsing via Gemini, member vulnerability categories, dwelling envelope selector, cooking fuel, and commute options.
  - Screen 3: Today's Plan (`components/feature/plan/plan-view.tsx`) with optimal outdoor vs peak smog window badges, rule-based instant routine, Severe-Day Mode, and AI personalizer.
  - Screen 4: Impact Lab (`components/feature/impact/impact-view.tsx`) zero-network what-if sandbox calculating daily inhaled PM2.5 (ug) and tailpipe CO2e avoided across commute/mask/window/purifier choices, with grounded plain-language explanation.
  - Screen 5: Home Air Toolkit (`components/feature/home-toolkit/home-toolkit-view.tsx`) with single-compartment mass balance CADR & DIY box fan sizing calculator, ACH ratings, and evidence-based Myth vs Fact cards.
  - Screen 6: Sustainable Alternatives (`components/feature/alternatives/alternatives-view.tsx`) ranking habits across commute, cooking, heating, and waste by exposure cut, emissions avoided, and cost tier.
  - Screen 7: Ask Clearday (`components/feature/ask/ask-view.tsx`) grounded Q&A with red-flag symptom emergency interception and multi-lingual language selection (English, Hindi, Bengali, Urdu, Punjabi).
  - Screen 8: Privacy & Data Management (`components/feature/privacy/privacy-view.tsx`) detailing zero-database architecture, local storage footprint inspector, JSON data export, and complete local data wiping.
  - Main app shell in `app/page.tsx` integrating all 8 Tier 1 screens under accessible keyboard-navigable tablist, ThemeSwitcher, and verified CSS pipeline.
  - Playwright end-to-end test suite (`tests/e2e.spec.ts`) validating tab navigation, impact sandbox reactivity, DIY box fan calculations, and local data reset across 4 responsive viewports.

## [0.5.0] - 2026-11-18

### Added
- Complete Phase 5 Design System & UI Foundation:
  - Design system specification in `docs/DESIGN.md` (token ramps, AQI scale, Indic typography fallbacks, 4px grid, touch targets, ASCII wireframes).
  - Semantic CSS tokens in `app/globals.css` supporting dark mode, light mode, and high-contrast mode with visible focus rings.
  - Accessible UI primitives in `components/ui/`: `Button` (32/44/48px), `Input`, `Textarea`, `Select`, `Switch`, `Tabs`, `Badge` (with colorblind shape icons), `Surface`, `Table`, `Dialog`, `Sheet`, `Toast`, `Progress`, `Skeleton`, `EmptyState`, `PageHeader`, `Icon` (in-repo SVG icons).
  - Signature `DayStrip` component in `components/feature/day-strip.tsx` with 24-hour horizontal hourly forecast, best/worst window highlights, and accessible table view toggle.
  - Client state store in `store/use-app-store.ts` using Zustand with persistence, versioning, and privacy-first local storage.
  - Interactive theme, contrast, and AQI standard switcher in `components/feature/theme-switcher.tsx`.
  - Comprehensive Playwright layout tests in `tests/layout.spec.ts` passing across Mobile 360, Mobile 390, Tablet 768, and Desktop 1280 in real Chrome.

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

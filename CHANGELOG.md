# Changelog

All notable changes to Clearday will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

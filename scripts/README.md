# Clearday Build and Verification Scripts

This directory contains deterministic verification and utility scripts used in CI and local checks.

- `check-tokens.mjs`: Scans components and CSS for raw hex/rgb colors, arbitrary Tailwind values (`[...]`), or unstyled inline color patterns to enforce design token compliance.
- `check-docs.mjs`: Verifies that all backticked file paths in `README.md` and `docs/` exist on disk, and verifies test count alignment against fresh test execution.
- `smoke.mjs`: Performs a minimal live check against Gemini, Groq, Upstash, and Open-Meteo services without leaking sensitive credentials.

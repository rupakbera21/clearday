# ADR 004: Zero-Server Database Client-Side Privacy Architecture

## Status
Accepted

## Context
Household health sensitivities (asthma in children, pregnancy, cardiovascular vulnerability) and real-time location data are sensitive personal data. Centralizing this data in a database introduces severe privacy liabilities, breach risks, and storage overhead.

## Decision
We architected Clearday with **zero server-side databases**. All household profiles, sensitive health categories, and custom preferences are stored locally in the user's browser using Zustand with `localStorage` persistence. The server routes are purely stateless compute nodes.

## Consequences
- 100% compliance with data minimization and privacy regulations (GDPR, India DPDP Act).
- Zero database hosting costs and zero cross-tenant contamination risk.

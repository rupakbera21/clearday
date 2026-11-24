# Clearday Architecture Specification

> GenAI assistant for families and communities facing severe winter smog and urban air pollution.

---

## 1. System Topology & Architectural Principles

Clearday is built upon the **Rules first, AI second** doctrine. Safety-critical guidance (emergency detection, AQI computation, indoor CADR calculation, exposure windows, emissions reductions) executes deterministically in pure TypeScript with mathematical guarantees. The Generative AI layer acts strictly as a personalized translator, summarizer, and explanatory synthesizer bounded by a strict grounded-numbers validator.

```mermaid
flowchart TD
    subgraph Browser ["Client Browser (Zero-Server DB, WCAG 2.2 AA)"]
        UI["Accessible App Shell (app/page.tsx)"]
        Store["Zustand Store + LocalStorage (store/use-app-store.ts)"]
        DayStrip["DayStrip Forecast Strip (components/feature/day-strip.tsx)"]
        ImpactLab["Impact Lab What-If Engine (components/feature/impact/)"]
        CommView["Community Toolkit & ICS Generator (components/feature/community/)"]
    end

    subgraph Edge ["Next.js App Router API Routes"]
        AirAPI["/api/air/snapshot (Open-Meteo Integration)"]
        ManualAPI["/api/air/manual (Sensor Override)"]
        GeoAPI["/api/geo/search (Photon Geocoding)"]
        AI_Plan["/api/ai/tailor-plan"]
        AI_Impact["/api/ai/explain-impact"]
        AI_Ask["/api/ai/ask"]
        AI_Household["/api/ai/parse-household"]
    end

    subgraph AI_Engine ["Resilient Multi-Provider AI Ladder"]
        Orchestrator["AIOrchestrator (Bounded Concurrency & Coalescing)"]
        Gemini["Primary: Gemini 2.5 Flash"]
        Groq["Secondary: Groq Qwen 2.5-32B"]
        RuleBased["Tier 3: Deterministic Rule Fallback"]
        Validator["Grounded Numbers & Fact Validator"]
        Breaker["Circuit Breaker (Upstash / Memory)"]
    end

    subgraph Domain ["Pure Mathematical Domain Engine"]
        AQI["domain/aqi.ts (India NAQI & US AQI)"]
        Windows["domain/windows.ts (Exposure Windows)"]
        Indoor["domain/indoor.ts (Mass-Balance CADR)"]
        Exposure["domain/exposure.ts (Inhaled ug PM2.5)"]
        Alternatives["domain/alternatives.ts (CO2e avoided)"]
        Stagnation["domain/stagnation.ts (Inversion & Wind)"]
    end

    UI --> AirAPI
    UI --> AI_Plan
    UI --> AI_Impact
    UI --> AI_Ask
    UI --> AI_Household
    UI --> Store
    AirAPI --> AQI
    AirAPI --> Windows
    AirAPI --> Stagnation
    ImpactLab --> Exposure
    ImpactLab --> Indoor
    AI_Plan --> Orchestrator
    AI_Impact --> Orchestrator
    AI_Ask --> Orchestrator
    AI_Household --> Orchestrator
    Orchestrator --> Breaker
    Breaker --> Gemini
    Gemini -.->|Fail/Exhaust| Groq
    Groq -.->|Fail/Exhaust| RuleBased
    Orchestrator --> Validator
```

---

## 2. Multi-Provider AI Fallback Matrix

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client Component
    participant API as Route Handler
    participant Orch as AIOrchestrator
    participant Gem as Gemini Provider
    participant Groq as Groq Provider
    participant Rule as Rule Fallback
    participant Val as Grounded Validator

    Client->>API: POST /api/ai/tailor-plan (Profile + Windows)
    API->>Orch: execute(prompt, schema, availableFacts)
    Note over Orch: Concurrency Limiter (Max 8) + LRU Coalescing
    Orch->>Gem: generate(prompt)
    alt Gemini Success
        Gem-->>Orch: Raw JSON Output
    else Gemini Quota / 404 / 503
        Gem--xOrch: Error (Immediate Circuit Trip)
        Orch->>Groq: generate(prompt)
        alt Groq Success
            Groq-->>Orch: Raw JSON Output
        else Groq Quota / Error
            Groq--xOrch: Error
            Orch->>Rule: executeRuleBasedFallback()
            Rule-->>Orch: Deterministic Safe Plan
        end
    end
    Orch->>Val: validateGroundedNumbers(narrative, facts)
    Val-->>Orch: Verified Clean Data
    Orch-->>API: OrchestrationResult<T>
    API-->>Client: 200 OK (data, serviceTier)
```

---

## 3. Data Flow & Security Perimeter

1. **Client Isolation**: User personal coordinates, dwelling vulnerabilities, and family health categories are saved solely to browser `localStorage` under `clearday_storage_v1`. No database, no user tracking, no session cookies.
2. **Minimal Upstream Payload**: Upstream AI requests receive only coarse location (`"Delhi"`), aggregated hourly air indices, and anonymous health band flags (`"has_asthma_elderly"`).
3. **Emergency Red-Flag Interception**: If user prompt or questions match red-flag clinical conditions (chest tightness, blue lips, severe dyspnea), the system aborts AI calls and returns immediate clinical emergency hospital routing (`kb_symptoms_urgent_care`).
4. **Content Security Policy**: Strict CSP (`default-src 'self'`, `frame-ancestors 'none'`, etc.) enforced on all responses via `next.config.mjs`.

# Clearday Model Assumptions and Empirical Parameters

This document details every physical and biological parameter utilized across Clearday's deterministic engines, including low, central, and high uncertainty bounds and official citations.

## 1. Breakpoint Tables & Air Quality Indices

### India National Air Quality Index (NAQI)
- **Source**: Central Pollution Control Board (CPCB), Ministry of Environment, Forest and Climate Change, Government of India (2014/2015).
- **PM2.5 Breakpoints (ug/m3)**:
  - 0 - 30 -> 0 - 50 (Good)
  - 31 - 60 -> 51 - 100 (Satisfactory)
  - 61 - 90 -> 101 - 200 (Moderate)
  - 91 - 120 -> 201 - 300 (Poor)
  - 121 - 250 -> 301 - 400 (Very Poor)
  - 250+ -> 401 - 500 (Severe)
- **Code file**: `domain/aqi.ts`

### US EPA Air Quality Index (AQI)
- **Source**: US EPA Technical Assistance Document for the Reporting of Daily Air Quality (EPA-454/B-24-001, revised 2024 PM2.5 annual/daily standard).
- **PM2.5 Breakpoints (ug/m3)**:
  - 0.0 - 9.0 -> 0 - 50 (Good)
  - 9.1 - 35.4 -> 51 - 100 (Moderate)
  - 35.5 - 55.4 -> 101 - 150 (Unhealthy for Sensitive Groups)
  - 55.5 - 125.4 -> 151 - 200 (Unhealthy)
  - 125.5 - 225.4 -> 201 - 300 (Very Unhealthy)
  - 225.5 - 325.4 -> 301 - 400 (Hazardous)
  - 325.5 - 500.4 -> 401 - 500 (Hazardous)
- **Code file**: `domain/aqi.ts`

---

## 2. Inhalation Rates by Demographic and Activity

Sourced from the US EPA Exposure Factors Handbook (2011 Edition, Chapter 6: Inhalation Rates).

| Age Band | Rest (m3/day) [Low, Central, High] | Light (m3/day) [Low, Central, High] | Moderate (m3/day) [Low, Central, High] | Heavy (m3/day) [Low, Central, High] |
|---|---|---|---|---|
| **Infant (<1 yr)** | 2.1, 2.9, 3.8 | 3.5, 4.8, 6.2 | 5.2, 7.1, 9.0 | 7.0, 9.5, 12.0 |
| **Child (1-11 yr)** | 4.5, 6.1, 7.8 | 7.5, 9.8, 12.4 | 11.2, 14.5, 18.2 | 15.0, 19.8, 25.0 |
| **Adult (18-64 yr)** | 6.8, 8.5, 10.5 | 11.0, 14.2, 17.5 | 18.5, 23.0, 28.5 | 28.0, 35.0, 43.0 |
| **Older Adult (65+ yr)**| 6.0, 7.8, 9.6 | 9.8, 12.8, 15.9 | 16.0, 20.5, 25.2 | 24.0, 30.0, 37.0 |

- **Code file**: `data/parameters.ts`, `domain/exposure.ts`

---

## 3. Microenvironment Infiltration Factors

- **Open Windows (Natural ventilation)**: Infiltration ratio 0.75 - 0.88 - 0.98. Source: Chen & Zhao (Atmospheric Environment 2011).
- **Closed Standard Urban Apartment**: Infiltration ratio 0.45 - 0.60 - 0.75. Source: EPA Indoor Air Quality Models (2018).
- **Weatherstripped / Sealed Home**: Infiltration ratio 0.20 - 0.32 - 0.45. Source: Lawrence Berkeley National Laboratory (LBNL 2015).
- **Vehicle with AC Recirculation**: Cabin penetration ratio 0.15 - 0.25 - 0.40. Source: Hudda & Fruin (Environ Sci Technol 2013).
- **Code file**: `data/parameters.ts`, `domain/exposure.ts`

---

## 4. Respiratory Protection (Mask Real-World Fit Factors)

Accounting for boundary leakage and facial seal dynamics:

| Mask Type | Penetration Factor [Low, Central, High] | Real-World Filtration Efficiency | Source |
|---|---|---|---|
| **None** | 1.0, 1.0, 1.0 | 0% | Baseline |
| **Cloth Mask** | 0.60, 0.72, 0.85 | 15% - 28% - 40% | CDC NIOSH (2021) |
| **Surgical Mask** | 0.35, 0.50, 0.65 | 35% - 50% - 65% | Mueller et al. (OEM 2018) |
| **KN95 / FFP2 Earloop** | 0.10, 0.20, 0.35 | 65% - 80% - 90% | CDC NIOSH Assessments (2022) |
| **Fitted N95 Dual-Strap**| 0.01, 0.05, 0.12 | 88% - 95% - 99% | NIOSH Standard (2020) |

- **Code file**: `data/parameters.ts`, `domain/exposure.ts`

---

## 5. Indoor Mass-Balance Model

- **Steady-State Infiltration Balance**:
  $$\frac{I}{O} = \frac{P \cdot \lambda}{\lambda + k_{dep} + \frac{CADR}{V}}$$
  Where $P$ is penetration efficiency (0.65 - 0.95), $\lambda$ is air exchange rate ($ACH_{nat}$, 0.3 - 2.5/hr), $k_{dep}$ is natural particle deposition (0.2/hr), and $CADR/V$ is effective clean air changes per hour.
- **Code file**: `domain/indoor.ts`

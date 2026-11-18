# Clearday External Data Sources and Licenses

This document outlines all external data providers, their licensing, rate limits, and attribution requirements.

## 1. Air Quality & Meteorological Data

### Open-Meteo Air Quality API
- **Endpoint**: `https://air-quality-api.open-meteo.com/v1/air-quality`
- **License**: Creative Commons Attribution 4.0 International (CC BY 4.0).
- **Data Provided**: Hourly PM2.5, PM10, European AQI, US AQI, NO2, SO2, CO, Ozone.
- **Fair Use Policy**: Free non-commercial use with required attribution. Clearday includes attribution in the footer and README.
- **Code file**: `services/http.ts`, `app/api/health/route.ts`

### Open-Meteo Weather Forecast API
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Data Provided**: Hourly temperature (2m), relative humidity (2m), wind speed (10m), boundary layer height.
- **License**: CC BY 4.0.
- **Code file**: `services/http.ts`

### Open-Meteo Geocoding API
- **Endpoint**: `https://geocoding-api.open-meteo.com/v1/search`
- **Data Provided**: City search, coordinates, timezone, administrative regions.
- **License**: CC BY 4.0 / OpenStreetMap contributors.
- **Code file**: `services/http.ts`

---

## 2. Environmental & Health Standards

### Central Pollution Control Board (CPCB), India
- **Publication**: National Air Quality Index (2014/2015).
- **Usage**: Official Indian NAQI breakpoints and health advisory statements.
- **Code file**: `domain/aqi.ts`, `domain/risk.ts`

### US Environmental Protection Agency (US EPA)
- **Publication**: Technical Assistance Document for the Reporting of Daily Air Quality (EPA-454/B-24-001, 2024 revisions).
- **Usage**: US AQI breakpoints, Exposure Factors Handbook inhalation rates.
- **Code file**: `domain/aqi.ts`, `data/parameters.ts`

### World Health Organization (WHO)
- **Publication**: WHO Global Air Quality Guidelines (2021), Household Air Pollution Fact Sheets.
- **Usage**: Health risk categories, indoor cooking emissions factors.
- **Code file**: `data/emission-factors.ts`, `data/knowledge/items-core.ts`

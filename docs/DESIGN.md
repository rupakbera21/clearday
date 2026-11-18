# Clearday Design System & Accessibility Specification

Clearday is built for families and communities facing winter smog and urban air pollution. The design is calm, functional, and deeply accessible across diverse devices, light conditions, and visual abilities.

---

## 1. Visual Foundation & Color System

Clearday employs a semantic design token ramp with strict WCAG 2.2 AA contrast compliance (minimum 4.5:1 for body text, 3:1 for large text and UI boundaries).

### 1.1 Color Tokens

| Token Name | Dark Mode | Light Mode | High Contrast | Purpose |
|---|---|---|---|---|
| `--bg-canvas` | `#0f172a` (Slate 900) | `#f8fafc` (Slate 50) | `#000000` (Pure Black) | Base page background |
| `--bg-surface` | `#1e293b` (Slate 800) | `#ffffff` (Pure White) | `#121212` | Card & container surface |
| `--bg-surface-elevated`| `#334155` (Slate 700) | `#f1f5f9` (Slate 100) | `#1a1a1a` | Modals, dropdowns, sheets |
| `--border-subtle` | `#334155` | `#e2e8f0` | `#ffffff` (Solid 2px) | Structural dividers |
| `--border-strong` | `#64748b` | `#94a3b8` | `#ffffff` | Interactive component borders |
| `--text-primary` | `#f8fafc` (Slate 50) | `#0f172a` (Slate 900) | `#ffffff` | Primary headings and text |
| `--text-secondary` | `#94a3b8` (Slate 400) | `#475569` (Slate 600) | `#e2e8f0` | Subtitles, labels, timestamps |
| `--text-muted` | `#64748b` (Slate 500) | `#64748b` (Slate 500) | `#cbd5e1` | Captions, disabled text |
| `--ring-focus` | `#38bdf8` (Sky 400) | `#0284c7` (Sky 600) | `#ffff00` (Bright Yellow) | 3px visible focus ring |

### 1.2 Semantic AQI Scale (Color-Blind & Grayscale Safe)

To prevent misinterpretation by users with color vision deficiency (protanopia, deuteranopia, tritanopia) or in monochrome printouts, every AQI level pairs a distinct color with a unique geometric shape symbol and text label:

| Level | India NAQI | US AQI | Dark Token | Symbol Shape | Accessibility Rationale |
|---|---|---|---|---|---|
| 1 | Good (0–50) | Good (0–50) | `text-emerald-400 bg-emerald-950/60` | Diamond (◆) | High luminance green, distinct shape |
| 2 | Satisfactory (51–100)| Moderate (51–100) | `text-lime-400 bg-lime-950/60` | Circle (●) | Yellow-green, rounded geometry |
| 3 | Moderate (101–200) | USG (101–150) | `text-amber-400 bg-amber-950/60` | Triangle (▲) | Warning amber, triangular hazard shape |
| 4 | Poor (201–300) | Unhealthy (151–200)| `text-orange-400 bg-orange-950/60` | Square (■) | High contrast orange, distinct square |
| 5 | Very Poor (301–400)| Very Unhealthy (201–300)| `text-rose-400 bg-rose-950/60` | Hexagon (⬡) | Intense red-rose, hexagonal perimeter |
| 6 | Severe (401–500) | Hazardous (301–500)| `text-purple-400 bg-purple-950/60` | Octagon (🛑) | Deep purple/maroon, emergency stop octagon |

---

## 2. Typography & Script Hierarchy

Urban air pollution severely impacts South Asian and East Asian mega-cities (Delhi, Lahore, Dhaka, Beijing). Clearday supports tabular numerals and Indic script fallbacks out of the box:

- **Body Font**: System sans-serif optimized for performance and reading legibility:
  `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", sans-serif`
- **Indic Script Fallbacks**:
  - Devanagari (Hindi, Marathi): `"Noto Sans Devanagari", "Mangal"`
  - Bengali (Bengali, Assamese): `"Noto Sans Bengali", "Vrinda"`
  - Gurmukhi (Punjabi): `"Noto Sans Gurmukhi", "Raavi"`
  - Nastaliq / Naskh (Urdu): `"Noto Nastaliq Urdu", "Noto Sans Arabic"`
- **Tabular Figures**:
  All air quality numbers, exposure ranges, microgram counts, and time values use `font-variant-numeric: tabular-nums` to guarantee aligned columns without visual jitter during live updates.

---

## 3. Spacing, Grid & Ergonomics

- **Grid Base**: 4px standard grid (8px, 12px, 16px, 20px, 24px, 32px, 48px).
- **Touch Target Law**: All interactive elements (buttons, inputs, chips, tabs, switches) enforce a minimum touch target of **44x44 CSS pixels** (`min-h-11 min-w-11`) on mobile viewports.
- **Thumb Zone**: Primary actions (Day Planner, Impact Lab, Ask Clearday) sit within comfortable thumb reach on phone viewports (360px–390px).

---

## 4. Accessibility Architecture (WCAG 2.2 AA)

1. **Focus Management**:
   - High-contrast 3px focus rings on `:focus-visible` with a 2px offset.
   - Fully keyboard operable: `Tab`, `Shift+Tab`, `ArrowLeft/Right` for tabs, `Escape` to close modals and sheets.
2. **Screen Reader Landmarks & ARIA**:
   - Clear landmarks: `<header role="banner">`, `<main id="main-content">`, `<nav aria-label="...">`, `<aside>`, `<footer role="contentinfo">`.
   - Skip to main content link: `<a href="#main-content" className="sr-only focus:not-sr-only ...">`.
   - `aria-live="polite"` regions announce real-time air quality snapshot refreshes and what-if calculations without disrupting narration.
3. **Severe-Day Calm Mode**:
   - When AQI exceeds 300 (Severe), the UI switches to a calm, high-legibility layout that avoids flashing, alarmist animations, or high-anxiety typography.

---

## 5. ASCII Wireframes of Tier 1 Screens

### 5.1 Air Snapshot & Location Search
```text
+-------------------------------------------------------------+
| [Logo] Clearday                  [New Delhi, IN v] [Dark/HC]|
+-------------------------------------------------------------+
| Skip to content                                             |
|                                                             |
| +---------------------------------------------------------+ |
| | AIR QUALITY SNAPSHOT: Anand Vihar, New Delhi            | |
| | Current AQI: 382  [⬡ Very Poor - NAQI]   Updated: 5m ago| |
| | PM2.5: 245 µg/m³ | PM10: 380 µg/m³ | Temp: 16°C | Wind: 3k| |
| |                                                         | |
| | Why is it bad today? [Stagnation Indicator: Severe]     | |
| | - Low planetary boundary layer (280m) traps emissions   | |
| | - Calm surface winds (< 1.5 m/s) prevent dispersion     | |
| | - High PM2.5/PM10 ratio (0.64) indicates combustion     | |
| +---------------------------------------------------------+ |
|                                                             |
| 24-HOUR FORECAST STRIP                                      |
| +---------------------------------------------------------+ |
| | 06:00 | 08:00 | 10:00 | 12:00 | 14:00 [BEST] | 18:00    | |
| |  390  |  410  |  350  |  260  |  180 [▲]     |  320     | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
```

### 5.2 Today's Plan & Low-Exposure Windows
```text
+-------------------------------------------------------------+
| TODAY'S ROUTINE PLANNER          [Household: 4 members (1 ast|
+-------------------------------------------------------------+
| [★] Recommended Window: 13:00 - 15:00 (Lowest PM2.5 ~140 µg)|
| [!] Avoid Outdoor Window: 07:00 - 09:30 (Morning inversion) |
|                                                             |
| SCHEDULE BLOCKS:                                            |
| +---------------------------------------------------------+ |
| | 06:30 - 08:30 | Morning Commute / School Run            | |
| | Action: Wear certified N95; vehicle cabin on recirc     | |
| | Exposure Risk: High (fact_worst_window)                 | |
| +---------------------------------------------------------+ |
| | 13:00 - 15:00 | Essential Errands & Outdoor Tasks       | |
| | Action: Safe for brief outdoor tasks                    | |
| | Exposure Risk: Lowest daily window                      | |
| +---------------------------------------------------------+ |
| | 19:00 - 21:00 | Cooking & Evening Indoor Living         | |
| | Action: Exhaust fan ON, run True HEPA purifier          | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
```

### 5.3 Impact Lab (What-If Sandbox)
```text
+-------------------------------------------------------------+
| IMPACT LAB: What-If Personal Exposure Sandbox               |
+-------------------------------------------------------------+
| Routine Toggles:                                            |
| [ Commute Mode: [Metro v] ]  [ Mask: [N95 Tight v] ]         |
| [ Air Purifier: [ON (HEPA) v] ] [ Cooking: [Chimney ON v] ] |
|                                                             |
| COMPARISON RESULTS (Zero-network deterministic math):       |
| +---------------------------------------------------------+ |
| | Estimated Inhaled PM2.5 / Day:                          | |
| | Baseline: 420 µg  ---->  Chosen: 135 µg (-68% drop)     | |
| | Range: [110 µg - 165 µg]  (Assumptions: Breathing 15m³/d)|
| |                                                         | |
| | Avoided Tailpipe Emissions: 380 g CO2e / day            | |
| +---------------------------------------------------------+ |
| [ Explain in Plain Words (AI Grounded Citation) ]           |
+-------------------------------------------------------------+
```

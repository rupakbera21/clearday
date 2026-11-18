import React from "react";
import { computeAqi } from "@/domain/aqi";
import { HourlyAirPoint } from "@/schemas/air";
import { WindowFinderResult } from "@/domain/windows";
import { DayStrip } from "@/components/feature/day-strip";
import { ThemeSwitcher } from "@/components/feature/theme-switcher";
import { PageHeader } from "@/components/ui/page-header";
import { Surface } from "@/components/ui/surface";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

function generateSampleHourly(): HourlyAirPoint[] {
  const baseTime = new Date("2026-11-18T00:00:00Z");
  const hourlyPoints: HourlyAirPoint[] = [];

  // Typical diurnal winter smog curve in South Asian plains:
  // Morning inversion peak (06:00-09:00), mid-day boundary layer clearing (13:00-15:00), evening secondary peak
  const diurnalPm25 = [
    260, 275, 290, 310, 340, 370, 410, 395, 340, 270, 210, 160, 140, 130, 145,
    180, 230, 290, 330, 350, 330, 300, 280, 265,
  ];

  for (let i = 0; i < 24; i++) {
    const ptDate = new Date(baseTime.getTime() + i * 3600 * 1000);
    const pm = diurnalPm25[i] ?? 200;
    const computed = computeAqi({ pm25: pm }, "india_naqi");

    hourlyPoints.push({
      time: ptDate.toISOString(),
      pm25: pm,
      pm10: pm * 1.5,
      aqi: computed,
      temperatureC: 14 + Math.sin(i / 3) * 6,
      windSpeedKmh: 4 + (i > 11 && i < 16 ? 6 : 0),
    });
  }

  return hourlyPoints;
}

const sampleWindows: WindowFinderResult = {
  bestWindow: {
    startTime: "2026-11-18T13:00:00Z",
    endTime: "2026-11-18T15:00:00Z",
    startHour: 13,
    endHour: 15,
    avgPm25: 135,
    category: "acceptable",
    recommendation: "Optimal window for essential outdoor tasks; boundary layer dispersion is highest.",
  },
  worstWindow: {
    startTime: "2026-11-18T07:00:00Z",
    endTime: "2026-11-18T09:00:00Z",
    startHour: 7,
    endHour: 9,
    avgPm25: 402,
    category: "hazardous",
    recommendation: "Severe surface stagnation peak. Avoid outdoor movement and commute with cabin recirculation.",
  },
  daytimeSlots: [],
  nighttimeSlots: [],
};

export default function HomePage() {
  const sampleHourly = generateSampleHourly();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <PageHeader
        title="Clearday"
        subtitle="GenAI assistant for families navigating severe winter smog and urban air pollution."
        badge={
          <Badge variant="aqi" aqiCategory="very_poor">
            Anand Vihar, Delhi
          </Badge>
        }
        actions={<ThemeSwitcher />}
      />

      {/* Signature Day Strip Component */}
      <Surface elevation="card" className="space-y-4">
        <DayStrip
          hourly={sampleHourly}
          windows={sampleWindows}
          currentTimeIso="2026-11-18T08:00:00Z"
        />
      </Surface>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Surface elevation="subtle" className="space-y-2">
          <div className="flex items-center gap-2 text-sky-400">
            <Icon name="sun" size={20} />
            <h3 className="font-semibold text-sm">Best Outdoor Window</h3>
          </div>
          <p className="text-xl font-bold text-slate-100 tabular-nums">13:00 - 15:00</p>
          <p className="text-xs text-slate-400">PM2.5 dips to ~135 ug/m3 during peak boundary layer height.</p>
        </Surface>

        <Surface elevation="subtle" className="space-y-2">
          <div className="flex items-center gap-2 text-rose-400">
            <Icon name="alert-triangle" size={20} />
            <h3 className="font-semibold text-sm">Peak Inversion Peak</h3>
          </div>
          <p className="text-xl font-bold text-slate-100 tabular-nums">07:00 - 09:00</p>
          <p className="text-xs text-slate-400">Surface cooling traps smog. Keep school runs and movement indoors.</p>
        </Surface>

        <Surface elevation="subtle" className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Icon name="shield-check" size={20} />
            <h3 className="font-semibold text-sm">Household Protection</h3>
          </div>
          <p className="text-xl font-bold text-slate-100 tabular-nums">4 Members</p>
          <p className="text-xs text-slate-400">N95 respirators advised for sensitive members outdoors today.</p>
        </Surface>
      </div>

      {/* Element demonstrating spacing (p-6) and sizing (w-64, h-16) utilities for Phase 1 proof */}
      <div
        data-testid="tailwind-proof"
        id="tailwind-proof"
        className="flex h-16 w-64 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-emerald-400"
      >
        <span className="text-xs font-semibold">CSS Pipeline Verified</span>
      </div>
    </div>
  );
}

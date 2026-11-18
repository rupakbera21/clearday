/**
 * @file theme-switcher.tsx
 * @description Accessible theme, contrast mode, and AQI standard selector.
 * Addresses problem-statement: Light, dark, and high-contrast mode with a toggle; standard selection.
 */

"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const theme = useAppStore((state) => state.theme);
  const contrast = useAppStore((state) => state.contrast);
  const standard = useAppStore((state) => state.aqiStandard);
  const setTheme = useAppStore((state) => state.setTheme);
  const setContrast = useAppStore((state) => state.setContrast);
  const setAqiStandard = useAppStore((state) => state.setAqiStandard);

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-contrast", contrast);
  }, [theme, contrast]);

  if (!mounted) {
    return <div className="h-9 w-24 rounded-lg bg-slate-800 animate-pulse" aria-hidden="true" />;
  }

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const toggleContrast = () => {
    const next = contrast === "normal" ? "high" : "normal";
    setContrast(next);
  };

  const toggleStandard = () => {
    const next = standard === "india_naqi" ? "us_aqi" : "india_naqi";
    setAqiStandard(next);
  };

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" role="group" aria-label="Visual and standard preferences">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        leftIcon={<Icon name={theme === "dark" ? "sun" : "moon"} size={16} />}
      >
        <span>{theme === "dark" ? "Light" : "Dark"}</span>
      </Button>

      <Button
        variant={contrast === "high" ? "primary" : "outline"}
        size="sm"
        onClick={toggleContrast}
        aria-label={contrast === "high" ? "Disable high contrast mode" : "Enable high contrast mode"}
        leftIcon={<Icon name="activity" size={16} />}
      >
        <span>{contrast === "high" ? "Normal" : "High Contrast"}</span>
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={toggleStandard}
        aria-label={`Current AQI standard: ${standard === "india_naqi" ? "India NAQI" : "US AQI"}. Click to switch.`}
      >
        <span className="uppercase text-xs font-semibold">{standard === "india_naqi" ? "NAQI" : "US AQI"}</span>
      </Button>
    </div>
  );
}

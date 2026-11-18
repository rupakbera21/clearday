/**
 * @file splash-loader.tsx
 * @description Smooth, calm initial loading screen with circular progress rotating around the Clearday logo.
 * Progresses gracefully from 0% to 100% before fading out.
 */

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

const TOTAL_DURATION_MS = 1800;
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getStatusMessage(progress: number): string {
  if (progress < 40) return "Calibrating atmospheric models...";
  if (progress < 85) return "Loading environmental intelligence...";
  return "Ready";
}

function CircularProgressRing({ strokeDashoffset }: { strokeDashoffset: number }) {
  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg
        className="absolute inset-0 w-full h-full -rotate-90 transform"
        viewBox="0 0 120 120"
        aria-hidden="true"
      >
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="3.5"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 40ms linear",
            filter: "drop-shadow(0 0 4px var(--accent))",
          }}
        />
      </svg>
      <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shadow-md">
        <Image
          src="/icon.png"
          alt="Clearday"
          width={64}
          height={64}
          priority
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}

function useSmoothProgress(onComplete?: () => void) {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const startTime = performance.now();

    const updateProgress = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const ratio = Math.min(1, elapsed / TOTAL_DURATION_MS);
      const eased = Math.sin((ratio * Math.PI) / 2);
      const currentPct = Math.round(eased * 100);

      setProgress(currentPct);

      if (ratio < 1) {
        requestAnimationFrame(updateProgress);
      } else {
        setTimeout(() => setIsFading(true), 150);
        setTimeout(() => {
          setIsDone(true);
          onComplete?.();
        }, 550);
      }
    };

    const frameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(frameId);
  }, [onComplete]);

  return { progress, isFading, isDone };
}

export function SplashLoader({ onComplete }: { onComplete?: () => void }) {
  const { progress, isFading, isDone } = useSmoothProgress(onComplete);

  if (isDone) return null;

  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Loading Clearday: ${progress}%`}
      style={{
        backgroundColor: "var(--bg-canvas)",
        opacity: isFading ? 0 : 1,
        transition: "opacity 400ms ease-out",
        zIndex: 9999,
      }}
      className="fixed inset-0 flex flex-col items-center justify-center select-none pointer-events-auto"
    >
      <CircularProgressRing strokeDashoffset={strokeDashoffset} />

      <div className="mt-6 flex flex-col items-center text-center space-y-1">
        <span
          className="text-lg font-bold tabular-nums tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {progress}%
        </span>
        <p
          className="text-xs font-medium transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          {getStatusMessage(progress)}
        </p>
      </div>
    </div>
  );
}

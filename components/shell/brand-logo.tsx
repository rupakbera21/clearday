"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAppStore } from "@/store/use-app-store";

export function BrandLogo({
  width = 130,
  height = 38,
  className = "h-8 w-auto object-contain",
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  const theme = useAppStore((state) => state.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === "dark" : false;

  return (
    <Image
      src={isDark ? "/logo-dark.png" : "/logo.png"}
      alt="Clearday"
      width={width}
      height={height}
      priority
      className={className}
    />
  );
}

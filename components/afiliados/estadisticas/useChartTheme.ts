"use client";

import { useEffect, useState } from "react";

export type ChartThemeTokens = {
  grid: string;
  tick: string;
  cursor: string;
  empty: string;
  stroke: string;
  labelMuted: string;
  labelIndigo: string;
  labelTeal: string;
  centerText: string;
  hombresLabel: string;
  mujeresLabel: string;
};

const LIGHT: ChartThemeTokens = {
  grid: "#e5e7eb",
  tick: "#6b7280",
  cursor: "rgba(243, 244, 246, 0.9)",
  empty: "#e5e7eb",
  stroke: "#ffffff",
  labelMuted: "#9ca3af",
  labelIndigo: "#4f46e5",
  labelTeal: "#0d9488",
  centerText: "#111827",
  hombresLabel: "#1e40af",
  mujeresLabel: "#9d174d",
};

const DARK: ChartThemeTokens = {
  grid: "#334155",
  tick: "#94a3b8",
  cursor: "rgba(51, 65, 85, 0.45)",
  empty: "#475569",
  stroke: "#0a0a0a",
  labelMuted: "#64748b",
  labelIndigo: "#a5b4fc",
  labelTeal: "#5eead4",
  centerText: "#f5f5f5",
  hombresLabel: "#93c5fd",
  mujeresLabel: "#f9a8d4",
};

export function useChartTheme(): ChartThemeTokens {
  const isDark = useIsDarkMode();
  return isDark ? DARK : LIGHT;
}

export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

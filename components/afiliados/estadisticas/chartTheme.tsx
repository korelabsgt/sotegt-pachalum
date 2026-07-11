"use client";

import type { ReactNode } from "react";

export const CHART_PALETTE = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ef4444",
];

type TooltipPayload = {
  name?: string;
  value?: number;
  payload?: { color?: string; name?: string };
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  accent?: string;
  suffix?: string;
};

export function ChartTooltip({
  active,
  payload,
  label,
  accent,
  suffix,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  if (item.name === "Sin registros") return null;

  const color = accent ?? item.payload?.color ?? CHART_PALETTE[0];
  const name = label ?? item.payload?.name ?? item.name ?? "";
  const value = item.value ?? 0;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 px-4 py-3 shadow-xl dark:shadow-2xl backdrop-blur-md z-50 min-w-[140px]">
      <p className="font-bold text-gray-800 dark:text-neutral-200 mb-2 border-b border-gray-200 dark:border-neutral-700 pb-1.5 uppercase text-[10px] tracking-wide">
        {name}
      </p>
      <p className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-gray-200 dark:ring-neutral-700"
          style={{ backgroundColor: color }}
        />
        <strong className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
          {value}
        </strong>
        {suffix && (
          <span className="text-gray-500 dark:text-neutral-400 text-xs">{suffix}</span>
        )}
      </p>
    </div>
  );
}

export function ChartFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 text-center text-[10px] text-gray-500 dark:text-neutral-500 shrink-0 uppercase font-bold border-t border-gray-100 dark:border-neutral-800 pt-4">
      {children}
    </div>
  );
}

export function ChartHeader({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start mb-4 shrink-0 w-full">
      <div className="flex items-baseline justify-between gap-3 w-full">
        <h4 className="text-xs md:text-xl font-black text-gray-800 dark:text-neutral-100 uppercase tracking-tight">
          {title}
        </h4>
        {trailing}
      </div>
      <p className="text-sm text-gray-500 dark:text-neutral-500 italic">{subtitle}</p>
    </div>
  );
}

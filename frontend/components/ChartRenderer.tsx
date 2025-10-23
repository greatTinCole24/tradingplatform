"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

// Lazily import ECharts on the client so the component works with Next.js
// streaming/SSR. The chart only renders once the browser bundle is ready.
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface ChartRendererProps {
  option: Record<string, unknown> | null | undefined;
}

export function ChartRenderer({ option }: ChartRendererProps) {
  // We memoize the option to prevent unnecessary rerenders when the parent
  // component updates unrelated state (e.g., adding chat messages).
  const chartOption = useMemo(() => option ?? null, [option]);

  if (!chartOption) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border border-dashed border-border bg-background/40 text-muted-foreground">
        No chart available.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background/40 p-2">
      <ReactECharts option={chartOption} style={{ height: 360 }} theme="dark" notMerge lazyUpdate />
    </div>
  );
}

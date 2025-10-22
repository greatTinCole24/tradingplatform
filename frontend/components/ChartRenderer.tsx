"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface ChartRendererProps {
  option: Record<string, unknown> | null | undefined;
}

export function ChartRenderer({ option }: ChartRendererProps) {
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

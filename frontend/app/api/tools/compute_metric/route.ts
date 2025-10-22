import { NextResponse } from "next/server";

import {
  METRIC_REGISTRY,
  computeMetricMock,
  inferExpiryFromDate,
  metricRequiresExpiry,
} from "@/lib/mock-backend";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const metric = body?.metric as string | undefined;
  const ticker = body?.ticker as string | undefined;
  const expiry = body?.expiry as string | undefined;
  const asOf = body?.as_of as string | undefined;

  if (!metric || !ticker) {
    return NextResponse.json({ ok: false, error: "metric and ticker are required" }, { status: 400 });
  }

  if (!(metric in METRIC_REGISTRY)) {
    return NextResponse.json({ ok: false, error: `Unknown metric: ${metric}` }, { status: 400 });
  }

  let resolvedExpiry = expiry;
  const metricKey = metric as keyof typeof METRIC_REGISTRY;

  if (metricRequiresExpiry(metricKey) && !resolvedExpiry) {
    const baseDate = asOf ? new Date(asOf) : new Date();
    resolvedExpiry = inferExpiryFromDate(baseDate);
  }

  try {
    const response = computeMetricMock({
      metric: metricKey,
      ticker,
      expiry: resolvedExpiry,
      as_of: asOf,
    });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to compute metric" },
      { status: 500 },
    );
  }
}

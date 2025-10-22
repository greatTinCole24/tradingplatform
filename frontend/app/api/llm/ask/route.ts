import { NextResponse } from "next/server";

import { computeMetricMock, inferExpiryFromDate, inferToolArguments, metricRequiresExpiry } from "@/lib/mock-backend";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const question = typeof body?.question === "string" ? body.question : "";

  const inferred = inferToolArguments(question);
  let { metric, expiry, ticker } = inferred;
  ticker = ticker || "SPY";

  if (metricRequiresExpiry(metric) && !expiry) {
    expiry = inferExpiryFromDate(new Date());
  }

  const asOf = new Date().toISOString();

  const result = computeMetricMock({
    metric,
    ticker,
    expiry,
    as_of: asOf,
  });

  const toolArgs: Record<string, unknown> = {
    metric,
    ticker,
    ...(expiry ? { expiry } : {}),
    as_of: asOf,
  };

  if (Array.isArray(body?.credentials)) {
    toolArgs.credentials = body.credentials;
  }

  return NextResponse.json({
    ok: true,
    tool_args: toolArgs,
    result_from_tool: result,
  });
}

// Central catalogue of the metrics the mock analytics layer understands. The
// descriptions are reused in the UI tooltips/preset buttons.
export const METRIC_REGISTRY = {
  gex: { desc: "Net gamma exposure (per expiry)" },
  iv_snapshot: { desc: "Implied vol snapshot" },
  options_volume_oi: { desc: "Options vol/OI summary" },
  trend_50_200d: { desc: "50/200D trend bias" },
  vwap_intraday: { desc: "Intraday VWAP" },
} as const;

export type MetricKey = keyof typeof METRIC_REGISTRY;

export interface ComputeMetricParams {
  metric: MetricKey;
  ticker: string;
  expiry?: string;
  as_of?: string;
}

export interface ComputeMetricResponse {
  ok: true;
  as_of: string;
  payload: Record<string, unknown>;
  chart_spec: Record<string, unknown> | null;
  summary: string;
}

// Shape the registry into the same structure the real backend will expose.
export function getRegistryPayload() {
  return { metrics: METRIC_REGISTRY };
}

// Some metrics (gamma, IV) are tied to a specific expiration cycle. This
// helper keeps the logic centralized so the UI and mock LLM share it.
export function metricRequiresExpiry(metric: MetricKey): boolean {
  return metric === "gex" || metric === "iv_snapshot";
}

// When an expiry is missing we synthesize "next Friday" as a reasonable
// default. This matches the behaviour we expect from the eventual backend.
export function inferExpiryFromDate(baseDate: Date): string {
  const date = new Date(baseDate);
  const weekday = date.getUTCDay();
  const daysUntilFriday = (5 - weekday + 7) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilFriday);
  return date.toISOString().slice(0, 10);
}

function formatNumber(value: number, digits = 3) {
  return Number(value.toFixed(digits));
}

function buildStrikeSeries() {
  return Array.from({ length: 11 }, (_, index) => 50 + index * 10);
}

// Generate a simple curve where gamma increases with strike. It provides both
// tabular data and a bar chart spec so the UI can demonstrate both views.
function computeGex(ticker: string) {
  const strikes = buildStrikeSeries();
  const base = ticker.toUpperCase().startsWith("G") ? 1.2 : 1.0;
  const gexValues = strikes.map((strike) => formatNumber(base * Math.pow(1.5, (strike - 100) / 50)));
  const rows = strikes.map((strike, index) => ({
    strike,
    gex_per_strike: gexValues[index],
  }));
  const total = formatNumber(gexValues.reduce((acc, value) => acc + value, 0));
  return {
    payload: {
      rows,
      total_gex: total,
    },
    chart_spec: {
      title: { text: `${ticker.toUpperCase()} Net Gamma vs Strike` },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: strikes },
      yAxis: { type: "value", name: "Gamma" },
      series: [
        {
          type: "bar",
          data: gexValues,
          name: "Net Gamma",
        },
      ],
    },
    summary: `${ticker.toUpperCase()} shows total net gamma of ${total.toFixed(2)} across listed strikes.`,
  };
}

// Produce an implied volatility smile around ATM strikes. The numbers are
// deterministic so screenshots stay stable across runs.
function computeIvSnapshot(ticker: string) {
  const strikes = buildStrikeSeries();
  const ivValues = strikes.map((strike) => formatNumber(0.2 + 0.05 * Math.abs((100 - strike) / 100), 4));
  const mean = ivValues.reduce((acc, value) => acc + value, 0) / ivValues.length;
  return {
    payload: {
      strikes,
      iv: ivValues,
      summary_stats: {
        mean_iv: formatNumber(mean, 4),
        max_iv: Math.max(...ivValues),
        min_iv: Math.min(...ivValues),
      },
    },
    chart_spec: {
      title: { text: `${ticker.toUpperCase()} Implied Volatility` },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: strikes, name: "Strike" },
      yAxis: { type: "value", name: "IV" },
      series: [
        {
          type: "line",
          smooth: true,
          data: ivValues,
          name: "IV",
        },
      ],
    },
    summary: `${ticker.toUpperCase()} implied volatility ranges from ${(Math.min(...ivValues) * 100).toFixed(1)}% to ${(Math.max(...ivValues) * 100).toFixed(1)}%.`,
  };
}

// Minimal options volume vs open-interest snapshot used by the presets.
function computeVolumeOi(ticker: string) {
  const callVolume = 12543;
  const putVolume = 8342;
  const callOi = 50231;
  const putOi = 44211;
  return {
    payload: {
      call_volume: callVolume,
      put_volume: putVolume,
      call_open_interest: callOi,
      put_open_interest: putOi,
    },
    chart_spec: {
      title: { text: `${ticker.toUpperCase()} Volume vs Open Interest` },
      tooltip: { trigger: "axis" },
      legend: { data: ["Volume", "Open Interest"] },
      xAxis: { type: "category", data: ["Calls", "Puts"] },
      yAxis: { type: "value" },
      series: [
        { name: "Volume", type: "bar", data: [callVolume, putVolume] },
        { name: "Open Interest", type: "bar", data: [callOi, putOi] },
      ],
    },
    summary: `${ticker.toUpperCase()} call volume ${callVolume.toLocaleString()} vs put volume ${putVolume.toLocaleString()}.`,
  };
}

// Trend view keeps things simple: mock moving averages and a qualitative
// direction for quick narration.
function computeTrend(ticker: string) {
  const days = 30;
  const prices = Array.from({ length: days }, (_, index) => formatNumber(120 + Math.sin(index / 5) * 4 + index * 0.2, 2));
  const ma50 = formatNumber(prices.reduce((acc, value) => acc + value, 0) / prices.length, 2);
  const ma200 = formatNumber(ma50 - 2.5, 2);
  const trendDirection = ma50 > ma200 ? "bullish" : "bearish";
  return {
    payload: {
      lookback_days: days,
      price_samples: prices,
      moving_average_50d: ma50,
      moving_average_200d: ma200,
      trend: trendDirection,
    },
    chart_spec: null,
    summary: `${ticker.toUpperCase()} 50/200-day trend skew is ${trendDirection} (50D ${ma50} vs 200D ${ma200}).`,
  };
}

// Intraday VWAP example with a handful of scalar values — great for showing
// that not every tool needs to return a chart.
function computeVwap(ticker: string) {
  const lastPrice = formatNumber(118.42, 2);
  const vwap = formatNumber(117.93, 2);
  const volume = 3_420_000;
  return {
    payload: {
      last_trade_price: lastPrice,
      vwap,
      intraday_volume: volume,
    },
    chart_spec: null,
    summary: `${ticker.toUpperCase()} VWAP at ${vwap} vs last trade ${lastPrice}.`,
  };
}

// Single entry point that mirrors the real `/tools/compute_metric` endpoint.
// The UI only talks to this function, so swapping in network calls later is
// trivial.
export function computeMetricMock(params: ComputeMetricParams): ComputeMetricResponse {
  const { metric, ticker, expiry } = params;
  const asOfDate = params.as_of ? new Date(params.as_of) : new Date();
  const asOfIso = asOfDate.toISOString();
  const upperTicker = ticker.toUpperCase();

  let result: { payload: Record<string, unknown>; chart_spec: Record<string, unknown> | null; summary: string };

  switch (metric) {
    case "gex":
      result = computeGex(upperTicker);
      break;
    case "iv_snapshot":
      result = computeIvSnapshot(upperTicker);
      break;
    case "options_volume_oi":
      result = computeVolumeOi(upperTicker);
      break;
    case "trend_50_200d":
      result = computeTrend(upperTicker);
      break;
    case "vwap_intraday":
      result = computeVwap(upperTicker);
      break;
    default:
      throw new Error(`Unsupported metric: ${metric}`);
  }

  const payload = {
    ...result.payload,
    ...(expiry ? { expiry } : {}),
  };

  return {
    ok: true,
    as_of: asOfIso,
    payload,
    chart_spec: result.chart_spec,
    summary: result.summary,
  };
}

// Extremely lightweight natural-language router. We only look for ticker
// symbols, ISO-formatted expiries, and key metric words so the behaviour is
// predictable for demos.
export function inferToolArguments(question: string) {
  const normalized = question.toLowerCase();
  let metric: MetricKey = "gex";

  if (normalized.includes("vwap")) {
    metric = "vwap_intraday";
  } else if (normalized.includes("trend") || normalized.includes("50") || normalized.includes("200")) {
    metric = "trend_50_200d";
  } else if (normalized.includes("volume") || normalized.includes("open interest") || normalized.includes("oi")) {
    metric = "options_volume_oi";
  } else if (normalized.includes("implied vol") || normalized.includes("iv")) {
    metric = "iv_snapshot";
  } else if (normalized.includes("gamma")) {
    metric = "gex";
  }

  const tickerMatch = question.match(/\b([A-Z]{1,5})\b/);
  const ticker = tickerMatch ? tickerMatch[1] : "SPY";

  const expiryMatch = question.match(/(\d{4}-\d{2}-\d{2})/);
  const expiry = expiryMatch ? expiryMatch[1] : undefined;

  return { metric, ticker, expiry };
}

import {
  METRIC_REGISTRY,
  computeMetricMock,
  getRegistryPayload,
  inferExpiryFromDate,
  inferToolArguments,
  metricRequiresExpiry,
  type MetricKey,
} from "./mock-backend";

export interface Credential {
  provider: string;
  apiKey: string;
}

const rawBase = process.env.NEXT_PUBLIC_API_BASE ?? "/api";
const API_BASE = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

function isMetricKey(value: string): value is MetricKey {
  return Object.prototype.hasOwnProperty.call(METRIC_REGISTRY, value);
}

function logFallback(context: string, error: unknown) {
  console.warn(`[api] Falling back to mock ${context}:`, error);
}

export async function getRegistry() {
  try {
    const response = await fetch(`${API_BASE}/tools/registry`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load registry: ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as { metrics: Record<string, { desc: string }> };
  } catch (error) {
    logFallback("registry", error);
    return getRegistryPayload();
  }
}

export interface ComputeMetricBody {
  metric: string;
  ticker: string;
  expiry?: string;
  as_of?: string;
}

export async function postComputeMetric(body: ComputeMetricBody, credentials?: Credential[]) {
  const payload = {
    ...body,
    credentials: credentials ?? readCredentials(),
  };
  try {
    const response = await fetch(`${API_BASE}/tools/compute_metric`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Metric request failed: ${response.status} ${detail}`);
    }
    return response.json();
  } catch (error) {
    logFallback("metric", error);
    const metric = payload.metric;
    const ticker = payload.ticker;
    if (!metric || !ticker || !isMetricKey(metric)) {
      throw new Error("Metric request failed and mock fallback was unavailable.");
    }
    let resolvedExpiry = payload.expiry;
    if (metricRequiresExpiry(metric) && !resolvedExpiry) {
      resolvedExpiry = inferExpiryFromDate(new Date());
    }
    return computeMetricMock({
      metric,
      ticker,
      expiry: resolvedExpiry,
      as_of: payload.as_of,
    });
  }
}

export async function postAskLLM(question: string, credentials?: Credential[]) {
  const payload = {
    question,
    credentials: credentials ?? readCredentials(),
  };
  try {
    const response = await fetch(`${API_BASE}/llm/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`LLM request failed: ${response.status} ${detail}`);
    }
    return response.json();
  } catch (error) {
    logFallback("LLM", error);
    const inferred = inferToolArguments(question ?? "");
    let { metric, ticker, expiry } = inferred;
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
    if (Array.isArray(payload.credentials) && payload.credentials.length > 0) {
      toolArgs.credentials = payload.credentials;
    }
    return {
      ok: true,
      tool_args: toolArgs,
      result_from_tool: result,
    };
  }
}

export function readCredentials(): Credential[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = window.localStorage.getItem("apiCredentials");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as Credential[]) : [];
  } catch (error) {
    console.error("Failed to read credentials", error);
    return [];
  }
}

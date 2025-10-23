import {
  METRIC_REGISTRY,
  computeMetricMock,
  getRegistryPayload,
  inferExpiryFromDate,
  inferToolArguments,
  metricRequiresExpiry,
  type ComputeMetricResponse,
  type MetricKey,
} from "./mock-backend";

export interface Credential {
  provider: string;
  apiKey: string;
}

function isMetricKey(value: string): value is MetricKey {
  return Object.prototype.hasOwnProperty.call(METRIC_REGISTRY, value);
}

export type RegistryPayload = ReturnType<typeof getRegistryPayload>;

export async function getRegistry(): Promise<RegistryPayload> {
  return getRegistryPayload();
}

export interface ComputeMetricBody {
  metric: string;
  ticker: string;
  expiry?: string;
  as_of?: string;
}

export type ComputeMetricPayload = ComputeMetricBody & { credentials?: Credential[] };

export async function postComputeMetric(
  body: ComputeMetricBody,
  credentials?: Credential[],
): Promise<ComputeMetricResponse> {
  const payload = {
    ...body,
    credentials: credentials ?? readCredentials(),
  };
  return computeFromMock(payload);
}

export interface AskLLMResponse {
  ok: true;
  tool_args: ComputeMetricPayload;
  result_from_tool: ComputeMetricResponse;
}

export async function postAskLLM(question: string, credentials?: Credential[]): Promise<AskLLMResponse> {
  const payload = {
    question,
    credentials: credentials ?? readCredentials(),
  };
  return askMockLLM(payload);
}

function computeFromMock(payload: ComputeMetricPayload): ComputeMetricResponse {
  const metric = payload.metric;
  const ticker = payload.ticker;
  if (!metric || !ticker || !isMetricKey(metric)) {
    throw new Error("Metric request failed and mock fallback was unavailable.");
  }
  let resolvedExpiry = payload.expiry;
  const metricKey = metric as MetricKey;
  if (metricRequiresExpiry(metricKey) && !resolvedExpiry) {
    resolvedExpiry = inferExpiryFromDate(new Date());
  }
  return computeMetricMock({
    metric: metricKey,
    ticker,
    expiry: resolvedExpiry,
    as_of: payload.as_of,
  });
}

function askMockLLM(payload: { question: string; credentials?: Credential[] }): AskLLMResponse {
  const inferred = inferToolArguments(payload.question ?? "");
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
  const toolArgs: ComputeMetricPayload = {
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

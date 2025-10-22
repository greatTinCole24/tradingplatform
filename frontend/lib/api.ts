export interface Credential {
  provider: string;
  apiKey: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export async function getRegistry() {
  const response = await fetch(`${API_BASE}/tools/registry`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load registry: ${response.statusText}`);
  }
  return (await response.json()) as { metrics: Record<string, { desc: string }> };
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
}

export async function postAskLLM(question: string, credentials?: Credential[]) {
  const payload = {
    question,
    credentials: credentials ?? readCredentials(),
  };
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

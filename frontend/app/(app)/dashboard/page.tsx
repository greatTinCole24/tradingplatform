"use client";

import { useEffect, useMemo, useState } from "react";
import { ChartRenderer } from "@/components/ChartRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Credential, getRegistry, postAskLLM, postComputeMetric, readCredentials } from "@/lib/api";

const EXAMPLES = [
  "Build me a dashboard for net gamma on GOOGL for the nearest expiry as of now.",
  "Show implied volatility snapshot for TSLA 2025-10-24.",
  "Summarize today’s options volume vs OI for NVDA.",
];

type MetricOption = {
  key: string;
  desc: string;
};

type ResultState = Record<string, unknown> | null;

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricOption[]>([]);
  const [loadingRegistry, setLoadingRegistry] = useState(true);
  const [ticker, setTicker] = useState("GOOGL");
  const [metric, setMetric] = useState("gex");
  const [expiry, setExpiry] = useState("");
  const [question, setQuestion] = useState(EXAMPLES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResultState>(null);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);

  useEffect(() => {
    async function loadRegistry() {
      try {
        const response = await getRegistry();
        const options = Object.entries(response.metrics).map(([key, value]) => ({
          key,
          desc: value.desc,
        }));
        setMetrics(options);
        if (options.length > 0) {
          setMetric(options[0].key);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load registry");
      } finally {
        setLoadingRegistry(false);
      }
    }
    loadRegistry();
  }, []);

  useEffect(() => {
    const syncCredentials = () => {
      setCredentials(readCredentials());
    };
    syncCredentials();
    window.addEventListener("storage", syncCredentials);
    return () => window.removeEventListener("storage", syncCredentials);
  }, []);

  const chartOption = useMemo(() => {
    if (!result) return null;
    if ("chart_spec" in result) {
      return result.chart_spec as Record<string, unknown> | null;
    }
    if ("result_from_tool" in result && result.result_from_tool) {
      const nested = result.result_from_tool as Record<string, unknown>;
      if (nested.chart_spec) {
        return nested.chart_spec as Record<string, unknown>;
      }
    }
    return null;
  }, [result]);

  const runCompute = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await postComputeMetric({ metric, ticker, expiry: expiry || undefined }, credentials);
      setResult(response);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to compute metric");
    } finally {
      setIsLoading(false);
    }
  };

  const runLLM = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await postAskLLM(question, credentials);
      setResult(response);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "LLM request failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-10">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-primary">Dashboard</p>
        <h1 className="text-3xl font-semibold">Ask a question or run a tool directly.</h1>
        <p className="max-w-4xl text-sm text-muted-foreground">
          Metrics run against the built-in mock analytics helpers. Credentials are automatically attached from your browser storage
          so you can mirror real usage later.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
        <Card className="border border-border/60 bg-black/30">
          <CardHeader>
            <CardTitle>Direct Tool Runner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="ticker">Ticker</Label>
              <Input id="ticker" value={ticker} onChange={(event) => setTicker(event.target.value.toUpperCase())} />
            </div>
            <div className="grid gap-2">
              <Label>Metric</Label>
              <Select value={metric} onValueChange={(value) => setMetric(value)} disabled={loadingRegistry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a metric" />
                </SelectTrigger>
                <SelectContent>
                  {metrics.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      <div>
                        <p className="font-medium">{option.key}</p>
                        <p className="text-xs text-muted-foreground">{option.desc}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiry">Expiry (optional)</Label>
              <Input
                id="expiry"
                placeholder="YYYY-MM-DD"
                value={expiry}
                onChange={(event) => setExpiry(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={runCompute} disabled={isLoading || loadingRegistry}>
                Run Query (Direct Tool)
              </Button>
              <Button variant="secondary" onClick={runLLM} disabled={isLoading}>
                Ask the LLM
              </Button>
            </div>
            <Card className="border border-border/60 bg-background/60">
              <CardHeader>
                <CardTitle className="text-sm">LLM Prompt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea value={question} onChange={(event) => setQuestion(event.target.value)} />
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((example) => (
                    <Button key={example} variant="outline" size="sm" onClick={() => setQuestion(example)}>
                      {example}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="rounded-lg border border-border/60 bg-background/60 p-4 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Attached credentials</p>
              {credentials.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {credentials.map((cred) => (
                    <li key={`${cred.provider}-${cred.apiKey.slice(0, 4)}`}>{cred.provider}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">No credentials stored. Add them on the Connect page.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-border/60 bg-black/30">
            <CardHeader>
              <CardTitle>Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartRenderer option={chartOption} />
            </CardContent>
          </Card>
          <Card className="border border-border/60 bg-black/30">
            <CardHeader>
              <CardTitle>Raw Response</CardTitle>
            </CardHeader>
            <CardContent>
              {error && <p className="mb-3 rounded-md border border-destructive/40 bg-destructive/20 p-3 text-destructive">{error}</p>}
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Running query...</p>
              ) : result ? (
                <pre className="max-h-[420px] overflow-auto rounded-lg bg-slate-950/60 p-4 text-xs leading-relaxed">
                  {JSON.stringify(result, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">No results yet. Run a tool or ask the LLM.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

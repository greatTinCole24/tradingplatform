"use client";

import { useMemo, useState } from "react";
import { ChartRenderer } from "@/components/ChartRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  type ComputeMetricResponse,
  METRIC_REGISTRY,
} from "@/lib/mock-backend";
import { postAskLLM, postComputeMetric, type ComputeMetricPayload } from "@/lib/api";
import { cn } from "@/lib/utils";

// Example prompts that appear as quick-fill buttons for fast demos.
const EXAMPLES = [
  "Build me a dashboard for net gamma on GOOGL for the nearest expiry as of now.",
  "Show implied volatility snapshot for TSLA 2025-10-24.",
  "Summarize today’s options volume vs OI for NVDA.",
  "Give me today’s VWAP for AAPL.",
];

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  detail?: string;
};

// Seed the conversation with a greeting so the chat area is never empty.
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hi! Ask for gamma exposure, IV, volume vs OI, VWAP, or trend. I’ll wire up the right mock metric, render a chart, and summarize the key takeaways.",
  },
];

// Turn the raw tool arguments into a short, human readable string that
// we can show beneath each assistant bubble (e.g., "Metric: gex • Ticker: SPY").
function formatToolDetail(result: ComputeMetricResponse | null, toolArgs: ComputeMetricPayload | null) {
  if (!result || !toolArgs) return undefined;
  const pieces: string[] = [];
  if (toolArgs.metric && toolArgs.metric in METRIC_REGISTRY) {
    pieces.push(
      `Metric: ${toolArgs.metric} — ${METRIC_REGISTRY[toolArgs.metric as keyof typeof METRIC_REGISTRY].desc}`,
    );
  }
  if (toolArgs.ticker) {
    pieces.push(`Ticker: ${toolArgs.ticker}`);
  }
  if (toolArgs.expiry) {
    pieces.push(`Expiry: ${toolArgs.expiry}`);
  }
  return pieces.join(" \u2022 ");
}

// Render the structured payload area to the right of the chat pane. When the
// mock analytics returns tabular `rows` data we build a small table, otherwise
// we fall back to dumping the JSON payload so the structure is transparent.
function renderPayload(result: ComputeMetricResponse | null) {
  if (!result) {
    return (
      <p className="text-sm text-muted-foreground">Submit a request to see structured analytics output.</p>
    );
  }

  const { payload } = result;
  if (Array.isArray((payload as { rows?: unknown[] }).rows)) {
    const rows = (payload as { rows: Record<string, unknown>[] }).rows;
    if (rows.length === 0) {
      return <p className="text-sm text-muted-foreground">No rows returned.</p>;
    }
    const columns = Object.keys(rows[0] ?? {});
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/60 text-sm">
          <thead className="bg-background/60">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-3 py-2 text-left font-medium uppercase tracking-wider text-muted-foreground">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column} className="px-3 py-2">
                    {String(row[column as keyof typeof row])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <pre className="max-h-80 overflow-y-auto rounded-md bg-black/60 p-4 text-xs">{JSON.stringify(payload, null, 2)}</pre>
  );
}

export default function HomePage() {
  // All chat bubbles in the transcript. Starts with `INITIAL_MESSAGES` above
  // and grows every time the user submits a question or clicks a preset.
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  // What the user is currently typing into the textarea.
  const [input, setInput] = useState(EXAMPLES[0]);
  // The latest structured analytics payload returned by the mock backend.
  const [result, setResult] = useState<ComputeMetricResponse | null>(null);
  // Simple UI state toggles.
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize the ECharts option so we only re-render the chart when the
  // payload actually changes.
  const chartOption = useMemo(() => result?.chart_spec ?? null, [result]);

  // Submit the free-form chat prompt. The helper automatically infers a metric,
  // runs the mock tool, and then we append both the user and assistant messages
  // to the transcript.
  const handleSubmit = async () => {
    const question = input.trim();
    if (!question) return;
    const userMessage: ChatMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await postAskLLM(question);
      const mockResult = response.result_from_tool;
      const detail = formatToolDetail(mockResult, response.tool_args);
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: mockResult.summary,
        detail,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setResult(mockResult);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I couldn’t generate analytics for that request.",
          detail: message,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // When the user clicks a preset metric button we bypass the LLM inference
  // and call the metric mock directly so the turnaround is instant.
  const runQuickMetric = async (metric: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const mockResponse = await postComputeMetric({ metric, ticker: "SPY" });
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: mockResponse.summary,
        detail: formatToolDetail(mockResponse, { metric, ticker: "SPY" }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setResult(mockResponse);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to run metric";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-primary">Prototype</p>
        <h1 className="text-4xl font-semibold md:text-5xl">Trading analytics copilot (mock MVP)</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Ask in natural language to get sample analytics, charts, and summaries—no backend required.
        </p>
      </header>

      {/* Quick examples that populate the textarea when clicked. */}
      <section className="flex flex-wrap items-center justify-center gap-2">
        {EXAMPLES.map((example) => (
          <Button
            key={example}
            variant="outline"
            size="sm"
            onClick={() => setInput(example)}
            className="text-xs md:text-sm"
          >
            {example}
          </Button>
        ))}
      </section>

      {/* Two-column layout: chat on the left, visualization/output/presets on the right. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <Card className="border border-border/60 bg-black/40">
          <CardHeader>
            <CardTitle>Chat workspace</CardTitle>
          </CardHeader>
          <CardContent className="flex h-[520px] flex-col gap-4">
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              {messages.map((message, index) => (
                <div key={index} className="space-y-2">
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed md:text-base",
                      message.role === "assistant"
                        ? "ml-0 bg-primary/10 text-primary"
                        : "ml-auto bg-white/5 text-foreground",
                    )}
                  >
                    {message.content}
                  </div>
                  {message.detail ? (
                    <div className="ml-0 text-xs text-muted-foreground md:text-sm">{message.detail}</div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask for gamma exposure on TSLA next week, IV snapshots, VWAP, etc."
                className="min-h-[120px]"
              />
              <div className="flex items-center gap-3">
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? "Thinking..." : "Generate insight"}
                </Button>
                {error ? <span className="text-sm text-red-400">{error}</span> : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="border border-border/60 bg-black/40">
            <CardHeader>
              <CardTitle>Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartRenderer option={chartOption} />
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-black/40">
            <CardHeader>
              <CardTitle>Structured output</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {renderPayload(result)}
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-black/40">
            <CardHeader>
              <CardTitle>Quick metric presets</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Object.entries(METRIC_REGISTRY).map(([key, value]) => (
                <Button
                  key={key}
                  variant="secondary"
                  size="sm"
                  onClick={() => runQuickMetric(key)}
                  disabled={isLoading}
                >
                  {value.desc}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

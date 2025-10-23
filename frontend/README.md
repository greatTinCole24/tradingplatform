# Trading Analytics Frontend

This folder houses a single-page Next.js 14 prototype that simulates an “LLM +
tool calling” trading copilot entirely in the browser. The goal is to give you a
complete working reference that you can tweak or rewrite while understanding how
each moving piece fits together.

---

## High-level flow

1. **User prompt** — Typed into the chat textarea on `/`.
2. **LLM stub** — `lib/api.ts` → `askMockLLM()` pattern-matches the question and
   picks the correct metric + ticker (mirroring what the real backend would
   infer from OpenAI tool-calling).
3. **Metric execution** — `lib/mock-backend.ts` generates deterministic sample
   data, chart specs, and summaries per metric.
4. **UI render** — `app/page.tsx` updates the chat transcript, renders the
   ECharts visualization (`components/ChartRenderer.tsx`), and shows the raw
   payload in a table/JSON block.

Because every step is self-contained, you can swap in a real backend later by
replacing `lib/api.ts` without touching the rest of the UI.

---

## Key files

| File | What it teaches |
| --- | --- |
| `app/page.tsx` | Chat workspace layout, state management, how the UI consumes tool results. The file is thoroughly commented inline. |
| `lib/api.ts` | Abstraction layer for talking to the backend. Currently calls the mock helpers but keeps the same shape as the eventual REST API. |
| `lib/mock-backend.ts` | Deterministic mock data generators for each metric plus a tiny “natural language router.” Every function is documented so you know what to replace with real data sources. |
| `components/ChartRenderer.tsx` | Thin wrapper around `echarts-for-react`, shows how to lazily render charts in Next.js. |
| `components/ui/*` | shadcn/ui primitives copied locally so the design system is portable. |

---

## Running the prototype locally

Prerequisites:

- Node.js 18+
- pnpm (recommended) or npm

```bash
cd frontend
pnpm install   # or npm install
pnpm dev       # or npm run dev
```

Visit http://localhost:3000. Everything runs client-side—no environment
variables or separate backend required.

---

## Understanding the mock analytics

- **Metrics available:** gamma exposure (`gex`), implied vol snapshot
  (`iv_snapshot`), options volume vs open interest (`options_volume_oi`), 50/200
  day trend (`trend_50_200d`), intraday VWAP (`vwap_intraday`). See
  `METRIC_REGISTRY` for the canonical list.
- **Data shape:** Each metric returns `{ ok, as_of, payload, chart_spec, summary }`.
  The UI renders `summary` inside the chat, `chart_spec` through ECharts, and
  `payload` in the table/JSON viewer.
- **Expiry inference:** Gamma and IV require an expiry. If the prompt omits it,
  we synthesize the next Friday via `inferExpiryFromDate()` so the UI always has
  something to display.
- **Natural language routing:** `inferToolArguments()` looks for keywords,
  tickers (simple `A-Z{1,5}` regex), and ISO dates. The comments explain each
  rule so you can expand the parser later.

---

## Rewriting or extending the app

1. **Replace the mocks with real APIs:** Implement `getRegistry()`,
   `postComputeMetric()`, and `postAskLLM()` using `fetch` calls. The rest of the
   app will keep working because the types and return shapes match.
2. **Add new metrics:** Extend `METRIC_REGISTRY`, provide a new compute helper,
   and update `inferToolArguments()` to recognise any new keywords.
3. **Swap out the UI:** `app/page.tsx` can be refactored into multiple routes or
   components. Follow the inline comments to understand how state flows from the
   chat into the visualization area.
4. **Introduce persistence/auth:** Replace the localStorage logic inside
   `readCredentials()` with real authentication once you have a backend.

---

## Troubleshooting checklist

- Seeing 404s for API calls in production? Confirm `NEXT_PUBLIC_API_BASE` points
  to a deployed backend or keep using the mock helpers.
- Charts not rendering? Ensure `echarts-for-react` is installed and that the
  data includes an `option` object. `ChartRenderer` logs nothing by design, so
  inspect the payload viewer to debug.
- Prompt isn’t routed correctly? Check the regex in `inferToolArguments()` and
  adjust keyword detection.

---

## License

This prototype is MIT-licensed. Use it as a reference, modify it, or scrap it as
you rewrite the final implementation.

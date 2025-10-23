# Trading Analytics Prototype Monorepo

This repository contains a mock trading analytics experience that demonstrates
an LLM-driven tool calling workflow without requiring any external services.
It is intentionally verbose—both the code and documentation are annotated—so
that you can quickly understand the moving parts and rewrite or extend the
project.

## Repository layout

| Path | Description |
| --- | --- |
| `backend/` | FastAPI scaffold that mirrors the production API surface. It is optional for the mock MVP but ready to be wired up later. |
| `frontend/` | Next.js 14 single-page app that showcases the chat workspace, mock analytics, and chart rendering. |

Only the frontend is needed for the in-browser MVP; the backend exists as a
reference implementation for future integration.

## Getting started quickly

```bash
# Frontend
cd frontend
pnpm install   # or npm install
pnpm dev       # or npm run dev
```

Visit http://localhost:3000 to explore the chat-driven analytics demo. All data
and charts come from deterministic mock helpers located in
`frontend/lib/mock-backend.ts`.

## Understanding the flow

1. The user submits a natural-language prompt ("show gamma for GOOGL") in the
   chat UI (`frontend/app/page.tsx`).
2. The frontend calls helper functions in `frontend/lib/api.ts`, which currently
   execute the mock analytics locally but follow the same return types as the
   FastAPI backend.
3. `frontend/lib/mock-backend.ts` generates the sample dataset, builds an
   ECharts `chart_spec`, and returns a human-readable summary.
4. The UI renders the summary as a chat bubble, displays the chart through
   `frontend/components/ChartRenderer.tsx`, and shows the structured payload in a
   table/JSON view.

Swap out step 2 with real network requests when you are ready to hook up the
backend.

## Deep-dive documentation

The frontend README (`frontend/README.md`) walks through the mock analytics in
more detail, including:

- How prompts are parsed into tool calls.
- The exact payload shape each metric returns.
- Suggested extension points when you build the production version.

## License

MIT — free to use, remix, and extend.

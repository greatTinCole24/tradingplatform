# Trading Analytics Frontend

This Next.js 14 application is a self-contained prototype that turns natural-language prompts into mock trading analytics, charts,
and summaries—perfect for demos before wiring up a real backend.

## Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

## Setup

```bash
cd frontend
pnpm install  # or npm install
```

## Development

```bash
pnpm dev  # or npm run dev
```

The app runs on http://localhost:3000 and serves all data from the built-in mock analytics layer. No separate backend is required
for this MVP experience.

### What you get

- Chat-style interface that interprets prompts ("show gamma for GOOGL") and picks an appropriate mock metric.
- ECharts visualizations for gamma, IV, and volume/open-interest snapshots with tabular payloads alongside.
- Quick metric preset buttons for one-click demos without typing a prompt.

To integrate a live API later, replace the mock calls in `lib/api.ts` with real network requests. Until then, everything runs fully
in-browser.

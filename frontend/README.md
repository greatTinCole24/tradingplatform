# Trading Analytics Frontend

This Next.js 14 application provides a dashboard for experimenting with LLM-driven trading analytics metrics.

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

The app runs on http://localhost:3000 and serves all data from the built-in mock analytics layer. No separate backend is required for this MVP experience.
If you eventually wire up a real API, update the helpers in `lib/api.ts` to call your service and remove the mock shortcuts.

Saved API credentials are stored in `localStorage` under the key `apiCredentials`.

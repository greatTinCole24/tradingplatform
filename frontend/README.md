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

The app runs on http://localhost:3000 and, by default, serves all data from the built-in mock analytics layer. No separate backend is required for the MVP experience.
If you want to integrate with a deployed FastAPI service later, set `NEXT_PUBLIC_API_BASE` to the backend origin (for example, `https://your-fastapi-host`). When that variable is defined, the client will call the remote API and automatically fall back to the mock logic if the request fails.

Saved API credentials are stored in `localStorage` under the key `apiCredentials`.

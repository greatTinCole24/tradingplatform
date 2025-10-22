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

The app runs on http://localhost:3000 and defaults to the built-in mock API exposed via Next.js route handlers.
To point at a real backend, set `NEXT_PUBLIC_API_BASE` to the backend origin (for example, `https://your-fastapi-host`).

Saved API credentials are stored in `localStorage` under the key `apiCredentials`.

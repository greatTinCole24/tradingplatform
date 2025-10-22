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

The app runs on http://localhost:3000 and calls the FastAPI backend on http://localhost:8000.

Saved API credentials are stored in `localStorage` under the key `apiCredentials`.

# QuantHub 📊

**Connect & Query Quant APIs with Natural Language**

A lightweight, modern dashboard that lets you connect any quant API and query financial data using natural language. Built for instant deployment on Vercel.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)

## ✨ Features

- 🔌 **Connect Any Quant API** - Add APIs with just a base URL and API key
- 🧪 **Test Connections** - Validate APIs before saving
- 💬 **Natural Language Queries** - Ask questions in plain English
- 📈 **Auto-Generated Charts** - LLM builds visualizations from your queries
- 💾 **Save & Share Dashboards** - Manage multiple analyses
- 🎨 **Beautiful UI** - Modern dark theme with Tailwind CSS
- ⚡ **Fast & Lightweight** - No job queues, no cron, just instant results

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Vercel account (free tier works!)
- OpenAI API key
- Google OAuth credentials (optional, for authentication)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd tradingplatform
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Database (Get this from Vercel Postgres)
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenAI
OPENAI_API_KEY="sk-..."
```

### 3. Set Up Database

```bash
# Push the Prisma schema to your database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deploy to Vercel

### Method 1: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Method 2: Using Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and click "New Project"
3. Import your GitHub repository
4. Configure environment variables in the Vercel dashboard
5. Click "Deploy"

### Post-Deployment Setup

1. **Add Vercel Postgres** (if not already added):
   - Go to your project in Vercel dashboard
   - Click "Storage" → "Create Database" → "Postgres"
   - Environment variables will be automatically added

2. **Run Database Migration**:
   ```bash
   # From your local machine
   vercel env pull .env.local
   npx prisma db push
   ```

3. **Set Up Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable "Google+ API"
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
   - Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Vercel environment variables

4. **Generate NextAuth Secret**:
   ```bash
   openssl rand -base64 32
   ```
   Add this as `NEXTAUTH_SECRET` in Vercel environment variables

5. **Redeploy** for environment variables to take effect

## 🎯 Usage

### 1. Sign In

Visit your deployed app and sign in with Google.

### 2. Connect an API

1. Click "+ Connect API"
2. Enter:
   - **Name**: A friendly name (e.g., "Alpha Vantage")
   - **Base URL**: Your API's base URL (e.g., `https://api.example.com/v1`)
   - **API Key**: Your API key/token
   - **Description**: Optional description
3. Click "Test Connection" to verify
4. Click "Save Connection"

### 3. Query Your Data

Ask questions in natural language:

- "Show me AAPL price vs SPY for the last 6 months"
- "Compare Bitcoin and Ethereum prices year-to-date"
- "What were the top gainers in tech sector this week?"

The LLM will:
1. Fetch data from your connected APIs
2. Process and format the data
3. Generate an appropriate chart
4. Save it as a dashboard

### 4. View Saved Dashboards

All your queries are automatically saved as dashboards. View, rename, or delete them from the dashboard list.

## 🏗️ Architecture

```
/app
  /api
    /auth/[...nextauth]  # NextAuth authentication
    /connections         # API connection management
    /test                # Test API connections
    /query               # LLM-powered query execution
    /dashboards          # Dashboard CRUD operations
  /dashboard             # Main dashboard page
  /login                 # Login page
  layout.tsx             # Root layout
  globals.css            # Global styles

/components
  DashboardClient.tsx    # Main dashboard UI
  ApiForm.tsx            # API connection form
  QueryBox.tsx           # Natural language query input
  ChartRenderer.tsx      # Chart visualization
  TablePreview.tsx       # Data table display
  SavedDashboards.tsx    # Saved dashboards list
  /ui                    # shadcn/ui components

/lib
  /llm
    tools.ts             # LLM tools for data fetching & charting
  auth.ts                # NextAuth configuration
  prisma.ts              # Prisma client
  utils.ts               # Utility functions

/prisma
  schema.prisma          # Database schema
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Vercel Postgres + Prisma
- **Authentication**: NextAuth.js
- **LLM**: OpenAI (GPT-4 with function calling)
- **Charts**: Recharts
- **Deployment**: Vercel

## 🔒 Security Notes

⚠️ **Important**: This is an MVP. For production use, consider:

1. **Encrypt API Keys**: Currently stored in plaintext. Use encryption at rest.
2. **Rate Limiting**: Add rate limiting to API routes
3. **Input Validation**: Add more robust input validation with Zod
4. **CORS**: Configure CORS properly for your domain
5. **API Key Rotation**: Implement API key rotation policies
6. **Error Handling**: Add more comprehensive error handling
7. **Logging**: Add proper logging and monitoring

## 🎨 Customization

### Adding Custom API Integrations

Edit `lib/llm/tools.ts` to add custom API integration logic:

```typescript
export async function executeFetchApiData(
  endpoint: string,
  params: Record<string, any> | undefined,
  apiConnection: { baseUrl: string; apiKey: string }
): Promise<any> {
  // Add your custom API logic here
  // Handle different API authentication methods
  // Parse different response formats
}
```

### Customizing Chart Types

Edit `components/ChartRenderer.tsx` to add more chart types:

```typescript
// Add new chart types: area, scatter, pie, etc.
import { AreaChart, Area, ScatterChart, Scatter } from "recharts";
```

## 📊 Example Queries

Here are some example queries you can try:

1. **Time Series Comparison**
   - "Compare AAPL and MSFT stock prices over the last year"
   - "Show me Bitcoin vs Ethereum for the past 6 months"

2. **Single Symbol Analysis**
   - "Display Tesla stock price for the last quarter"
   - "Show me Google's stock performance this year"

3. **Market Overview**
   - "What are the trending stocks today?"
   - "Show me the S&P 500 performance this month"

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npx prisma generate

# Push schema
npx prisma db push
```

### Build Errors on Vercel

1. Check environment variables are set correctly
2. Ensure `NEXTAUTH_URL` matches your deployment URL
3. Run `npm run build` locally to test

### Authentication Not Working

1. Verify Google OAuth redirect URIs include your deployment URL
2. Check `NEXTAUTH_SECRET` is set
3. Ensure `NEXTAUTH_URL` is correct

## 📝 License

MIT License - feel free to use this project for your own purposes!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, Vercel, and OpenAI


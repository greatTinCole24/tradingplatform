# 🚀 Deployment Guide - QuantHub

Complete step-by-step guide to deploy QuantHub to Vercel in under 10 minutes.

## Prerequisites Checklist

- [ ] GitHub account
- [ ] Vercel account ([sign up free](https://vercel.com))
- [ ] OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- [ ] Google OAuth credentials ([setup guide](#google-oauth-setup))

## Step 1: Push to GitHub

```bash
cd tradingplatform

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: QuantHub MVP"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/yourusername/quanthub.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (Easiest)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Vercel will auto-detect Next.js - just click "Deploy"
5. Wait for initial deployment (will fail due to missing env vars - that's OK!)

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - What's your project's name? quanthub
# - In which directory is your code located? ./
# - Want to override settings? N
```

## Step 3: Add Vercel Postgres

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Accept the free tier (256 MB)
6. Click "Create"
7. Environment variables are automatically added! ✨

## Step 4: Set Up Database Schema

```bash
# Pull environment variables from Vercel
vercel env pull .env.local

# Push Prisma schema to database
npx prisma db push

# Verify
npx prisma studio
```

## Step 5: Configure Google OAuth

### Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "QuantHub"
   
5. Add Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://your-app.vercel.app
   ```

6. Add Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-app.vercel.app/api/auth/callback/google
   ```

7. Click "Create"
8. Copy your **Client ID** and **Client Secret**

### Add OAuth Credentials to Vercel

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Environment Variables"
3. Add the following variables:

```
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

## Step 6: Add Remaining Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

### NextAuth Configuration

```bash
# Generate a secret
openssl rand -base64 32
```

Add to Vercel:
```
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=https://your-app.vercel.app
```

### OpenAI API Key

```
OPENAI_API_KEY=sk-...
```

## Step 7: Redeploy

After adding all environment variables:

### Option A: Using Dashboard
1. Go to "Deployments" tab
2. Click "..." on latest deployment
3. Click "Redeploy"

### Option B: Using CLI
```bash
vercel --prod
```

## Step 8: Verify Deployment ✅

1. Visit your app: `https://your-app.vercel.app`
2. You should see the login page
3. Click "Continue with Google"
4. Sign in with your Google account
5. You should be redirected to the dashboard!

## Complete Environment Variables Reference

Here's a complete list of required environment variables:

```bash
# Database (Auto-added by Vercel Postgres)
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."

# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"

# Google OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

# OpenAI
OPENAI_API_KEY="sk-..."
```

## Troubleshooting

### Issue: Database Connection Failed

**Solution:**
```bash
# Pull latest env vars
vercel env pull .env.local

# Push schema again
npx prisma db push
```

### Issue: OAuth Redirect URI Mismatch

**Solution:**
1. Check that your redirect URI in Google Console matches exactly:
   - `https://your-app.vercel.app/api/auth/callback/google`
2. No trailing slashes!
3. Must use HTTPS (not HTTP) for production

### Issue: "NextAuth: No secret"

**Solution:**
1. Make sure `NEXTAUTH_SECRET` is set in Vercel
2. Redeploy after adding the variable

### Issue: "Failed to fetch connections"

**Solution:**
1. Check database is set up: `npx prisma studio`
2. Verify `POSTGRES_PRISMA_URL` is set
3. Run `npx prisma db push` again

### Issue: Build fails with TypeScript errors

**Solution:**
```bash
# Test build locally first
npm run build

# Fix any errors, then push and redeploy
git add .
git commit -m "Fix build errors"
git push
```

## Performance Optimization (Optional)

### Enable Edge Runtime (for faster responses)

Add to API routes:
```typescript
export const runtime = 'edge';
```

### Add Caching Headers

For static data, add caching:
```typescript
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
    }
  });
}
```

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` to your custom domain
5. Update Google OAuth redirect URIs

## Monitoring

### View Logs
```bash
vercel logs
```

### Real-time Logs
```bash
vercel logs --follow
```

### Analytics

Vercel provides free analytics:
1. Go to Analytics tab
2. View page views, top pages, and performance metrics

## Next Steps

✅ Your app is now live!

Consider adding:
1. **Rate Limiting** - Use [Upstash Rate Limit](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
2. **Error Tracking** - Use [Sentry](https://sentry.io/)
3. **Email Auth** - Add email provider to NextAuth
4. **API Key Encryption** - Encrypt stored API keys
5. **Custom Domain** - Add your own domain

## Support

If you run into issues:
1. Check Vercel logs: `vercel logs`
2. Check runtime logs in Vercel Dashboard
3. Review this guide again
4. Open an issue on GitHub

---

🎉 **Congratulations!** Your QuantHub instance is now live and ready to use!


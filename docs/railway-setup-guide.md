# Railway Setup Guide

Step-by-step instructions for deploying `packages/api` to Railway and wiring it into Stripe, Supabase, and the Expo app.

**Time required:** ~45–60 minutes
**Prerequisites:** Railway account (railway.app), Stripe Dashboard access, Supabase Dashboard access

---

## Step 1 — Create a Railway Project

1. Go to [railway.app](https://railway.app) and sign in.
2. Click **New Project** in the top right.
3. Select **Deploy from GitHub repo**.
4. Authorise Railway to access your GitHub account if prompted.
5. Search for and select your `kinpath` repository.
6. Railway will detect the monorepo. **Do not click Deploy yet** — you need to configure the root directory first (Step 2).

---

## Step 2 — Configure the Service Root Directory

Railway needs to know that the API lives in `packages/api`, not the repo root.

1. After the repo is connected, click into the newly created service.
2. Go to **Settings** tab (top of the service panel).
3. Under **Source**, set **Root Directory** to:
   ```
   packages/api
   ```
4. Under **Build**, confirm the **Build Command** is:
   ```
   npm run build
   ```
5. Under **Deploy**, confirm the **Start Command** is:
   ```
   npm run start
   ```
   Railway also reads `railway.json` in `packages/api/` which sets these automatically — double-check they match.
6. Still in Settings, under **Deploy**, set the **Health Check Path** to:
   ```
   /health
   ```
   This tells Railway to verify the server is up before routing traffic to it.

---

## Step 3 — Set Environment Variables

Go to the **Variables** tab for your Railway service. Add each variable below.

> **Tip:** Click **New Variable** for each one. You can also use the **Raw Editor** to paste them all at once — click the `</>` icon at the top right of the Variables panel.

### Supabase

| Variable | Where to find it |
|----------|-----------------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → `service_role` `secret` key |

> ⚠️ The `SUPABASE_URL` and `SUPABASE_ANON_KEY` here are **without** the `NEXT_PUBLIC_` prefix. The API package uses bare names.

### Stripe

| Variable | Where to find it |
|----------|-----------------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Created in Step 5 below — come back and fill this in |
| `STRIPE_PREMIUM_PRICE_ID` | Stripe Dashboard → Products → your Premium plan → Price ID |
| `STRIPE_FAMILY_PRICE_ID` | Stripe Dashboard → Products → your Family plan → Price ID |
| `STRIPE_PREMIUM_ANNUAL_PRICE_ID` | Stripe Dashboard → Products → Premium Annual → Price ID |
| `STRIPE_FAMILY_ANNUAL_PRICE_ID` | Stripe Dashboard → Products → Family Annual → Price ID |

### Anthropic

| Variable | Where to find it |
|----------|-----------------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |

### Email

| Variable | Where to find it |
|----------|-----------------|
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |

### App

| Variable | Value |
|----------|-------|
| `APP_URL` | Your production URL — use the Railway-generated URL for now (e.g. `https://kinpath-api-production.up.railway.app`). Update to your custom domain later. |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

> **Where to find your Railway URL:** Go to the **Settings** tab → **Networking** → **Public Networking** → click **Generate Domain**. Copy the URL it creates — that is your `APP_URL` for now.

---

## Step 4 — Deploy and Verify the Health Check

1. Go to the **Deployments** tab.
2. Click **Deploy** (or push a new commit to trigger it automatically).
3. Watch the build logs — it should run `npm run build` (TypeScript compile), then start the server.
4. Once the deployment shows **Active**, open your Railway URL in a browser:
   ```
   https://your-railway-url.up.railway.app/health
   ```
   You should see:
   ```json
   { "status": "ok", "timestamp": "2026-02-24T09:00:00.000Z" }
   ```

If the health check fails, click into the deployment to read the logs. The most common causes are a missing environment variable (the server will throw on startup) or a TypeScript build error.

---

## Step 5 — Register the Stripe Webhook

The existing Stripe webhook points to Vercel. You need to add a new one pointing to Railway **while keeping the old one active** until you are ready to remove the Vercel API routes.

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**.
2. Click **Add endpoint**.
3. Set the **Endpoint URL** to:
   ```
   https://your-railway-url.up.railway.app/webhooks/stripe
   ```
4. Under **Events to send**, select:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**.
6. On the webhook detail page, click **Reveal** next to **Signing secret**.
7. Copy the `whsec_...` value.
8. Go back to Railway → **Variables** → set:
   ```
   STRIPE_WEBHOOK_SECRET = whsec_...
   ```
9. Redeploy (or Railway will automatically pick up the new variable).

**To test the webhook works:**
Install the Stripe CLI if you haven't already (`brew install stripe/stripe-cli/stripe`), then run:
```bash
stripe trigger checkout.session.completed
```
Check the Railway deployment logs — you should see the event received and processed with no errors.

> **Note:** At this point you will have two active Stripe webhook endpoints — the old Vercel one and the new Railway one. Both will fire for now. Once you remove the Vercel API routes (Phase 6 of the migration plan), delete the old Vercel webhook endpoint.

---

## Step 6 — Update Supabase Auth Redirect URLs

The auth callback (`/auth/callback`) currently redirects to the Vercel URL. Supabase validates redirect URLs against an allowlist — you need to add the Railway URL.

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → select your project.
2. Go to **Authentication** → **URL Configuration**.
3. Under **Redirect URLs**, click **Add URL** and add:
   ```
   https://your-railway-url.up.railway.app/auth/callback
   ```
4. Also add your custom domain if you have one:
   ```
   https://api.kinpath.com/auth/callback
   ```
5. Click **Save**.
6. Under **Site URL**, leave this as your marketing site URL (the Vercel/web URL). This is used for email templates.

> **Also update the household invite redirect:** In `packages/api/src/routes/household.ts`, the `redirectTo` in `inviteUserByEmail` is built from `APP_URL`. Since you set `APP_URL` to your Railway URL in Step 3, this will now correctly point to `https://your-railway-url.up.railway.app/auth/callback`. No code change needed.

---

## Step 7 — Test Each Route

Use a REST client (Bruno, Insomnia, or `curl`) to verify each route works against the live Railway server.

### Get a test JWT

Sign into your app (or use the Supabase Dashboard → Authentication → Users → copy an access token) to get a valid JWT for testing.

### Health check
```bash
curl https://your-railway-url.up.railway.app/health
# Expected: { "status": "ok", ... }
```

### AI chat
```bash
curl -X POST https://your-railway-url.up.railway.app/ai/chat \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"message": "What should I expect at 20 weeks pregnant?"}'
# Expected: { "message": "...", "conversation_id": "...", "cited_resources": [...] }
```

### Stripe checkout
```bash
curl -X POST https://your-railway-url.up.railway.app/stripe/checkout \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"plan": "premium", "interval": "monthly"}'
# Expected: { "url": "https://checkout.stripe.com/..." }
```

### Stripe portal
```bash
curl -X POST https://your-railway-url.up.railway.app/stripe/portal \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json"
# Expected: { "url": "https://billing.stripe.com/..." }
# (Requires user to have a stripe_customer_id — skip if your test user doesn't have one)
```

### Household invite
```bash
curl -X POST https://your-railway-url.up.railway.app/household/invite \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"email": "partner@example.com", "display_name": "Partner"}'
# Expected: { "success": true, "member_id": "..." }
# (Requires family tier subscription)
```

### Account delete (⚠️ skip in production — use a test user)
```bash
curl -X POST https://your-railway-url.up.railway.app/account/delete \
  -H "Authorization: Bearer TEST_USER_JWT" \
  -H "Content-Type: application/json"
# Expected: { "success": true }
```

---

## Step 8 — Add a Custom Domain (Optional but Recommended)

A cleaner URL (`api.kinpath.com`) is better than the Railway subdomain before you share it publicly.

1. Go to Railway → **Settings** → **Networking** → **Custom Domain**.
2. Click **Add Custom Domain** and enter `api.kinpath.com`.
3. Railway will give you a CNAME record to add. Go to your DNS provider (wherever you manage `kinpath.com`) and add:
   ```
   CNAME api.kinpath.com → your-railway-url.up.railway.app
   ```
4. Wait for DNS to propagate (usually 5–15 minutes).
5. Railway automatically provisions an SSL certificate via Let's Encrypt.
6. Update `APP_URL` in Railway Variables to `https://api.kinpath.com` and redeploy.

---

## Step 9 — Point the Expo App to Railway

Once the Railway server is confirmed working, update the mobile app to use it.

1. In `packages/mobile/`, create or update `.env`:
   ```bash
   EXPO_PUBLIC_API_URL=https://api.kinpath.com
   # or your Railway subdomain during testing:
   EXPO_PUBLIC_API_URL=https://your-railway-url.up.railway.app
   ```

2. The API client utility (`packages/mobile/lib/api.ts`) reads this variable. Any screen that currently calls a Vercel/Next.js route should be updated to call `apiPost('/route')` instead.

3. For local development, you can run the Railway API locally alongside Expo:
   ```bash
   # Terminal 1 — API server
   cd packages/api && npm run dev

   # Terminal 2 — Expo
   cd packages/mobile && npx expo start
   ```
   Set `EXPO_PUBLIC_API_URL=http://localhost:3001` in your local `.env` for development.

---

## Step 10 — Monitor and Confirm Performance

After deploying, check that response times match expectations.

1. In Railway → **Metrics** tab, watch **Response Time** for your service. You should see p50 well under 200ms for most routes (vs. the 2.73s TTFB from Vercel cold starts).

2. Use the Vercel Speed Insights on the web app (`kinpath-web.vercel.app`) to confirm that TTFB has dropped once the web app no longer makes DB calls during SSR.

3. Check Railway logs for any errors:
   - Railway → **Deployments** → click active deployment → **View Logs**
   - Filter by `[cron]` to confirm the digest job is scheduling correctly
   - Filter by `[error]` to catch any unhandled exceptions

---

## Checklist Before Going Live

- [ ] Railway URL responds to `/health` with `{ "status": "ok" }`
- [ ] All environment variables set in Railway Variables panel
- [ ] Stripe webhook added with Railway URL and `STRIPE_WEBHOOK_SECRET` updated
- [ ] Stripe CLI test confirms webhook processes `checkout.session.completed`
- [ ] Supabase Auth redirect URL allowlist includes Railway URL
- [ ] AI chat route returns a valid response
- [ ] Expo `.env` updated with `EXPO_PUBLIC_API_URL`
- [ ] Custom domain (`api.kinpath.com`) pointing to Railway — SSL active
- [ ] Old Vercel webhook endpoint removed from Stripe after Vercel API routes are deleted

---

## Common Issues

**Build fails on Railway**
Check that `packages/api/tsconfig.json` exists and `npm run build` works locally. Railway uses Nixpacks to detect Node.js — if it's picking the wrong version, add a `.node-version` file in `packages/api/`:
```
20
```

**`SUPABASE_URL` / `SUPABASE_ANON_KEY` missing at runtime**
The API uses bare variable names (not `NEXT_PUBLIC_` prefixed). Double-check the Railway Variables panel uses `SUPABASE_URL`, not `NEXT_PUBLIC_SUPABASE_URL`.

**Stripe webhook returns 400 "Invalid signature"**
This means the webhook secret in Railway doesn't match the one from the Stripe endpoint. Go to Stripe → Webhooks → click your Railway endpoint → Reveal signing secret → copy it again → update `STRIPE_WEBHOOK_SECRET` in Railway.

**CORS error from Expo app**
Add your Expo dev server URL to the allowed origins in `packages/api/src/index.ts`. For Expo Go, the origin is typically `http://localhost:8081`. For a physical device on the same network it may be your machine's local IP (`http://192.168.x.x:8081`). During development, you can temporarily set the `APP_URL` env var to `*` to disable CORS checking, then re-enable before production.

**Auth callback redirects to wrong URL**
Check that `APP_URL` is set correctly in Railway Variables. The `/auth/callback` route redirects to `${APP_URL}${next}`. If this is blank or wrong, the redirect will fail.

**Cron job not firing**
The cron job (`0 9 * * *`) starts when the server starts. Check Railway logs for `[cron] Digest job scheduled`. If the service is sleeping (Railway free tier sleeps idle services), the cron job won't run. Upgrade to the Railway Pro plan or use Railway's built-in cron feature as an alternative trigger.

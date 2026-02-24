# KinPath — Railway Migration Plan

**Goal:** Move all backend API logic from Next.js serverless functions on Vercel into a persistent Express server on Railway. Eliminate cold-start latency (currently ~2.73s TTFB). The Expo mobile app becomes the primary product; Next.js becomes a lightweight marketing/content site only.

**Diagnosis:** TTFB of 2.73s with FCP/LCP tracking identically means 100% of the latency is server-side. The browser renders instantly once it receives HTML — the entire wait is Vercel cold-starting the serverless function, opening a new DB connection, and running the Supabase query before returning the first byte.

---

## Architecture: Before → After

```
BEFORE
──────
Expo (mobile)  ──────────────────────────────────────────┐
                                                          ▼
Browser (web)  ───► Next.js on Vercel (SSR + API routes) ───► Supabase (DB + Auth)
                         │ cold starts: ~500–800ms             │ new connection per invocation
                         │ new DB conn: ~100–300ms             │
                         │ total TTFB:  2.73s                  │
                         ▼                                     │
                    Anthropic / Stripe / Resend ───────────────┘

AFTER
─────
Expo (mobile)  ───► Railway API (Express, persistent)  ───► Supabase (DB + Auth)
                         │ warm server: ~5–20ms                │ persistent connection pool
                         │ pooled DB:   ~20–50ms               │
                         │ total RTT:   ~50–100ms              │
                         ▼                                     │
Browser (web)  ───► Next.js on Vercel (static/SSG only) ──────┘
                         │ marketing pages, no API routes
                         │ TTFB: <200ms (static)
```

**What moves to Railway:**
- All 11 API routes (now Express route handlers)
- Anthropic AI chat
- Stripe checkout, portal, webhooks
- Household invite logic
- Account deletion
- Weekly digest cron (now internal scheduler, no external trigger needed)
- Service-role Supabase operations

**What stays on Vercel:**
- Landing page, pricing, privacy/terms pages
- Marketing blog / resources browsing (read-only, no auth required)
- Static asset serving

**What stays on Supabase:**
- PostgreSQL database (unchanged)
- Auth (JWT issuance, session management)
- Row Level Security policies (unchanged)
- Storage (unchanged)

---

## New Package: `packages/api`

```
packages/api/
├── src/
│   ├── index.ts              # Express app entry point
│   ├── middleware/
│   │   ├── auth.ts           # Supabase JWT validation
│   │   ├── cors.ts           # CORS config
│   │   └── errorHandler.ts   # Global error handler
│   ├── lib/
│   │   ├── supabase.ts       # Server + service role clients
│   │   ├── stripe.ts         # Stripe SDK init
│   │   ├── anthropic.ts      # Anthropic SDK init
│   │   └── resend.ts         # Resend SDK init
│   ├── routes/
│   │   ├── auth.ts           # /auth/callback
│   │   ├── ai.ts             # /ai/chat
│   │   ├── chat.ts           # /chat/save
│   │   ├── review.ts         # /review/submit
│   │   ├── household.ts      # /household/invite
│   │   ├── account.ts        # /account/delete
│   │   ├── stripe.ts         # /stripe/checkout, /stripe/portal
│   │   ├── webhooks.ts       # /webhooks/stripe
│   │   ├── admin.ts          # /admin/resources/:slug
│   │   └── email.ts          # /email/digest (internal)
│   └── cron/
│       └── digest.ts         # node-cron weekly digest scheduler
├── package.json
└── tsconfig.json
```

---

## Phase 1: Scaffold `packages/api` (~1 day)

### 1.1 — Create the package

```bash
mkdir -p packages/api/src/{middleware,lib,routes,cron}
cd packages/api
npm init -y
npm install express cors helmet @supabase/supabase-js stripe @anthropic-ai/sdk resend node-cron
npm install -D typescript @types/express @types/cors @types/node @types/node-cron ts-node-dev
```

### 1.2 — `package.json` scripts

```json
{
  "name": "@kinpath/api",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### 1.3 — `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.4 — Add to Turborepo (`turbo.json`)

Add `@kinpath/api` to the pipeline so `turbo build` and `turbo dev` includes it.

### 1.5 — `src/index.ts` — Express entry point

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth';
import { aiRouter } from './routes/ai';
import { chatRouter } from './routes/chat';
import { reviewRouter } from './routes/review';
import { householdRouter } from './routes/household';
import { accountRouter } from './routes/account';
import { stripeRouter } from './routes/stripe';
import { webhooksRouter } from './routes/webhooks';
import { adminRouter } from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { startCronJobs } from './cron/digest';

const app = express();
const PORT = process.env.PORT || 3001;

// Stripe webhooks need raw body — must come before express.json()
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));

app.use(helmet());
app.use(cors({
  origin: [
    process.env.APP_URL || 'http://localhost:3000',
    'https://kinpath-web.vercel.app',
    // Add production domain when ready
  ],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/auth', authRouter);
app.use('/ai', aiRouter);
app.use('/chat', chatRouter);
app.use('/review', reviewRouter);
app.use('/household', householdRouter);
app.use('/account', accountRouter);
app.use('/stripe', stripeRouter);
app.use('/webhooks', webhooksRouter);
app.use('/admin', adminRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`KinPath API running on port ${PORT}`);
  startCronJobs();
});
```

### 1.6 — `src/middleware/auth.ts` — Auth validation

```typescript
import { Request, Response, NextFunction } from 'express';
import { createServerSupabaseClient } from '../lib/supabase';

export interface AuthenticatedRequest extends Request {
  userId: string;
  userEmail?: string;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.userId = user.id;
  req.userEmail = user.email;
  next();
}
```

### 1.7 — `src/lib/supabase.ts` — Supabase clients

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Anon client — respects RLS, used with user JWTs
export function createServerSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

// Authed client — creates a client that acts as the authenticated user
export function createUserSupabaseClient(userJwt: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

// Service role — bypasses RLS, for admin operations only
export function createServiceRoleClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
```

> **Connection note:** Unlike Vercel serverless functions, Railway runs a persistent server. Use the direct Supabase connection URL (port 5432) for the Supabase client, and consider adding `pg` with a connection pool for any raw queries. The persistent server maintains pooled connections automatically.

---

## Phase 2: Port All 11 API Routes (~2–3 days)

For each route below, the pattern is:
1. Extract business logic from the Next.js route handler
2. Replace `cookies()` / Next.js request parsing with Express `req`/`res`
3. Replace `createServerSupabaseClient()` (cookie-based) with `createUserSupabaseClient(token)` (JWT-based)
4. Return the same JSON responses — no changes needed on the client side

### Route Map

| Original Next.js Route | New Express Route | Auth Required | Notes |
|------------------------|-------------------|---------------|-------|
| `GET /api/auth/callback` | `GET /auth/callback` | No | OAuth PKCE handler; redirect-based |
| `POST /api/ai/chat` | `POST /ai/chat` | Yes | Anthropic streaming; tier limit check |
| `POST /api/chat/save` | `POST /chat/save` | Yes | |
| `DELETE /api/chat/save` | `DELETE /chat/save` | Yes | |
| `POST /api/review/submit` | `POST /review/submit` | Yes | Reviewer role check |
| `POST /api/household/invite` | `POST /household/invite` | Yes | Family tier only |
| `DELETE /api/household/invite` | `DELETE /household/invite` | Yes | |
| `POST /api/account/delete` | `POST /account/delete` | Yes | Cancels Stripe sub |
| `POST /api/stripe/checkout` | `POST /stripe/checkout` | Yes | |
| `POST /api/stripe/portal` | `POST /stripe/portal` | Yes | |
| `POST /api/webhooks/stripe` | `POST /webhooks/stripe` | No (signature) | Raw body required |
| `PATCH /api/admin/resources/[slug]` | `PATCH /admin/resources/:slug` | Yes (admin) | Admin role check |
| `POST /api/email/digest` | Internal cron only | N/A | Remove external trigger |

### Key Migration Notes Per Route

**`/auth/callback`**
- Currently uses Next.js `redirect()` — replace with `res.redirect()`
- Household member linking logic moves as-is
- Set `NEXT_PUBLIC_API_URL` in the web app so OAuth redirects go to Railway

**`/ai/chat` (most complex)**
- Uses Anthropic streaming (`stream: true`) — Express handles this with `res.setHeader('Content-Type', 'text/event-stream')` and `res.write()` per chunk
- Tier limit check queries `users` table — use `createUserSupabaseClient(token)`
- Resource citation lookup stays the same

**`/webhooks/stripe`**
- **Critical:** Raw body must reach this handler for Stripe signature verification
- In `index.ts`, mount `express.raw({ type: 'application/json' })` specifically for this route BEFORE `express.json()` global middleware (already in scaffold above)
- Register the new Railway URL as the webhook endpoint in Stripe Dashboard

**`/email/digest`**
- Remove the `CRON_SECRET` header check — this endpoint is no longer externally triggered
- Move trigger to `node-cron` scheduler (see Phase 3)
- Keep the underlying `sendWeeklyDigest()` logic unchanged

---

## Phase 3: Add Internal Cron Scheduler (~2 hours)

Replace the externally-triggered digest endpoint with `node-cron`:

```typescript
// src/cron/digest.ts
import cron from 'node-cron';
import { sendWeeklyDigest } from '../lib/email/digest';

export function startCronJobs() {
  // Every Monday at 9am UTC
  cron.schedule('0 9 * * 1', async () => {
    console.log('[cron] Running weekly digest...');
    try {
      await sendWeeklyDigest();
      console.log('[cron] Weekly digest complete');
    } catch (err) {
      console.error('[cron] Weekly digest failed:', err);
    }
  });

  console.log('[cron] Jobs scheduled');
}
```

Delete the Vercel cron configuration (`vercel.json` cron entry if present) and the `CRON_SECRET` env var.

---

## Phase 4: Railway Deployment (~2 hours)

### 4.1 — Create Railway project

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select the `kinpath` monorepo
3. Set the root directory to `packages/api`
4. Railway auto-detects Node.js; set start command: `npm run start`

### 4.2 — Environment variables on Railway

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...   # New secret from Railway webhook endpoint

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Email
RESEND_API_KEY=re_...

# App
APP_URL=https://kinpath.com   # or vercel URL during transition

# Node
NODE_ENV=production
PORT=3000
```

### 4.3 — Update Stripe webhook endpoint

In Stripe Dashboard → Webhooks → Add endpoint:
- URL: `https://your-railway-app.up.railway.app/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy the new webhook secret into Railway env vars

### 4.4 — Custom domain (optional, post-launch)

Railway supports custom domains. Point `api.kinpath.com` to Railway for a clean URL.

---

## Phase 5: Update Expo Mobile App (~1 day)

The mobile app currently has very little API surface (only the welcome screen is built), so this is minimal now but sets up the right pattern for all future screens.

### 5.1 — Add API URL to Expo env

```bash
# packages/mobile/.env
EXPO_PUBLIC_API_URL=https://your-railway-app.up.railway.app
```

### 5.2 — Create API client utility

```typescript
// packages/mobile/lib/api.ts
import { supabase } from './supabase';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export async function apiPost<T>(path: string, body?: object): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export async function apiDelete<T>(path: string, body?: object): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
    method: 'DELETE',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}
```

All future mobile screens use `apiPost`, `apiGet`, `apiDelete` from this utility — never call Vercel/Next.js routes from mobile.

### 5.3 — Auth callback for OAuth on mobile

For OAuth flows on mobile, update the Supabase redirect URL to point to Railway's `/auth/callback`. In Supabase Dashboard → Auth → URL Configuration, add Railway URL to allowed redirects.

---

## Phase 6: Slim Next.js to Marketing Site (~1 day)

### 6.1 — Remove all API routes from `packages/web`

Delete:
```
packages/web/src/app/api/   (entire folder)
```

### 6.2 — Remove auth middleware

The Next.js middleware currently redirects unauthenticated users to `/auth/login`. Since the web app no longer serves the authenticated app experience, simplify `middleware.ts` to just handle auth for any remaining protected pages, or remove it entirely if the site is fully public.

### 6.3 — Evaluate which web pages to keep

| Page | Keep? | Notes |
|------|-------|-------|
| Landing page `/` | ✅ | Marketing, SEO |
| Pricing `/pricing` | ✅ | Marketing |
| Privacy/Terms | ✅ | Legal requirement |
| Blog/Resources (public) | ✅ | SEO content |
| `/dashboard` and app pages | ❌ | Move to mobile only |
| `/plan`, `/doctors`, etc. | ❌ | Mobile only |

### 6.4 — Benefit

Removing all authenticated app pages and API routes from Next.js means Vercel only serves static HTML/CSS/JS. TTFB drops to ~50–150ms. No more cold starts because there are no serverless functions.

---

## Phase 7: Testing & Cutover Checklist

Before going live, verify each of these:

- [ ] `GET /health` returns 200 on Railway
- [ ] `POST /ai/chat` streams response, tier limits enforced
- [ ] `POST /stripe/checkout` creates checkout session, returns URL
- [ ] `POST /webhooks/stripe` receives and verifies Stripe events (test with Stripe CLI: `stripe trigger checkout.session.completed`)
- [ ] `POST /household/invite` sends magic link email
- [ ] `POST /account/delete` cancels subscription and removes user
- [ ] `PATCH /admin/resources/:slug` requires admin role
- [ ] Weekly digest cron fires on schedule (manually trigger to test)
- [ ] Expo app authenticates via Supabase and can call Railway endpoints
- [ ] CORS headers correct (mobile app origin not blocked)
- [ ] Stripe webhook secret updated to Railway URL

---

## Environment Variables Summary

| Variable | Used In | Purpose |
|----------|---------|---------|
| `SUPABASE_URL` | Railway API | DB + Auth |
| `SUPABASE_ANON_KEY` | Railway API, Expo | Row-level-security queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Railway API | Admin ops (bypass RLS) |
| `STRIPE_SECRET_KEY` | Railway API | Checkout, portal, subscription management |
| `STRIPE_WEBHOOK_SECRET` | Railway API | Verify incoming Stripe events |
| `ANTHROPIC_API_KEY` | Railway API | AI chat |
| `RESEND_API_KEY` | Railway API | Digest emails, invite emails |
| `APP_URL` | Railway API | CORS origin, redirect URLs |
| `EXPO_PUBLIC_SUPABASE_URL` | Expo | Auth |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Expo | Auth |
| `EXPO_PUBLIC_API_URL` | Expo | Railway API base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel (web) | Read-only public data |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel (web) | Read-only public data |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Stripe webhook secret mismatch | Medium | High | Test with Stripe CLI before cutover; keep old Vercel webhook active in parallel during transition |
| OAuth callback URL change breaks login | Medium | High | Add Railway URL to Supabase allowed redirects before removing Vercel URL |
| CORS blocking mobile app requests | Low | High | Test CORS headers with Expo dev client before production deploy |
| Supabase JWT validation fails in Express | Low | High | Test `requireAuth` middleware with a real session token in dev |
| Cold-start regression on Railway | Very Low | Medium | Railway uses persistent servers — no cold starts by design |
| Expo app calling old Vercel API routes | Medium | Medium | Remove Vercel API routes only after Expo is updated and tested |

---

## Estimated Timeline

| Phase | Work | Time |
|-------|------|------|
| Phase 1: Scaffold `packages/api` | Create Express server, auth middleware, Supabase clients | 0.5–1 day |
| Phase 2: Port 11 API routes | Translate each route handler to Express | 2–3 days |
| Phase 3: Cron scheduler | node-cron weekly digest | 2 hours |
| Phase 4: Railway deployment | Project setup, env vars, Stripe webhook update | 2 hours |
| Phase 5: Update Expo app | API client utility, point to Railway | 0.5 day |
| Phase 6: Slim Next.js | Remove API routes, trim app pages | 0.5–1 day |
| Phase 7: Testing & cutover | End-to-end testing, go-live | 1 day |
| **Total** | | **5–7 days** |

---

## Quick Wins (While Migration is Underway)

If you want immediate improvement before the full migration is complete, two zero-risk changes on the current Vercel setup:

1. **Switch Supabase to Transaction Pooler URL** — In your Supabase project → Settings → Database → Connection string, use port `6543` (Transaction mode) instead of `5432` (Session mode) for all server-side connections. This alone can cut DB connection time by 100–200ms per cold start.

2. **Install `@vercel/speed-insights` properly** — Vercel showed a "No data available" warning meaning real user metrics aren't being captured. Install it to get accurate baselines before and after the migration: `npm install @vercel/speed-insights`, then add `<SpeedInsights />` to your root layout. This lets you measure the exact improvement from the migration.

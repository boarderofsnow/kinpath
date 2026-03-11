# Kinpath — Project Guidelines for Claude

## Brand Name

- **Brand name:** Kinpath (lowercase "p" — NOT "KinPath")
- **Legal entity:** Kinpath Family, LLC
- **Email from name:** Kinpath Family
- **Domain:** kinpath.family
- Always use "Kinpath" in user-facing text, email templates, UI copy, alt attributes, and code comments

## Project Structure

Turborepo monorepo with the following packages:

| Package | Stack | Description |
|---------|-------|-------------|
| `packages/web` | Next.js 15 (App Router), Tailwind CSS | Web application |
| `packages/mobile` | React Native / Expo | Mobile application |
| `packages/api` | Express | API server |
| `packages/shared` | TypeScript | Shared types and constants |
| `packages/supabase` | SQL migrations, email templates | Database and auth config |

## Key Commands

- **Type-check all packages:** `npm run type-check`
- **Build shared types:** `npm run build --filter=@kinpath/shared`
- **Dev server (web):** `npm run dev --filter=@kinpath/web`

## Architecture Patterns

- Centralized `TIER_LIMITS` constant in `packages/shared/src/constants/tiers.ts` drives all feature gating
- `SubscriptionTier` type: `"free" | "premium" | "family"`
- Household member roles: `"owner" | "partner" | "caregiver"`
- `hasFeature(tier, feature)` utility for tier-based access control
- Stripe webhook in `packages/web/src/app/api/webhooks/stripe/route.ts` handles tier sync
- Supabase for auth, database, and email templates

## Supabase

- **Project ref:** mxxkvtavdwujfbucnrnf
- Email templates live in `packages/supabase/email-templates/`
- Auth config in `packages/supabase/config.toml`
- Migrations in `packages/supabase/migrations/`

## Style & Conventions

- Use Tailwind CSS utility classes in web package
- Mobile uses a shared theme from `packages/mobile/lib/theme.ts`
- Color palette: stone tones with teal/sage accent (`#6B8F7B`) and warm copper (`#C4956A`)
- Font stack: Inter (body), DM Serif Display (headings)

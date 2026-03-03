# KinPath Performance Upgrades — Summary & Mobile Migration Plan

## Part 1: Web App Performance Upgrades Applied

### 1. Disabled Aggressive RSC Prefetching (High Impact)

**Problem:** Next.js 15 auto-prefetches every `<Link>` component visible in the viewport. When the Dashboard loaded, it triggered RSC (React Server Component) requests for all 4 sibling routes (Browse, Chat, Plan, Settings). The Browse page then triggered 9+ additional prefetches for individual resource detail pages. This created a "prefetch storm" of 13+ concurrent server requests, overwhelming Vercel's function concurrency and causing 503 errors.

**Fix:** Added `prefetch={false}` to all `<Link>` components across the app — navigation links in AppNav (desktop + mobile + logo), ResourceCard links, Dashboard CTA links, and Browse page filter links. Pages now load on-demand when the user actually navigates.

**Files modified:** `app-nav.tsx`, `resource-card.tsx`, `post-birth-dashboard.tsx`, `dashboard/page.tsx`, `resources/page.tsx`

### 2. Replaced framer-motion with CSS Animations (High Impact)

**Problem:** framer-motion adds 90KB+ to the JavaScript bundle and was imported globally. It powered simple fade/slide animations and the onboarding page transitions — effects easily achievable with CSS.

**Fix:** Rewrote `components/ui/motion.tsx` to use native CSS `@keyframes` animations with `IntersectionObserver` for scroll-triggered reveals. Added animation classes (`animate-fade-in`, `animate-fade-in-up`, `animate-step-enter`, stagger system) to `globals.css`. Updated `onboarding/page.tsx` to use CSS class-based transitions instead of `AnimatePresence`/`motion.div`. Removed `framer-motion` from `package.json`.

**Files modified:** `motion.tsx`, `globals.css`, `onboarding/page.tsx`, `package.json`

### 3. Optimized Package Imports via next.config.js (Medium Impact)

**Problem:** `lucide-react` and `@supabase/supabase-js` are large packages where only a fraction of exports are used. Without explicit optimization, the bundler may include unused code.

**Fix:** Added `experimental.optimizePackageImports` to `next.config.js` for both packages, enabling more aggressive tree-shaking.

**Files modified:** `next.config.js`

### 4. Lazy-Loaded SpeedInsights (Medium Impact)

**Problem:** `@vercel/speed-insights` was statically imported in the root layout, running on every page load including during RSC prefetches.

**Fix:** Moved SpeedInsights into a dedicated `"use client"` wrapper component (`components/analytics/speed-insights.tsx`) using `next/dynamic` with `ssr: false`. The root layout imports this wrapper normally, but the actual SpeedInsights code only loads client-side after hydration.

**Files modified:** `layout.tsx`, new `components/analytics/speed-insights.tsx`

### 5. Moved Personalized Resources off Dashboard (High Impact)

**Problem:** The Dashboard was the heaviest page — it fetched the user profile, children, a personalized resource feed (querying 60 resources, ranking them by relevance), and checklist items, all in a single server render. The `getPersonalizedFeed()` call was one of the most expensive operations.

**Fix:** Removed the entire "Your Resources" section from the Dashboard, replacing it with a lightweight CTA card linking to Browse. Enhanced the Browse page (`/resources`) with child-based filtering — when accessed via `?child=<id>`, it calls `getPersonalizedFeed()` for age-appropriate results. Users get the same personalized experience on Browse, but the Dashboard loads significantly faster.

**Files modified:** `dashboard/page.tsx`, `resources/page.tsx`

### 6. Fixed Markdown Rendering Bug on Plan Page (Bug Fix)

**Problem:** Checklist item descriptions on the Plan page rendered raw markdown text (visible `**bold**` markers) instead of formatted HTML.

**Fix:** Imported the existing `MarkdownBody` component and replaced the raw `{item.description}` render with `<MarkdownBody content={item.description} compact />`.

**Files modified:** `checklist-item-row.tsx`

---

## Part 2: Mobile App — Current State Assessment

The mobile app (Expo/React Native) has a different architecture than the web app, so not all web fixes apply directly. Here's the current state:

| Area | Mobile Status |
|------|--------------|
| **Prefetching** | Not applicable — Expo Router doesn't auto-prefetch like Next.js |
| **Animation library** | Already lean — uses native React Native `Animated` API, no framer-motion |
| **Analytics** | None loaded — no SpeedInsights or similar |
| **Bundle optimization** | No explicit config — relies on Expo defaults |
| **Dashboard resources** | Does NOT load resources on Dashboard (only children + checklist) |
| **Browse child filtering** | Uses only the **first child's age** — no child selector |
| **API caching** | None — every tab switch re-fetches all data |
| **List optimization** | FlatList used but no `React.memo` on list items |

---

## Part 3: Mobile Performance Migration Plan

### Priority 1: Add Child Selector to Browse Screen

**Why:** The Browse screen currently hard-codes the first child's age for filtering. If a family has multiple children, there's no way to see resources for a different child — the same gap that existed on the web app before the refactor.

**What to do:**
- Add a `?child=<id>` or state-based child selector to `app/(tabs)/browse.tsx`
- Fetch all children (like Dashboard does) and show child pills at the top
- Filter resources by the selected child's `age_in_weeks`
- Add an "All Resources" option that removes the age filter
- Preserve the existing topic filter alongside child selection

**Reference:** Web `resources/page.tsx` pattern — child pills + conditional age-based query.

### Priority 2: Memoize List Item Components

**Why:** `ResourceCard` and checklist items are rendered inside `FlatList` but aren't wrapped in `React.memo`. On re-renders (e.g., pull-to-refresh, topic filter change), every visible item re-renders even if its props haven't changed.

**What to do:**
- Wrap the `renderResourceCard` and `renderChecklistItem` render functions with `React.memo` or extract into named components with `React.memo`
- Use `useCallback` for event handlers passed to list items
- Consider adding `keyExtractor` optimization if not already present

### Priority 3: Add Data Caching Layer

**Why:** Every tab switch triggers fresh Supabase queries. If a user switches from Browse to Chat and back, Browse re-fetches the entire resource list even though nothing changed. This creates unnecessary network traffic and loading spinners.

**What to do:**
- Implement a lightweight in-memory cache (or adopt `@tanstack/react-query` / `swr`) for resource and children queries
- Set reasonable `staleTime` (e.g., 5 minutes for resources, 30 seconds for checklist)
- Pull-to-refresh should bypass the cache
- Invalidate cache when user completes an action (e.g., toggling checklist item)

### Priority 4: Lazy-Load Settings Sections

**Why:** The Settings screen imports and renders all section components (`ChildrenSection`, `AccountSection`, `PreferencesSection`, `NotificationsSection`, `SubscriptionSection`, `FamilySharingSection`) at once, even though most are collapsed by default.

**What to do:**
- Use `React.lazy` or conditional rendering to only mount section content when the user expands it
- The `CollapsibleSection` wrapper already handles expand/collapse — just defer the inner component mount until expanded

### Priority 5: Optimize Stagger Animations

**Why:** The `StaggerItem` component creates new `Animated.Value` instances on every render. In long lists, this means dozens of animation objects being created, each running a timing animation.

**What to do:**
- Move `Animated.Value` creation into `useRef` to persist across renders
- Consider limiting stagger animations to the first 6-8 visible items and rendering the rest without animation
- Use `React.memo` on `StaggerItem` to prevent unnecessary re-animation

### Priority 6: Add Bundle Size Monitoring

**Why:** Without visibility into bundle size, it's easy to accidentally add large dependencies that slow startup time.

**What to do:**
- Add `expo-dev-client` bundle analysis or use `npx expo export --dump-sourcemap` to analyze
- Document current baseline bundle size
- Consider setting up a CI check for bundle size regressions

---

## Implementation Order (Recommended)

| Order | Task | Impact | Effort |
|-------|------|--------|--------|
| 1 | Child selector on Browse | High | Medium |
| 2 | Memoize list items | Medium | Low |
| 3 | Data caching layer | High | Medium |
| 4 | Lazy-load Settings sections | Low | Low |
| 5 | Optimize stagger animations | Low | Low |
| 6 | Bundle size monitoring | Preventive | Low |

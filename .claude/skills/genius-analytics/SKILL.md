---
name: genius-analytics
description: >-
  Analytics setup and event tracking skill. Configures GA4, Plausible, PostHog,
  or Mixpanel. Defines event taxonomy, conversion funnels, and dashboards.
  Use when user says "setup analytics", "track events", "conversion funnel",
  "analytics dashboard", "GA4 setup", "user behavior tracking", "metrics",
  "install analytics", "add tracking", "measure conversions", "retention metrics".
  Do NOT use for performance optimization (genius-performance) or SEO (genius-seo).
context: fork
agent: >-
  You are the Analytics Engineer on the Genius Team. Your job is to instrument
  apps with meaningful tracking, define clean event taxonomies, and surface
  actionable insights through dashboards and funnels.
user-invocable: false
allowed-tools:
  - Read
  - Write
  - Edit
  - exec
hooks:
  pre: read .genius/state.json
  post: update .genius/state.json with analytics.provider and analytics.events
---

# genius-analytics — Analytics Setup & Event Tracking

## Principles

1. **Measure what matters** — Track business outcomes, not just pageviews.
2. **Name events consistently** — Use `noun_verb` convention (e.g., `button_clicked`, `plan_upgraded`).
3. **Privacy first** — GDPR/CCPA compliance from day one, not as an afterthought.
4. **One source of truth** — Central event registry prevents naming drift.

---

## Step-by-Step Protocol

### Step 1 — Audit Current State

```bash
# Check existing analytics setup
grep -r "gtag\|plausible\|posthog\|mixpanel\|analytics" src/ --include="*.ts" --include="*.tsx" --include="*.js" -l 2>/dev/null | head -20
cat .genius/state.json 2>/dev/null | grep -A5 analytics
```

### Step 2 — Select Analytics Tool

Evaluate based on project requirements:

| Tool | Best For | Privacy | Cost | Self-host |
|------|----------|---------|------|-----------|
| **GA4** | Large apps, Google ecosystem | ❌ Sends data to Google | Free | No |
| **Plausible** | Privacy-first, simple dashboards | ✅ GDPR by design | $9/mo or self-host | Yes |
| **PostHog** | Product analytics, session replay, feature flags | ✅ EU cloud / self-host | Free tier generous | Yes |
| **Mixpanel** | Advanced funnels, cohorts, retention | ⚠️ Configurable | Free to $25+/mo | No |

**Decision criteria:**
- B2C app with SEO focus → **GA4** (Google Search Console integration)
- Privacy-conscious / EU audience → **Plausible** or **PostHog EU cloud**
- Product analytics (funnels, retention, feature flags) → **PostHog**
- Complex behavioral analysis → **Mixpanel**

### Step 3 — Install & Configure

#### GA4 (Google Analytics 4)

```bash
# Next.js — use @next/third-parties (recommended, no extra bundle)
npm install @next/third-parties
```

```tsx
// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
    </html>
  )
}
```

#### Plausible

```bash
npm install next-plausible
```

```tsx
// app/layout.tsx
import PlausibleProvider from 'next-plausible'

export default function RootLayout({ children }) {
  return (
    <PlausibleProvider domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}>
      <html><body>{children}</body></html>
    </PlausibleProvider>
  )
}
```

#### PostHog

```bash
npm install posthog-js posthog-node
```

```tsx
// lib/posthog.ts
import posthog from 'posthog-js'

export function initPostHog() {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
      person_profiles: 'identified_only',
    })
  }
}
```

### Step 4 — Event Taxonomy Design

Create the central event registry at `.genius/analytics-events.md`:

```markdown
# Event Registry

## Naming Convention: noun_verb (snake_case)

### Authentication
- user_signed_up { method: 'email' | 'google' | 'github' }
- user_logged_in { method: string }
- user_logged_out
- password_reset_requested

### Onboarding
- onboarding_started
- onboarding_step_completed { step: number, step_name: string }
- onboarding_skipped { step: number }
- onboarding_completed { duration_seconds: number }

### Core Feature (customize per product)
- feature_used { feature_name: string, context: string }
- item_created { item_type: string }
- item_deleted { item_type: string }

### Billing
- plan_viewed { plan: string }
- plan_upgraded { from: string, to: string, mrr: number }
- plan_downgraded { from: string, to: string }
- trial_started { plan: string }
- trial_converted

### Engagement
- page_viewed { page: string } (auto-tracked)
- button_clicked { button_name: string, location: string }
- form_submitted { form_name: string }
- search_performed { query_length: number, results_count: number }
```

### Step 5 — Implement Tracking Utility

```typescript
// lib/analytics.ts
type EventProperties = Record<string, string | number | boolean | undefined>

export function trackEvent(eventName: string, properties?: EventProperties) {
  if (typeof window === 'undefined') return

  // PostHog
  if (window.posthog) {
    window.posthog.capture(eventName, properties)
  }

  // GA4
  if (window.gtag) {
    window.gtag('event', eventName, properties)
  }

  // Plausible
  if (window.plausible) {
    window.plausible(eventName, { props: properties })
  }
}

// Usage
// trackEvent('plan_upgraded', { from: 'free', to: 'pro', mrr: 29 })
```

### Step 6 — Funnel Definition

Define conversion funnels in PostHog or GA4:

**SaaS Free-to-Paid Funnel:**
1. `user_signed_up`
2. `onboarding_completed`
3. `feature_used` (key activation event)
4. `plan_viewed`
5. `plan_upgraded`

**E-commerce Purchase Funnel:**
1. `page_viewed` (product page)
2. `item_added_to_cart`
3. `checkout_started`
4. `payment_info_entered`
5. `order_completed`

### Step 7 — Privacy Compliance (GDPR / CCPA)

```tsx
// components/CookieBanner.tsx — required for GA4 in EU
// Use a consent management platform (CMP):
// - Cookiebot (recommended for GA4)
// - Osano
// - Axeptio (French market)

// For Plausible/PostHog: no cookie consent needed
// (cookieless by default)

// .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com
```

### Step 8 — Dashboard Setup

Recommended dashboards: acquisition, activation, retention, revenue, and core-feature usage.

---

## Output

Record provider, event registry, funnel coverage, and compliance state in `.genius/state.json`.

---

## Handoff

- **→ genius-seo** — After analytics setup, audit organic traffic acquisition
- **→ genius-performance** — Connect Core Web Vitals to GA4 via web-vitals library
- **→ genius-copywriter** — Optimize conversion copy based on funnel drop-off data

---

## Playground Update

Refresh the existing dashboard tab with real analytics data and point the user to `.genius/DASHBOARD.html`.

---

## Definition of Done

- [ ] Events are verified in a real debug surface
- [ ] Manual verification steps are documented
- [ ] Error and cancellation paths are tracked where relevant
- [ ] Event schema is documented clearly

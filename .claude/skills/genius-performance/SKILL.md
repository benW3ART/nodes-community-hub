---
name: genius-performance
description: >-
  Web performance optimization skill. Runs Lighthouse audits, analyzes bundle size,
  implements lazy loading, optimizes images, and improves Core Web Vitals (LCP, CLS, INP).
  Use when user says "optimize performance", "Lighthouse audit", "slow website",
  "bundle too large", "Core Web Vitals", "page speed", "optimize images",
  "improve LCP", "fix CLS", "reduce INP", "performance budget", "web vitals".
  Do NOT use for SEO optimization (genius-seo) or general code quality (genius-reviewer).
context: fork
agent: >-
  You are the Performance Engineer on the Genius Team. You obsess over milliseconds,
  bytes, and user-perceived speed. Your targets: LCP < 2.5s, CLS < 0.1, INP < 200ms.
user-invocable: false
allowed-tools:
  - Read
  - Write
  - Edit
  - exec
hooks:
  pre: read .genius/state.json
  post: update .genius/state.json with performance.scores and performance.issues
---

# genius-performance — Web Performance Optimization

## Targets (Core Web Vitals — Google "Good" Thresholds)

| Metric | Target | Acceptable | Poor |
|--------|--------|-----------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | < 4.0s | > 4.0s |
| **CLS** (Cumulative Layout Shift) | < 0.1 | < 0.25 | > 0.25 |
| **INP** (Interaction to Next Paint) | < 200ms | < 500ms | > 500ms |
| **FCP** (First Contentful Paint) | < 1.8s | < 3.0s | > 3.0s |
| **TTFB** (Time to First Byte) | < 800ms | < 1.8s | > 1.8s |

---

## Step-by-Step Protocol

### Step 1 — Baseline Audit

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit (production URL or local server)
lighthouse https://yoursite.com \
  --output=json \
  --output-path=.genius/lighthouse-report.json \
  --chrome-flags="--headless" \
  --only-categories=performance

# Parse key scores
node -e "
const r = require('./.genius/lighthouse-report.json');
const m = r.audits;
console.log('LCP:', m['largest-contentful-paint'].displayValue);
console.log('CLS:', m['cumulative-layout-shift'].displayValue);
console.log('INP:', m['interaction-to-next-paint']?.displayValue ?? 'N/A');
console.log('Score:', r.categories.performance.score * 100);
"
```

#### Lighthouse CI (automated in CI/CD)

```bash
npm install -g @lhci/cli

# lighthouserc.js
module.exports = {
  ci: {
    collect: { url: ['http://localhost:3000'] },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
}
```

### Step 2 — Bundle Analysis

#### Vite / Next.js (Vite-based)

```bash
npm install --save-dev vite-bundle-visualizer
npx vite-bundle-visualizer
# Opens treemap in browser — look for duplicate deps, large unused libs
```

#### Next.js (Webpack)

```bash
npm install --save-dev @next/bundle-analyzer

# next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
module.exports = withBundleAnalyzer({})

# Run
ANALYZE=true npm run build
```

**Red flags to look for:**
- `lodash` full import → switch to `lodash-es` tree-shaking or individual imports
- `moment.js` → replace with `date-fns` or `dayjs`
- Duplicate `react` instances
- Large icon libraries (`@mui/icons-material`) → use specific icon imports
- Uncompressed images in bundle

### Step 3 — Image Optimization

- **Next.js**: Use `next/image` with `width`, `height`, `sizes`, `priority` (LCP only). Never use raw `<img>`.
- **Non-Next.js**: Use `sharp` for WebP conversion + responsive sizes (400/800/1200/1600w). Use `<picture>` with `srcset` and `loading="lazy" decoding="async"`.

### Step 4 — Code Splitting

```tsx
// Dynamic imports — reduce initial bundle
import dynamic from 'next/dynamic'

// ✅ Lazy-load heavy components
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // if component uses browser APIs
})

// ✅ Lazy-load on interaction
const Modal = dynamic(() => import('@/components/Modal'))

// Route-level code splitting (automatic in Next.js App Router)
// Each page.tsx is its own bundle
```

```typescript
// Vite / React Router — lazy routes
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./pages/Dashboard'))

// In router:
<Suspense fallback={<PageSkeleton />}>
  <Dashboard />
</Suspense>
```

### Step 5 — Fix LCP (Largest Contentful Paint)

Common LCP elements: hero image, H1 text, video thumbnail.

```html
<!-- Preload LCP image -->
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">

<!-- Preconnect to external domains -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

```tsx
// Next.js — mark LCP image with priority
<Image src="/hero.webp" alt="..." priority width={1200} height={630} />
```

**LCP checklist:**
- [ ] LCP image has `priority` / `fetchpriority="high"`
- [ ] No render-blocking CSS above the fold
- [ ] Server response < 600ms (TTFB)
- [ ] LCP resource not lazy-loaded

### Step 6 — Fix CLS (Cumulative Layout Shift)

```css
/* Reserve space for images */
img {
  aspect-ratio: attr(width) / attr(height);
}

/* Reserve space for dynamic content (ads, embeds) */
.ad-slot {
  min-height: 250px;
}

/* Avoid inserting content above existing content */
```

```tsx
// Always set width/height on images
<Image width={800} height={400} src="..." alt="..." />

// Use skeleton loaders with fixed dimensions
<Skeleton width={320} height={180} />
```

### Step 7 — Fix INP (Interaction to Next Paint)

```typescript
// Defer non-critical work
function handleClick() {
  // Critical path
  updateUI()

  // Defer analytics and heavy work
  setTimeout(() => {
    trackEvent('button_clicked')
    runHeavyCalculation()
  }, 0)
}

// Use web workers for CPU-intensive tasks
const worker = new Worker('/workers/compute.js')

// Avoid long tasks (> 50ms) — break them up
async function processItems(items: Item[]) {
  for (const item of items) {
    await process(item)
    await new Promise(resolve => setTimeout(resolve, 0)) // yield to browser
  }
}
```

### Step 8 — Caching Strategy

Set Cache-Control headers: static assets (`/_next/static/`) → `public, max-age=31536000, immutable`; images → `public, max-age=86400, stale-while-revalidate=604800`. Configure in `next.config.ts` `headers()` or server/CDN config.

### Step 9 — CDN Setup

```bash
# Vercel — automatic Edge CDN, zero config
# Cloudflare — add to existing domain, enable:
#   - Auto Minify (JS, CSS, HTML)
#   - Brotli compression
#   - Cache Everything (for static assets)
#   - Rocket Loader (async JS, use carefully)
```

---

## Output

Save `.genius/performance-report.md` with baseline, fixes, remaining issues, and projected impact. Mirror the headline metrics in `.genius/state.json`.

---

## Handoff

- **→ genius-analytics** — Send Core Web Vitals to GA4 via `web-vitals` library
- **→ genius-seo** — Good Core Web Vitals improve Google rankings (Page Experience signal)
- **→ genius-reviewer** — Review code changes for performance regressions

---

## Playground Update

Refresh the existing dashboard tab with real performance data and point the user to `.genius/DASHBOARD.html`.

---

## Definition of Done

- [ ] Baseline metrics captured before optimization
- [ ] Slow points reference specific files or components
- [ ] Recommended fixes are implementation-ready
- [ ] Expected impact is estimated
- [ ] Priority order is clear

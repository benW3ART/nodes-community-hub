---
name: genius-accessibility
description: >-
  Web accessibility audit and implementation skill. Checks WCAG 2.2 AA compliance,
  audits color contrast, ARIA usage, keyboard navigation, and screen reader compatibility.
  Use when user says "accessibility audit", "a11y", "WCAG compliance", "screen reader",
  "ARIA", "color contrast", "keyboard navigation", "ADA compliance", "accessible forms",
  "focus management", "skip links", "alt text audit".
  Do NOT use for general UI development (genius-dev-frontend) — run this as a post-dev audit.
context: fork
agent: >-
  You are the Accessibility Engineer on the Genius Team. You ensure the product
  is usable by everyone, regardless of disability. You audit against WCAG 2.2 AA
  and provide specific, actionable fixes ranked by severity.
user-invocable: false
allowed-tools:
  - Read
  - Write
  - Edit
  - exec
hooks:
  pre: read .genius/state.json
  post: write .genius/a11y-report.md and update .genius/state.json with accessibility.score
---

# genius-accessibility — WCAG 2.2 AA Audit & Implementation

## Principles

1. **Semantic HTML first** — Use correct elements before adding ARIA.
2. **ARIA is a last resort** — `<button>` beats `<div role="button">` every time.
3. **Test with real assistive technology** — axe-core finds ~30% of issues. Humans find the rest.
4. **No accessibility = legal risk** — ADA, EAA (EU 2025), AODA compliance matters.

---

## Step-by-Step Protocol

### Step 1 — Automated Audit (axe-core)

```bash
# Install axe CLI
npm install -g @axe-core/cli

# Run against local or production URL
axe http://localhost:3000 --reporter json > .genius/axe-report.json

# Check critical violations
node -e "
const r = require('./.genius/axe-report.json');
const violations = r[0].violations;
console.log('Critical:', violations.filter(v => v.impact === 'critical').length);
console.log('Serious:', violations.filter(v => v.impact === 'serious').length);
console.log('Moderate:', violations.filter(v => v.impact === 'moderate').length);
violations.filter(v => ['critical','serious'].includes(v.impact))
  .forEach(v => console.log(\`[\${v.impact.toUpperCase()}] \${v.id}: \${v.description}\`));
"
```

#### Playwright + axe (CI integration)

Use `@axe-core/playwright` with `AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()`. Test all key pages (home, checkout, forms). Run: `npx playwright test tests/accessibility.spec.ts`

### Step 2 — Color Contrast

**Minimum ratios (WCAG 2.2 AA):**
- Normal text (< 18pt): **4.5:1**
- Large text (≥ 18pt / 14pt bold): **3:1**
- UI components & graphical objects: **3:1**

```bash
# Install contrast checker
npm install -g @accessibility-checker/contrast

# Check specific colors
node -e "
const { getContrastRatio } = require('@accessibility-checker/contrast');
const ratio = getContrastRatio('#6B7280', '#FFFFFF');
console.log('Ratio:', ratio.toFixed(2) + ':1');
console.log('AA Pass (normal text):', ratio >= 4.5);
"
```

**Common failures to check:**
- Gray placeholder text on white background (often < 4.5:1)
- Light blue links on white background
- White text on brand color buttons
- Disabled state text (still needs 3:1 minimum in WCAG 2.2)

```css
/* ✅ WCAG AA compliant color tokens */
:root {
  --text-primary: #111827;      /* 16.7:1 on white */
  --text-secondary: #374151;    /* 10.9:1 on white */
  --text-muted: #4B5563;        /* 7.4:1 on white — NOT #9CA3AF (2.8:1 ❌) */
  --brand-500: #6366F1;         /* Check on white: 4.7:1 ✅ */
  --error: #DC2626;             /* 4.6:1 on white ✅ */
}
```

### Step 3 — Semantic HTML Structure

```html
<!-- ✅ Correct landmark structure -->
<header role="banner">
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>

<main id="main-content">
  <h1>Page Title</h1> <!-- Only ONE h1 per page -->
  
  <article>
    <h2>Section</h2>
    <h3>Subsection</h3> <!-- Don't skip heading levels -->
  </article>
</main>

<aside aria-label="Related content">...</aside>
<footer role="contentinfo">...</footer>

<!-- Skip link (must be first focusable element) -->
<a href="#main-content" class="skip-link">Skip to main content</a>
```

```css
/* Skip link — visible on focus */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
  transition: top 0.2s;
}
.skip-link:focus {
  top: 0;
}
```

### Step 4 — ARIA Usage (when semantic HTML isn't enough)

```tsx
// ✅ Custom dropdown — ARIA required
<div
  role="combobox"
  aria-expanded={isOpen}
  aria-haspopup="listbox"
  aria-controls="dropdown-list"
  aria-activedescendant={selectedId}
>
  <input aria-autocomplete="list" />
</div>
<ul id="dropdown-list" role="listbox">
  {options.map(opt => (
    <li key={opt.id} id={opt.id} role="option" aria-selected={opt.id === selectedId}>
      {opt.label}
    </li>
  ))}
</ul>

// ✅ Live region for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// ✅ Loading states
<button aria-busy={isLoading} aria-disabled={isLoading}>
  {isLoading ? 'Saving...' : 'Save'}
</button>

// ❌ Don't do this
<div role="button" onClick={handleClick}> // Use <button> instead
<span aria-label="Close">X</span> // Use <button aria-label="Close">×</button>
```

### Step 5 — Form Accessibility

```tsx
// ✅ Accessible form pattern
<form>
  <div>
    <label htmlFor="email">
      Email address
      <span aria-hidden="true"> *</span>
    </label>
    <input
      id="email"
      type="email"
      name="email"
      required
      aria-required="true"
      aria-describedby="email-error email-hint"
      aria-invalid={hasError}
      autoComplete="email"
    />
    <span id="email-hint" className="hint">
      We'll never share your email.
    </span>
    {hasError && (
      <span id="email-error" role="alert" className="error">
        Please enter a valid email address.
      </span>
    )}
  </div>
</form>
```

### Step 6 — Keyboard Navigation

**All interactive elements must be reachable via Tab and operable via keyboard:**

```tsx
// ✅ Custom interactive components
function Accordion({ items }) {
  return items.map((item, i) => (
    <div key={item.id}>
      <button
        aria-expanded={item.isOpen}
        aria-controls={`panel-${i}`}
        id={`header-${i}`}
      >
        {item.title}
      </button>
      <div
        id={`panel-${i}`}
        role="region"
        aria-labelledby={`header-${i}`}
        hidden={!item.isOpen}
      >
        {item.content}
      </div>
    </div>
  ))
}
```

```css
/* ✅ Always visible focus indicators */
:focus-visible {
  outline: 3px solid #6366F1;
  outline-offset: 2px;
  border-radius: 4px;
}

/* ❌ Never do this */
*:focus { outline: none; }
```

**Focus trap for modals:**

```typescript
// Use focus-trap-react
import FocusTrap from 'focus-trap-react'

<FocusTrap active={isOpen}>
  <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
    <h2 id="dialog-title">Confirm action</h2>
    {/* ... */}
    <button onClick={onClose}>Close</button>
  </div>
</FocusTrap>
```

### Step 7 — Images & Media

```tsx
// ✅ Informative image
<img src="chart.png" alt="Bar chart showing 40% increase in Q4 revenue" />

// ✅ Decorative image
<img src="divider.png" alt="" role="presentation" />

// ✅ Complex image — reference long description
<figure>
  <img src="org-chart.png" alt="Company org chart — see description below" aria-describedby="chart-desc" />
  <figcaption id="chart-desc">
    The CEO reports to the Board. Three VPs report to the CEO: Engineering, Product, and Sales.
  </figcaption>
</figure>

// ✅ Video
<video controls>
  <source src="demo.mp4" type="video/mp4" />
  <track kind="captions" src="captions.vtt" srclang="en" label="English" default />
</video>
```

### Step 8 — Screen Reader Testing

**Manual testing checklist:**

```markdown
**Screen Reader Checklist** (VoiceOver CMD+F5 on mac, NVDA on Windows):
- [ ] Page title, landmarks, form labels, error messages (aria-live), alt text, interactive roles all announced correctly
- [ ] Tab order logical, heading navigation works (H key), modal traps focus

---

## Output

Write `.genius/a11y-report.md` with severity-grouped findings and record the audit summary in `.genius/state.json`.

---

## Handoff

- **→ genius-dev-frontend** — Fix identified issues in components
- **→ genius-performance** — Ensure a11y fixes don't regress performance
- **→ genius-reviewer** — Add a11y checks to PR review process

---

## Playground Update

Refresh the existing dashboard tab with real accessibility data and point the user to `.genius/DASHBOARD.html`.

---

## Definition of Done

- [ ] Failed WCAG criterion is named for each issue
- [ ] Affected element or selector is identified
- [ ] User impact is stated
- [ ] Fix guidance is concrete enough to implement

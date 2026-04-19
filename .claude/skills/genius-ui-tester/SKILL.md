---
name: genius-ui-tester
description: >-
  Visual UI testing using Claude Code Computer Use. Takes screenshots, detects visual bugs,
  validates layouts, checks responsive design, and generates visual regression reports.
  Use when user says "test the UI", "visual testing", "screenshot test", "check the layout",
  "does it look right", "visual regression", "UI bugs", "test on mobile size",
  "check responsive", "visual QA".
  Do NOT use for functional testing (use genius-qa or genius-qa-micro).
  Do NOT use for accessibility audits (use genius-accessibility).
  Do NOT use for performance testing (use genius-performance).
context: fork
agent: genius-ui-tester
user-invocable: false
allowed-tools:
  - Read(*)
  - Glob(*)
  - Grep(*)
  - Write(*)
  - Edit(*)
  - Bash(npm *)
  - Bash(npx *)
  - Bash(node *)
  - Bash(curl *)
  - Bash(open *)
  - computer(*)
---

# Genius UI Tester v20.0 — Visual Testing with Computer Use

**Uses Claude Code Computer Use to visually test UIs. Screenshots, layout validation, responsive checks, and visual bug reports.**

> Requires Claude Code 2.1.80+ with Computer Use enabled (Pro/Max plan).

## Memory Integration

### On Test Start
Read `@.genius/memory/BRIEFING.md` for project context, design system, and known UI issues.

### On Bug Found
Append to `.genius/memory/errors.json`:
```json
{"id": "e-XXX", "error": "UI-BUG: [description] at [viewport] on [page]", "solution": "pending fix", "timestamp": "ISO-date", "tags": ["ui-test", "visual-bug"]}
```

---

## Prerequisites

- Claude Code 2.1.80+ with Computer Use capability
- Pro or Max plan (Computer Use not available on free tier)
- Dev server running locally (e.g., `npm run dev` on localhost:3000)

---

## Testing Protocol

### Step 1 — Launch Dev Server
Verify dev server is running. If not, start it.

### Step 2 — Define Test Matrix

| Viewport | Width | Height | Device |
|----------|-------|--------|--------|
| Mobile | 375 | 812 | iPhone 13 |
| Tablet | 768 | 1024 | iPad |
| Desktop | 1440 | 900 | Laptop |
| Wide | 1920 | 1080 | Monitor |

### Step 3 — Screenshot & Analyze Each Page
For each page: navigate via Computer Use, screenshot, analyze for:
- Layout overflow/clipping, text truncation/overlap
- Broken images/icons, inconsistent spacing
- Color contrast issues, missing hover/focus states
- Z-index stacking problems

### Step 4 — Responsive Comparison
Compare same page across viewports: stacking, navigation collapse, image scaling, touch targets (<44px).

### Step 5 — Interactive Element Testing
Use Computer Use to click buttons, open dropdowns/modals, fill forms, test hover states, verify loading states.

---

## Report Format

Generate `UI-TEST-REPORT.md` with: summary (total checks, passed, bugs, severity), bug details (page, viewport, severity, description), and passed checks list.

---

## Handoffs

### From genius-dev / genius-dev-frontend
Receives: Completed UI implementation ready for visual testing

### To genius-debugger
Provides: Visual bug details with page, viewport, and description

### To genius-qa
Provides: UI test report for inclusion in full QA audit

---

## Definition of Done

- [ ] All specified pages tested across all viewports
- [ ] Screenshots captured for each page/viewport combination
- [ ] Visual bugs documented with severity, page, viewport, description
- [ ] Interactive elements tested (clicks, hovers, forms)
- [ ] UI-TEST-REPORT.md generated with pass/fail summary
- [ ] Critical bugs escalated to genius-debugger

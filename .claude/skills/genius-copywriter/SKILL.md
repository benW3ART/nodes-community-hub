---
name: genius-copywriter
description: Creates all written content including landing pages, emails, CTAs, UI text, and error messages. Use for "write copy", "landing page", "headlines", "email copy", "button text", "CTA", "marketing copy", "UX writing", "tagline".
---

## ⚠️ MANDATORY ARTIFACT

**This skill MUST generate:**
- XML: `.claude/discovery/COPY.xml`
- HTML Playground: `.genius/outputs/COPY-OPTIONS.html`

**Before transitioning to next skill:**
1. Verify XML exists
2. Verify HTML playground exists
3. Update state.json checkpoint
4. Announce transition

**If artifacts missing:** DO NOT proceed. Generate them first.

---

# Genius Copywriter v9.0 — Words That Convert

**Every word either sells or it doesn't.**

## Memory Integration

### On Session Start
Read `@.genius/memory/BRIEFING.md` for project context, brand voice, and target audience.

### During Copywriting
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "COPY: [section] — [approach]", "reason": "[why this tone/style]", "timestamp": "ISO-date", "tags": ["copy", "decision"]}
```

### On Complete
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "COPY COMPLETE: [sections] with A/B variants", "reason": "all sections covered", "timestamp": "ISO-date", "tags": ["copy", "complete"]}
```

---

## Prerequisites

**REQUIRED:** MARKETING-STRATEGY.xml, messaging framework, target personas

---

## Copy Categories

### Landing Page (Hero → Features → Social Proof → CTA)
- **Headline**: Benefit-first, specific, compelling
- **Subheadline**: Supporting detail
- **CTA**: Action + Value ("Start Free Trial", not "Submit")

### Emails (Welcome, Activation, Retention)
- Subject lines with A/B variants
- Personal, conversational tone
- Clear single CTA per email

### UI Copy (Buttons, Labels, Errors, Empty States)
- Consistent voice throughout
- Helpful error messages
- Encouraging empty states

---

## Output: COPY.md

Component-mapped copy with A/B variants for key sections.

---

## Playground Integration

### Template
`playgrounds/templates/copy-ab-tester.html`

### Flow

1. **Generate Variants**: Create 2-3 copy variants for the requested section
2. **Build Output**: Create `.genius/outputs/COPY-OPTIONS.html` with variants injected
3. **User Review**: User interactively compares and refines:
   - 3 variants side by side
   - Tone sliders (formal/casual, serious/playful, technical/simple)
   - Format preview (landing page, email, social, ad)
4. **Capture Selection**: Final prompt contains chosen variant with validated tone

### Variant Format

```javascript
{
  headline: "Main headline text",
  subheadline: "Supporting subheadline",
  cta: "Call to action button text",
  body: "Body copy paragraph"
}
```

### Injection Example

When creating `COPY-OPTIONS.html`, inject variants into the template's state:

```javascript
// Replace the default state.variants with generated copy
state.variants = {
  a: {
    headline: "Ship 10x Faster with AI",
    subheadline: "The platform developers actually love",
    body: "Stop writing boilerplate. Let AI handle the repetitive work while you focus on what matters.",
    cta: "Start Free Trial"
  },
  b: {
    headline: "Code Less. Build More.",
    subheadline: "AI-powered development for modern teams",
    body: "Join 50,000+ developers who ship faster with intelligent code assistance.",
    cta: "Try It Free"
  },
  c: {
    headline: "Your AI Pair Programmer",
    subheadline: "From idea to production in minutes",
    body: "The smartest way to write code. Autocomplete on steroids, powered by the latest AI.",
    cta: "Get Started"
  }
};
```

### User Interaction

The playground allows users to:
- **Compare**: See all 3 variants rendered side by side
- **Adjust Tone**: Sliders for formal↔casual, serious↔playful, technical↔simple
- **Preview Formats**: Switch between landing page, email, social, and ad layouts
- **Select Winner**: Click to select the preferred variant
- **Copy Output**: Generated prompt includes selected variant + tone settings

### Output Location

`.genius/outputs/COPY-OPTIONS.html` — User opens in browser for interactive comparison

---

## Handoffs

### From: genius-marketer
Receives: MARKETING-STRATEGY.xml, messaging framework, personas

### To: genius-dev
Provides: COPY.md with component-mapped copy, all UI text strings

### To: genius-integration-guide (parallel)
Coordinates: CTA tracking, email service setup

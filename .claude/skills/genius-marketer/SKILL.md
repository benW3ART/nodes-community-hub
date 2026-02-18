---
name: genius-marketer
description: Go-to-market strategy skill that defines audience segments, positioning, acquisition channels, launch plans, and success metrics. Creates MARKETING-STRATEGY.xml and TRACKING-PLAN.xml. Use for "marketing strategy", "go-to-market", "launch plan", "growth strategy", "acquisition channels", "GTM".
---

## ⚠️ MANDATORY ARTIFACT

**This skill MUST generate:**
- XML: `.claude/discovery/MARKETING-PLAN.xml`
- HTML Playground: `.genius/outputs/GTM-STRATEGY.html`

**Before transitioning to next skill:**
1. Verify XML exists
2. Verify HTML playground exists
3. Update state.json checkpoint
4. Announce transition

**If artifacts missing:** DO NOT proceed. Generate them first.

---

# Genius Marketer v9.0 — Growth Strategist

**From zero to traction with data-driven marketing.**

## Memory Integration

### On Session Start
Read `@.genius/memory/BRIEFING.md` for project context and existing strategy.

### During Strategy
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "MARKETING: [decision] | Channel: [channel]", "reason": "[rationale]", "timestamp": "ISO-date", "tags": ["marketing", "strategy"]}
```

### On Complete
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "GTM STRATEGY COMPLETE: Channels=[list] | KPIs=[metrics]", "reason": "strategy defined", "timestamp": "ISO-date", "tags": ["marketing", "complete"]}
```

---

## Prerequisites

**REQUIRED:** DISCOVERY.xml, MARKET-ANALYSIS.xml, design-config.json

---

## Marketing Strategy Framework

1. **AUDIENCE** — Segment definition, ICP, buyer personas
2. **POSITIONING** — Competitive differentiation, value proposition, messaging
3. **CHANNELS** — Selection, prioritization, budget allocation
4. **LAUNCH** — Pre-launch checklist, launch sequence, post-launch optimization
5. **METRICS** — KPIs by stage, tracking setup, reporting cadence

---

## Playground Integration

### GTM Simulator Flow

1. **Analyze Context** — Read DISCOVERY.xml and MARKET-ANALYSIS.xml to understand the product, target market, and competitive landscape

2. **Propose Initial Strategy** — Based on analysis, recommend:
   - Budget tier (Bootstrap/Seed/Series A)
   - Channel mix aligned with target audience
   - 12-month phased approach

3. **Generate Interactive Playground** — Create `.genius/outputs/GTM-STRATEGY.html` with injected data for user simulation

4. **User Simulates Interactively:**
   - Budget total and allocation per channel
   - 12-month timeline with phases (Pre-launch → Launch → Growth → Scale)
   - CAC per channel and target LTV
   - User acquisition projections and ROI

5. **Capture Validated Strategy** — User copies the generated prompt output containing the complete GTM strategy with budget, timeline, and projections

### Data to Inject

Use the template at `playgrounds/templates/gtm-simulator.html` and inject these values into the `presets` object and `state`:

```javascript
const presets = {
    bootstrap: {
        budget: 0,
        ltv: [PRODUCT_LTV_ESTIMATE],
        arpu: [MONTHLY_ARPU],
        channels: {
            'Paid Ads': { allocation: 0, cac: 25 },
            'Content Marketing': { allocation: 40, cac: 5 },
            'Social': { allocation: 35, cac: 5 },
            'Influencers': { allocation: 0, cac: 35 },
            'PR': { allocation: 5, cac: 10 },
            'Partnerships': { allocation: 20, cac: 5 }
        }
    },
    seed: {
        budget: 10000,
        ltv: [PRODUCT_LTV_ESTIMATE],
        arpu: [MONTHLY_ARPU],
        channels: { /* Balanced mix */ }
    },
    seriesA: {
        budget: 100000,
        ltv: [PRODUCT_LTV_ESTIMATE],
        arpu: [MONTHLY_ARPU],
        channels: { /* Aggressive paid + organic */ }
    }
};
```

### Budget Tiers & Recommended Channel Mix

| Tier | Budget | Focus Channels | Strategy |
|------|--------|----------------|----------|
| **Bootstrap** | €0 | Content, Social, Partnerships | Organic-first, virality, community |
| **Seed** | €10K | Balanced paid + organic | Test channels, find PMF |
| **Series A** | €100K+ | Paid Ads, Influencers, Content | Scale proven channels |

### Acquisition Projections to Inject

Based on market analysis, estimate:
- **Target LTV** — From pricing model and retention assumptions
- **ARPU** — Monthly revenue per user
- **CAC by Channel** — Industry benchmarks adjusted for niche
- **Expected Conversion Rates** — By channel type

### Prompt Output Format

The playground generates a complete GTM strategy prompt including:
- Budget & timeline summary
- Phase breakdown (Pre-launch/Launch/Growth/Scale)
- Channel mix with allocations and CAC
- Unit economics (LTV, ARPU, blended CAC, LTV:CAC ratio)
- 12-month projections (users, revenue, ROI)
- Actionable recommendations

This validated output becomes the basis for MARKETING-STRATEGY.xml.

---

## Output

- `MARKETING-STRATEGY.xml` — Full strategy with audience, positioning, channels, launch plan, metrics
- `TRACKING-PLAN.xml` — Events, funnels, analytics tools

---

## Handoffs

### From: genius-designer
Receives: design-config.json, brand personality

### To: genius-copywriter (parallel)
Provides: MARKETING-STRATEGY.xml, messaging framework, target personas

### To: genius-integration-guide
Provides: TRACKING-PLAN.xml, analytics tool recommendations

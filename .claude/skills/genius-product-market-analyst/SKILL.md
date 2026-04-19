---
name: genius-product-market-analyst
description: >-
  Market research and business strategy skill. Validates product-market fit, analyzes
  competition, identifies market gaps, and proposes business models. Use when user says
  "market research", "competitor analysis", "validate idea", "business model",
  "product-market fit", "pricing", "TAM SAM SOM", "market opportunity", "analyze the market",
  "who are the competitors", "market size", "target audience analysis".
  Do NOT use for writing technical specs (genius-specs).
  Do NOT use for building the product (genius-dev skills) or tracking post-launch metrics
  (genius-analytics).
---

## ⚠️ MANDATORY ARTIFACT

**This skill MUST generate:**
- XML: `.claude/discovery/MARKET-ANALYSIS.xml`
- Unified State: `.genius/outputs/state.json` (with `phases.market` populated)

**Before transitioning to next skill:**
1. Verify XML exists
2. Verify state.json has market phase complete
3. Update `currentPhase` to next phase
4. Announce transition

**If artifacts missing:** DO NOT proceed. Generate them first.

---

## Unified Dashboard Integration

**DO NOT launch separate HTML files.** Update the unified state instead.

### On Phase Start
Update `.genius/outputs/state.json`:
```json
{
  "currentPhase": "market",
  "phases": {
    "market": {
      "status": "in-progress",
      "data": { ... }
    }
  }
}
```

### On Phase Complete
Update state.json with:
- `phases.market.status` = `"complete"`
- `phases.market.data` = full market analysis data
- `currentPhase` = `"specs"` (or next phase)

---

# Genius Product Market Analyst v17.0 — Strategic Intelligence

**Turn ideas into validated opportunities.**

## Memory Integration

### On Session Start
Read `@.genius/memory/BRIEFING.md` for project context and existing research.

### During Analysis
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "MARKET: [finding]", "reason": "source: [source], confidence: [level]", "timestamp": "ISO-date", "tags": ["market", "research"]}
```

### On Complete
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "MARKET ANALYSIS COMPLETE: TAM=[tam] | Opportunity=[gap]", "reason": "analysis done", "timestamp": "ISO-date", "tags": ["market", "complete"]}
```

---

## Analysis Framework

1. **OPPORTUNITY ASSESSMENT** — Problem validation, urgency, frequency, willingness to pay
2. **COMPETITIVE LANDSCAPE** — Direct/indirect competitors, positioning map
3. **MARKET SIZING** — TAM/SAM/SOM with bottom-up validation
4. **BUSINESS MODEL** — Revenue streams, pricing strategy, unit economics
5. **GO-TO-MARKET** — Channel strategy, launch approach

---

## Opportunity Score

```
SCORE = (Urgency x 2) + (Frequency x 2) + (WTP x 3)

25-35: Strong opportunity
15-24: Moderate — needs refinement
<15:   Weak — pivot or validate more
```

---

## Output: MARKET-ANALYSIS.xml

Structured XML with: executive summary, market size, opportunity assessment, competitors, positioning, business model, market risks, next steps.

---

## Playground Integration

### Flow avec Unified Dashboard

1. **Analyze the market** — TAM/SAM/SOM, competitors, pricing (standard method)
2. **Update state.json** — Write market analysis data to `phases.market`
3. **User views in dashboard** — The unified dashboard shows market phase automatically
4. **Validation** — User reviews data, provides feedback
5. **Continuer** — Mark phase complete, move to next

### Updating State.json

**DO NOT copy templates or create separate HTML files.** The unified dashboard is already running.

Update `.genius/outputs/state.json` with market data:

```json
{
  "currentPhase": "market",
  "phases": {
    "market": {
      "status": "in-progress",
      "data": {
        "price": 49,
        "tam": 500000,
        "conversion": 2.5,
        "churn": 5,
        "cac": 25,
        "preset": "realistic",
        "competitors": [
          {
            "name": "Your product",
            "color": "#58a6ff",
            "scores": { "prix": 7, "features": 8, "ux": 8, "brand": 5, "support": 7 }
          },
          {
            "name": "Competitor 1",
            "color": "#f85149",
            "scores": { "prix": 6, "features": 7, "ux": 6, "brand": 8, "support": 5 }
          }
        ]
      }
    }
  }
}
```

### Data Schema for Market Phase

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `price` | number | Monthly unit price (€) | `49` |
| `tam` | number | Total addressable market (users) | `500000` |
| `conversion` | number | Estimated conversion rate (%) | `2.5` |
| `churn` | number | Monthly churn rate (%) | `5` |
| `cac` | number | Customer acquisition cost (€) | `25` |
| `competitors` | array | Competitor list with scores | see below |

#### Competitor Structure

```json
{
  "name": "Competitor Name",
  "color": "#hexcolor",
  "scores": {
    "prix": 7,
    "features": 8,
    "ux": 8,
    "brand": 5,
    "support": 7
  }
}
```

### Automatic Calculations (done by dashboard)

The unified dashboard calculates:
- **TAM/SAM/SOM** — SAM = 33% of TAM, SOM = 33% of SAM
- **LTV** — price × (1 / churn_rate)
- **LTV/CAC Ratio** — LTV / CAC (🟢 ≥3x, 🟡 2-3x, 🔴 <2x)
- **Payback** — CAC / price (in months)
- **3 scenarios** — Pessimistic (×0.6), Realistic, Optimistic (×1.5)

### Workflow

1. **Analyze market** — Gather data (TAM, competitors, pricing)
2. **Update state.json** — Write to `phases.market.data`
3. **User reviews** — Dashboard shows market analysis view
4. **Validate** — User confirms or requests changes
5. **Mark complete** — Set `phases.market.status = "complete"`

---

## Handoffs

### From: genius-interviewer
Receives: DISCOVERY.xml with project context

### To: genius-specs
Provides: MARKET-ANALYSIS.xml, competitive positioning, pricing recommendation

### To: genius-marketer
Provides: Positioning map, target segments, competitive intelligence

## Handoff to genius-analytics

After launch, use **genius-analytics** to:
- Validate the TAM/SAM estimates against real user data
- Track conversion rates and acquisition costs
- Measure retention and churn against the model projections


---

## Next Step (Auto-Chain)

When this skill completes its work:
→ **Automatically suggest**: "Market analysis complete! Ready to write specifications? I'll hand off to **genius-specs**."
→ If user approves: route to genius-specs
→ Update state.json: `currentSkill = "genius-specs"`

## Definition of Done

- [ ] Market problem, audience, and competitive landscape are analyzed
- [ ] Findings produce actionable positioning or pricing implications
- [ ] Output is concrete enough to drive specifications
- [ ] Key assumptions and unknowns are called out explicitly
- [ ] Next-step handoff to specs or marketing is clear

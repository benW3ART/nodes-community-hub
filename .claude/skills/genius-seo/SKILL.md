---
name: genius-seo
description: >-
  GEO-first SEO optimization skill. Optimizes websites for AI search engines
  (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews) AND traditional
  search. Includes: citability scoring, AI crawler analysis, brand authority,
  schema markup, technical SEO, content quality (E-E-A-T), and llms.txt.
  Use when user says "SEO audit", "optimize for search", "AI search visibility",
  "GEO optimization", "is my site visible to AI", "llms.txt", "structured data".
  Do NOT use during early development — run after the site is deployed.
context: fork
agent: genius-seo
user-invocable: true
allowed-tools:
  - Read(*)
  - Write(*)
  - Edit(*)
  - Glob(*)
  - Grep(*)
  - Bash(curl *)
  - Bash(python3 *)
  - Bash(npx *)
---

# Genius SEO v17 — GEO-first Optimization

**AI search is eating traditional search. +527% AI-referred traffic YoY. 4.4x better conversion than organic. Optimize for where traffic is going.**

---

## GEO vs SEO

| Traditional SEO | GEO (Generative Engine Optimization) |
|----------------|-------------------------------------|
| Keywords in title/H1 | Brand mentions on AI-cited platforms |
| Backlinks | Citation readiness (clear, factual, structured) |
| Google rankings | Visibility in ChatGPT, Perplexity, Claude answers |
| Meta description | llms.txt for AI crawler guidance |
| Schema for rich snippets | Schema for AI understanding |

**This skill optimizes both.** GEO first, SEO as foundation.

---

## Commands

| Command | What it does |
|---------|-------------|
| `/geo audit <url>` | Full GEO + SEO audit with parallel sub-skills |
| `/geo citability <url>` | Score content for AI citation readiness |
| `/geo technical <url>` | Technical SEO analysis |
| `/geo content <url>` | Content quality & E-E-A-T assessment |
| `/geo schema <url>` | Structured data analysis & generation |
| `/geo llmstxt <url>` | Analyze or generate llms.txt |
| `/geo report` | Generate comprehensive GEO+SEO report |

---

## Audit Protocol (Full)

### Phase 1: Technical Foundation
```bash
# Check robots.txt for AI crawlers
curl -s {URL}/robots.txt

# Check llms.txt
curl -s {URL}/llms.txt

# Check sitemap
curl -s {URL}/sitemap.xml | head -50
```

### Phase 2: AI Citability Analysis
Evaluate content for AI citation readiness:
- **Factual density**: Clear, verifiable statements (not vague claims)
- **Authority signals**: Author bios, publication dates, sources cited
- **Structured data**: FAQ, HowTo, Article schema
- **E-E-A-T**: Experience, Expertise, Authoritativeness, Trustworthiness

Score 0-100. Above 70 = good AI citability.

### Phase 3: AI Crawler Access
Check if major AI crawlers can access the site:
- `GPTBot` (OpenAI)
- `ClaudeBot` (Anthropic)
- `PerplexityBot`
- `GoogleOther-Extended` (Google AI)

If blocked in robots.txt → provide corrected robots.txt

### Phase 4: Schema Markup
Generate missing structured data:
- `Organization` with `sameAs` (social profiles)
- `WebSite` with `SearchAction`
- `Article` / `BlogPosting` for content pages
- `FAQPage` for FAQ sections
- `Product` / `Service` for commercial pages

### Phase 5: Brand Authority Signals
Identify key citation platforms for the brand's industry and check presence.

### Phase 6: llms.txt Generation
If missing, generate `/llms.txt` following the standard:
```
# {Site Name}
> {One-line description}

{Key pages and their purpose for AI agents}

## {Section}
- [{Page title}]({URL}): {Description}
```

---

## Output

Produce `.genius/seo-report.md` with:
- GEO Score (0-100)
- SEO Score (0-100)
- Critical issues (fix immediately)
- High priority (fix this sprint)
- Opportunities (next iteration)
- Generated files (robots.txt fix, llms.txt, schema snippets)

Update `.genius/outputs/state.json`:
```bash
jq --arg ts "$(date -Iseconds)" '.skill = "genius-seo" | .status = "complete" | .updatedAt = $ts' .genius/outputs/state.json > .genius/outputs/state.json.tmp && mv .genius/outputs/state.json.tmp .genius/outputs/state.json 2>/dev/null || true
```

---

## Compatibility

- **CLI mode**: Full audit via curl + analysis
- **IDE mode**: Same, output in terminal panel
- **OpenClaw**: Deliver report via channel + save to .genius/
- **Codex engine**: Use thread forking for parallel sub-audits

---

## Playground Update (MANDATORY)

After completing your task:
1. **DO NOT create a new HTML file** — update the existing genius-dashboard tab
2. Open `.genius/DASHBOARD.html` and update YOUR tab's data section with real project data
3. If your tab doesn't exist yet, add it to the dashboard (hidden tabs become visible on first real data)
4. Remove any mock/placeholder data from your tab
5. Tell the user: `📊 Dashboard updated → open .genius/DASHBOARD.html`

---

## Definition of Done

Every recommendation MUST be:
1. **Specific**: Reference actual page URL, file path, or element selector
2. **Actionable**: Include exact code/content change to make
3. **Measurable**: State expected metric improvement (e.g., "improve LCP from 3.2s to <2.5s")
4. **Prioritized**: Mark as Critical / High / Medium / Low

No generic advice like "improve your content quality" — always reference the specific page and the specific fix.

## Handoffs
- → **genius-content**: For implementing content improvements recommended by SEO audit
- → **genius-dev-frontend**: For technical SEO fixes (Core Web Vitals, structured data)
- → **genius-analytics**: For setting up tracking to measure SEO impact

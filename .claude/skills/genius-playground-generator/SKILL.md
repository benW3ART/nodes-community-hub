---
name: genius-playground-generator
description: >-
  Generates context-aware HTML playgrounds tailored to the specific project.
  Reads project data from .genius/ outputs and specifications to create a
  custom interactive dashboard — not a generic template but a project-specific
  visualization tool. Use when user says "generate playground", "create dashboard",
  "visualize my project", "project playground", "custom dashboard for my project".
  Also automatically suggested after each major skill completes.
  Do NOT use for static template browsing — use /genius-dashboard for that.
context: fork
agent: genius-playground-generator
user-invocable: true
allowed-tools:
  - Read(*)
  - Write(*)
  - Edit(*)
  - Glob(*)
  - Grep(*)
  - Bash(cat *)
  - Bash(jq *)
  - Bash(find *)
  - Bash(ls *)
hooks:
  Stop:
    - type: command
      command: "bash -c 'echo \"PLAYGROUND GENERATED: $(date)\" >> .genius/playground.log 2>/dev/null || true'"
      once: true
---

# Genius Playground Generator v17 — Context-Aware Dashboards

**Not templates. Real project data. Real insights.**

---

## What makes this different

Static templates show fake data. This skill reads YOUR project's actual data:
- The real name of your app (from SPECIFICATIONS.xml or .genius/state.json)
- Your actual tech stack (from ARCHITECTURE.md)
- Your real market data (from MARKET-ANALYSIS.xml)
- Your actual skill outputs (from .genius/outputs/)

And generates an HTML file that is 100% specific to your project.

---

## Data Discovery Protocol

Before generating anything, run this data discovery:

### Step 1: Identify available data sources

```bash
# Project identity
cat .genius/state.json 2>/dev/null | jq '{project: .project, phase: .currentPhase, skills_run: .completedSkills}' 2>/dev/null

# What outputs exist
ls .genius/outputs/ 2>/dev/null
ls .genius/ 2>/dev/null

# Specification data
ls *.xml .genius/*.xml .claude/*.xml 2>/dev/null

# Architecture
ls ARCHITECTURE.md SPECIFICATIONS.md SPECIFICATIONS.xml 2>/dev/null
```

### Step 2: Determine playground type based on data available

| Data found | Playground to generate |
|-----------|----------------------|
| SPECIFICATIONS.xml + ARCHITECTURE.md | Project Overview Dashboard |
| MARKET-ANALYSIS.xml | Market Research Dashboard |
| .genius/seo-report.md | Live SEO/GEO Dashboard |
| .genius/outputs/state.json with dev phase | Development Progress Dashboard |
| .genius/experiments/ | Experiments Results Dashboard |
| Multiple sources | Master Project Dashboard (aggregates all) |

### Step 3: Extract real data

Read the actual content from the files discovered. Extract:
- Project name, description, tech stack
- Phase completion status
- Key metrics, decisions, risks
- Actual URLs, APIs, services used

---

## Generation Protocol

### Template: Master Project Dashboard (most common)

When multiple data sources are available, generate a comprehensive dashboard at `.genius/outputs/PROJECT-DASHBOARD.html`:

**Required sections:**

1. **Header** — Project name (real), phase indicator (real), last updated (real timestamp)

2. **Phase Progress Bar** — Based on .genius/state.json phases:
   ```
   Discovery ██████ 100% | Specs ████ 80% | Design ██ 40% | Dev ░░░░ 0% | QA ░░░░ 0%
   ```

3. **Tech Stack Card** — Real tech detected from ARCHITECTURE.md:
   - Frontend: [actual framework]
   - Backend: [actual runtime/framework]
   - Database: [actual DB]
   - Deployment: [actual platform]
   - Third-party services: [actual integrations]

4. **Market Intelligence** (if MARKET-ANALYSIS.xml exists):
   - TAM/SAM/SOM with real numbers from the analysis
   - Top 3 competitors (real names from the analysis)
   - PMF score if available

5. **Specifications Summary** (if SPECIFICATIONS.xml exists):
   - Feature count (count actual features)
   - MVP scope vs full scope split
   - Key constraints

6. **Development Progress** (if plan.md exists):
   - Tasks completed / total
   - Current in-progress task
   - Next task

7. **Memory Log** (last 5 entries from .genius/memory/ if exists)

8. **Quick Actions** — Buttons that copy slash commands:
   - "Copy /genius-start"
   - "Copy /status"
   - "Copy /continue"

---

## HTML Generation Rules

### Style Requirements
- Single HTML file, zero external dependencies
- **ALWAYS include design tokens**: `<link rel="stylesheet" href="../playgrounds/templates/design-tokens.css">` in `<head>`
- Use CSS variables from design-tokens.css for ALL colors: `var(--color-primary)`, `var(--color-bg-dark)`, `var(--color-text)`, etc.
- If generated IN the project (not in playgrounds/), embed the tokens inline as a `<style>` block at top with same variable names
- Dark mode by default, light mode toggle optional
- Responsive (works on mobile, use `@media (max-width: 768px)`)
- Real data displayed in human-readable format
- Auto-refreshes every 30s (reads state.json via fetch if possible, or shows "Click to refresh")
- Print-friendly CSS (`@media print { ... }`)
- Accessibility: all interactive elements have aria-labels, color contrast ≥ 4.5:1

### Data injection pattern

```html
<!-- Use actual project name, not "My Project" -->
<h1 id="project-name"><!-- injected --></h1>
<script>
  // All data embedded directly in the HTML as JS constants
  const PROJECT_DATA = {
    name: "ACTUAL_PROJECT_NAME",  // Read from state.json or specs
    phase: "ACTUAL_PHASE",        // Read from state.json
    stack: { frontend: "React", backend: "Node.js", db: "PostgreSQL" },  // From ARCHITECTURE.md
    generatedAt: "TIMESTAMP"
  };

  // Render from data
  document.getElementById('project-name').textContent = PROJECT_DATA.name;
</script>
```

**NEVER use placeholder text like "Project Name" or "Your App". Always use real data.**

---

## Specific Playground Types

### SEO/GEO Playground (when .genius/seo-report.md exists)

Generate `.genius/outputs/SEO-DASHBOARD.html` with:
- Real GEO score from the report
- Real issues list from the report
- Real AI crawler status
- Actionable fixes with copy-to-clipboard snippets

### Development Progress Playground (when plan.md exists)

Generate `.genius/outputs/DEV-PROGRESS.html` with:
- Real task list from plan.md (parse the markdown task format)
- Real completion percentages
- Estimated completion based on velocity

### Experiment Results Playground (when .genius/experiments/ exists)

Generate `.genius/outputs/EXPERIMENTS.html` with:
- Real run history from experiment logs
- Real metric evolution chart
- Real best-found result

---

## Output

**Always:**
1. Save to `.genius/outputs/PROJECT-DASHBOARD.html` (master) or type-specific name
2. Print the file path and size
3. Update `.genius/outputs/state.json`:

```bash
jq --arg ts "$(date -Iseconds)" '.skill = "genius-playground-generator" | .status = "complete" | .updatedAt = $ts | .dashboard = ".genius/outputs/PROJECT-DASHBOARD.html"' .genius/outputs/state.json > .genius/outputs/state.json.tmp && mv .genius/outputs/state.json.tmp .genius/outputs/state.json 2>/dev/null || true
```

4. Tell the user: `🎮 Dashboard generated: .genius/outputs/PROJECT-DASHBOARD.html — open in browser to explore your project.`

---

## Compatibility

- **CLI mode**: Generates HTML, prints path. User opens in browser.
- **IDE mode**: Generates HTML. VS Code can preview with Live Server.
- **OpenClaw**: Generates HTML. Can attach as file if needed.
- **Codex engine**: Same — file-based output, no engine-specific behavior.

---

## Suggested trigger (in other skills)

After each major skill (genius-specs, genius-architect, genius-qa, genius-deployer), add:
```
💡 Tip: Run genius-playground-generator to visualize your project's current state.
```

## Handoff

- → **genius-specs / genius-architect / genius-qa / genius-deployer**: Generate an updated dashboard after major artifacts change
- → **genius-designer**: Revisit the presentation layer if the dashboard needs stronger visual treatment
- → **genius-start**: Surface the latest dashboard path during session resume

## Next Step

Open the generated dashboard, confirm the data reflects the latest project state, and regenerate after the next major artifact change.

## Definition of Done

- [ ] Requested playground HTML is generated at the documented path
- [ ] The file renders current project data, not placeholders
- [ ] Output path and refresh instructions are shown to the user
- [ ] `.genius/outputs/state.json` reflects the generation result
- [ ] Any referenced dashboard remains consistent with the new artifact

---
name: genius-architect
description: >-
  Designs technical architecture and stack decisions. Routes to specialized genius-dev-* sub-skills
  based on project type. Use when user says "plan architecture", "choose the stack",
  "technical design", "system design", "what tech should we use", "define the architecture",
  "stack, database schema, API structure", "database schema", "API structure", "technical stack".
  SPECIFICATIONS.xml is preferred but not required — if user explicitly requests architecture, proceed.
  Do NOT use for building code (genius-dev-backend/frontend) or writing feature specs (genius-specs).
---

## ⚠️ MANDATORY ARTIFACT

**This skill MUST generate:**
- Markdown: `ARCHITECTURE.md`
- HTML Playground: `.genius/outputs/ARCHITECTURE.html`

**Before transitioning to next skill:**
1. Verify ARCHITECTURE.md exists
2. Verify HTML playground exists
3. Update state.json checkpoint
4. Announce transition

**If artifacts missing:** DO NOT proceed. Generate them first.

---

# Genius Architect v17.0 — The Master Blueprint

**Breaking down the vision into executable tasks for Agent Teams.**

## Memory Integration

### On Session Start
Read `@.genius/memory/BRIEFING.md` for project context and previous decisions.
Check for previously rejected architectures.

### On Architecture Decision
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "ARCH: [choice]", "reason": "[why] — alternatives: [rejected]", "timestamp": "ISO-date", "tags": ["decision", "architecture"]}
```

### On Architecture Complete
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "ARCHITECTURE COMPLETE: [stack] | [count] tasks", "reason": "approved by user", "timestamp": "ISO-date", "tags": ["architecture", "complete"]}
```

---

## Prerequisites

**REQUIRED before starting:**
- `SPECIFICATIONS.xml` from genius-specs (approved)
- `design-config.json` from genius-designer
- `INTEGRATIONS.md` from genius-integration-guide (optional)

---

## Playground Integration

### Architecture Explorer
Use the interactive playground at `.genius/outputs/ARCHITECTURE.html` for visual architecture design.

**Template:** `playgrounds/templates/architecture-explorer.html`

### Workflow
1. **Design initial architecture** based on specifications
2. **Generate playground** with initial components:
   ```bash
   cp playgrounds/templates/architecture-explorer.html .genius/outputs/ARCHITECTURE.html
   ```
3. **User explores and adjusts:**
   - Drag & drop nodes onto the canvas
   - Create visual connections between components
   - Configure each node (technology, endpoints, env vars)
   - Apply presets for quick starts
4. **Copy prompt output** — the validated architecture in markdown

### Node Types
| Type | Icon | Description |
|------|------|-------------|
| `frontend` | 🖥️ | Web clients, SPAs, SSR apps |
| `api` | ⚙️ | Backend servers, API gateways |
| `database` | 🗄️ | Databases, data stores |
| `external` | 🔌 | Third-party services, APIs |
| `queue` | 📬 | Message queues, event buses |
| `cache` | ⚡ | Cache layers, KV stores |

### Node Data Format
```javascript
{
  id: number,        // Unique identifier
  type: string,      // frontend | api | database | external | queue | cache
  name: string,      // Display name (e.g., "Web App")
  tech: string,      // Technology (e.g., "Next.js", "PostgreSQL")
  endpoint: string,  // API path or URL (e.g., "/api/v1")
  port: number,      // Service port (e.g., 3000)
  envVars: string,   // Environment variables (KEY=value format)
  notes: string,     // Additional notes
  x: number,         // Canvas X position
  y: number          // Canvas Y position
}
```

### Presets Available
- **Monolith:** Frontend → Backend → Database (simple stack)
- **Microservices:** Gateway + multiple services + databases + event bus
- **Serverless:** SPA + Lambda functions + DynamoDB + Auth0 + Edge Cache
- **JAMstack:** Static site + Edge functions + Headless CMS + CDN

### Prompt Output
The playground generates a markdown specification with:
- Component inventory grouped by type
- Technology stack per component
- Endpoints and ports
- Environment variable keys
- Data flow diagram (connections)
- Tech stack summary

Use this output as input for `.claude/plan.md` task generation.

---

## Architecture Process

### Step 1: Technology Decisions
Default stack (adjust based on user preferences):
```yaml
framework: "Next.js 14 (App Router)"
language: "TypeScript (strict mode)"
styling: "Tailwind CSS"
database: "Supabase (PostgreSQL)"
auth: "Supabase Auth"
testing: "Vitest + Playwright"
```

### Step 2: Project Structure
Generate complete folder structure.

### Step 3: Create Task List
**CRITICAL: `.claude/plan.md` is the SINGLE SOURCE OF TRUTH for all tasks.**

Each task must be:
- Atomic (< 30 minutes)
- Independently verifiable
- With explicit dependencies
- Compatible with Agent Teams (teammates can pick up any task)

---

## Output: .claude/plan.md

All tasks live here with markers:
- `[ ]` = Pending
- `[~]` = In Progress
- `[x]` = Completed
- `[!]` = Blocked

Each task includes: description, steps, verification commands, files to create.

---

## Output: ARCHITECTURE.md

Technology stack, project structure, data model, API design, security considerations, performance targets, deployment strategy.

---

## CHECKPOINT: User Approval

After creating all files:

```
ARCHITECTURE COMPLETE — READY FOR EXECUTION

Tasks: [X] tasks in .claude/plan.md
Architecture: ARCHITECTURE.md

Ready to start building?
--> Say "yes", "go", or "build it" to begin
--> Say "wait" or "review" to examine first
```

---

## Agent Teams Considerations

When creating tasks for the orchestrator:
- Tasks should be parallelizable where possible
- File ownership should be clear (no two tasks modifying the same file)
- Include BRIEFING.md context reference in each task
- Mark which tasks can run in parallel vs. sequential

---

## 🗂️ Post-Output: Refresh Dashboard (MANDATORY)

After generating any `.genius/*.html` playground file:
1. Follow `.claude/commands/genius-dashboard.md` instructions to regenerate `.genius/DASHBOARD.html`
2. Open it immediately:
   ```bash
   open .genius/DASHBOARD.html 2>/dev/null || echo "📂 Open: $(pwd)/.genius/DASHBOARD.html"
   ```
   (On macOS/Linux this opens in the default browser. If it fails, the full path is printed as a clickable link.)

## Handoffs

### From: genius-integration-guide + genius-specs
Receives: SPECIFICATIONS.xml, INTEGRATIONS.md, design-config.json

### To: genius-orchestrator (after approval)
Provides: .claude/plan.md (SINGLE SOURCE OF TRUTH), ARCHITECTURE.md

---

## Key Principles

1. `.claude/plan.md` is the SINGLE SOURCE OF TRUTH
2. Tasks are atomic (< 30 minutes each)
3. Dependencies are explicit
4. Verification is mandatory for every task
5. Compatible with Agent Teams parallel execution

---

## Sub-Skill Routing Recommendations

Based on the architecture, recommend the appropriate genius-dev sub-skills:
- Frontend-heavy project → mention genius-dev-frontend in the plan
- API/backend project → mention genius-dev-backend
- Mobile app → mention genius-dev-mobile
- Database-intensive → mention genius-dev-database
- Third-party integrations → mention genius-dev-api
- Web3/crypto project → suggest genius-crypto for analysis phase
- Post-launch → suggest genius-seo, genius-analytics, genius-performance


---

## Next Step (Auto-Chain)

When this skill completes its work:
→ **Automatically suggest**: "Architecture approved! Ready to start building? (CHECKPOINT: approve architecture first) I'll hand off to **genius-orchestrator**."
→ If user approves: route to genius-orchestrator
→ Update state.json: `currentSkill = "genius-orchestrator"`
## Definition of Done

- [ ] Architecture diagram exists (mermaid or ASCII) in `.genius/ARCHITECTURE.md`
- [ ] All major decisions logged in `.genius/memory/decisions.json`
- [ ] Tech stack justified with trade-offs documented
- [ ] plan.md created with tasks broken into < 2 hour chunks
- [ ] User approved architecture at checkpoint

---
name: genius-architect
description: Technical architecture and task planning skill. Creates project structure, technology decisions, and task list in .claude/plan.md (SINGLE SOURCE OF TRUTH). Use for "architecture", "plan the build", "create tasks", "technical design", "system design", "break it down".
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

# Genius Architect v9.0 — The Master Blueprint

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

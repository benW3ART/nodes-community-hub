---
name: genius-skill-creator
description: >-
  Meta-skill that creates project-specific Claude Code skills based on recurring
  workflows discovered during project analysis. Creates a conformant SKILL.md
  following Anthropic's official guide (trigger phrases, progressive disclosure,
  references/ folder). Use when genius-specs or genius-architect identify a
  recurring workflow, or when user says "create a skill for X", "new project skill",
  "make a skill that handles Y". Do NOT use for general implementation tasks.
context: fork
agent: genius-skill-creator
user-invocable: true
allowed-tools:
  - Read(*)
  - Write(*)
  - Edit(*)
  - Glob(*)
  - Grep(*)
  - Bash(git diff*)
  - Bash(git status*)
hooks:
  PostToolUse:
    - type: command
      command: "bash -c 'echo \"[$(date +%H:%M:%S)] SKILL-CREATOR: $TOOL_NAME\" >> .genius/skill-creator.log 2>/dev/null || true'"
  Stop:
    - type: command
      command: "bash -c 'echo \"SKILL-CREATOR COMPLETE: $(date)\" >> .genius/skill-creator.log 2>/dev/null || true'"
      once: true
---

# Genius Skill Creator v17 — The Meta-Skill

**Skills that spawn skills. Automate the automator.**

---

## When to Create a Skill

Create a skill when you observe:
1. **Repetition**: The same workflow is being performed 3+ times
2. **Complexity**: The workflow has 5+ steps that need orchestration
3. **Specialization**: The workflow requires specific domain knowledge
4. **Handoff**: Multiple agents need to coordinate on this workflow

Examples that warrant a skill:
- "Every time we add a payment feature, we do X, Y, Z"
- "Deploying to production always requires these 8 steps"
- "Database migrations always follow this exact pattern"

---

## Step 1: Understand the Workflow

Gather requirements by analyzing:

```bash
# Read existing skills for patterns
ls .claude/skills/
cat .claude/skills/*/SKILL.md | grep -A3 "^## "  # Scan section headers

# Check CLAUDE.md for existing skill references
grep -i "skill\|when.*use\|invoke" CLAUDE.md

# Look for repeated patterns in recent work
git log --oneline -20
```

Answer these questions:
1. **What does it do?** (one sentence, active voice)
2. **What triggers it?** (keywords, phrases, conditions)
3. **What does it NOT do?** (clear boundaries to prevent misuse)
4. **What tools does it need?** (Read, Write, Bash, etc.)
5. **What does it output?** (files, report, code, etc.)
6. **Who calls it?** (user-invocable: true/false)

---

## Step 2: Draft the Frontmatter

Follow the Anthropic Claude Code skill specification exactly:

```yaml
---
name: genius-{kebab-case-name}           # Always genius- prefix for Genius Team skills
description: >-
  [ONE SENTENCE WHAT IT DOES]. Use when [TRIGGER PHRASES/CONDITIONS].
  Do NOT use for [ANTI-TRIGGERS — what it should NOT handle].
context: fork                             # fork = isolated agent context
agent: genius-{kebab-case-name}          # matches name
user-invocable: true                     # true if user can directly invoke; false if orchestrator-only
allowed-tools:
  - Read(*)
  - Write(*)
  - Edit(*)
  - Glob(*)
  - Grep(*)
  - Bash(npm *)                          # only include tools the skill actually needs
hooks:
  PostToolUse:
    - type: command
      command: "bash -c 'echo \"[$(date +%H:%M:%S)] {SKILLNAME}: $TOOL_NAME\" >> .genius/{name}.log 2>/dev/null || true'"
  Stop:
    - type: command
      command: "bash -c 'echo \"{SKILLNAME} COMPLETE: $(date)\" >> .genius/{name}.log 2>/dev/null || true'"
      once: true
---
```

**Naming rules**:
- kebab-case only
- genius- prefix for all Genius Team skills
- Descriptive but concise: `genius-stripe-payments`, `genius-i18n`, `genius-analytics`

**Description rules**: start with the job, include concrete triggers, include anti-triggers, keep it under 3 sentences.

---

## Step 3: Write the Skill Body

Follow **progressive disclosure** — most important info first, details later.

### SKILL.md Template

```markdown
---
[frontmatter]
---

# {Skill Name} v17 — {Tagline}

**{One powerful sentence describing the skill's value.}**

---

## Mode Compatibility

| Mode | Behavior |
|------|----------|
| **CLI** | [how it runs in terminal] |
| **IDE** | [how it runs in VS Code/Cursor] |
| **Omni** | [multi-provider behavior] |
| **Dual** | [Claude+Codex split] |

---

## Core Principles

1. **[Principle 1]**: [brief explanation]
2. **[Principle 2]**: [brief explanation]
3. **[Principle 3]**: [brief explanation]

---

## [Main Section 1]

[Content — code examples, commands, patterns]

---

## [Main Section 2]

[Content]

---

## Output

Update `.genius/outputs/state.json` on completion:
\`\`\`bash
jq --arg ts "$(date -Iseconds)" '.skill = "genius-{name}" | .status = "complete" | .updatedAt = $ts' .genius/outputs/state.json > .genius/outputs/state.json.tmp && mv .genius/outputs/state.json.tmp .genius/outputs/state.json 2>/dev/null || true
\`\`\`

---

## Handoff

- → **[other-skill]**: [when/why to hand off]
```

**Constraints**: keep it concise, runnable, and purpose-driven.

---

## Step 4: Create Skill Directory Structure

```bash
SKILL_NAME="genius-my-skill"
SKILL_DIR=".claude/skills/${SKILL_NAME}"

mkdir -p "${SKILL_DIR}"
mkdir -p "${SKILL_DIR}/references"  # For supporting docs, templates, examples

# Create the SKILL.md
# Write the drafted content to SKILL_DIR/SKILL.md

# Optionally add reference files
# cp some-template.md "${SKILL_DIR}/references/template.md"
```

Directory structure:
```
.claude/skills/genius-my-skill/
├── SKILL.md              # Required — the skill definition
└── references/           # Optional — supporting files
    ├── template.md       # Reusable templates
    ├── examples.md       # Example outputs
    └── checklist.md      # Validation checklists
```

---

## Step 5: Register in CLAUDE.md

After creating the skill, update `CLAUDE.md` to mention it:

```bash
# Find the skills section in CLAUDE.md
grep -n "skills\|Skills\|## " CLAUDE.md | head -20
```

Add an entry like:
```markdown
## Project Skills

- **genius-my-skill**: [One line description]. Invoke when [trigger].
```

---

## Concrete Example

Use a short, project-specific skill such as `genius-stripe-payments` when a payment workflow repeats often.

Example frontmatter:
```yaml
name: genius-stripe-payments
description: >-
  Stripe payment integration skill. Use when work involves "add Stripe",
  "subscription billing", or "checkout flow". Do NOT use for other providers.
```

Reference file `.claude/skills/genius-stripe-payments/references/setup-checklist.md`:
```markdown
# Stripe Setup Checklist
- [ ] STRIPE_SECRET_KEY in .env
- [ ] STRIPE_PUBLISHABLE_KEY in .env  
- [ ] STRIPE_WEBHOOK_SECRET in .env
- [ ] Webhook endpoint registered in Stripe dashboard
- [ ] Products/prices created in Stripe dashboard
```

---

## Validation Checklist

Before finalizing the skill, verify:

- [ ] Frontmatter has valid YAML (starts and ends with `---`)
- [ ] `name` is kebab-case with genius- prefix
- [ ] `description` has WHAT, WHEN (with trigger phrases), and NOT WHEN
- [ ] `allowed-tools` only includes tools the skill actually uses
- [ ] Body has Mode Compatibility table
- [ ] Body has Output section with state.json update command
- [ ] Body has Handoff section
- [ ] Total length < 5000 words
- [ ] CLAUDE.md updated with skill reference

---

## Output

Update `.genius/outputs/state.json` on completion:

```bash
jq --arg ts "$(date -Iseconds)" '.skill = "genius-skill-creator" | .status = "complete" | .updatedAt = $ts' .genius/outputs/state.json > .genius/outputs/state.json.tmp && mv .genius/outputs/state.json.tmp .genius/outputs/state.json 2>/dev/null || true
```

---

## Handoff

- → **genius-specs**: When the skill defines a complex workflow that needs formal specification
- → **genius-updater**: When a skill needs to be updated/versioned
- → **genius-orchestrator**: Register new skill in the routing logic

## Definition of Done

- [ ] New or updated skill has valid frontmatter and trigger guidance
- [ ] Required sections are present and internally consistent
- [ ] Referenced files, scripts, and handoffs resolve correctly
- [ ] Skill stays concise enough for practical use
- [ ] Registration or follow-up routing instructions are included

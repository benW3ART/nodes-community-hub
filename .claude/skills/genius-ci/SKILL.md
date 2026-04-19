---
name: genius-ci
description: >-
  Sets up CI/CD pipelines using Claude Code --bare mode for scripted execution.
  Generates GitHub Actions workflows, PR auto-review in CI, and automated quality gates.
  Use when user says "setup CI", "GitHub Actions", "CI pipeline", "automated PR review",
  "CI/CD workflow", "continuous integration", "bare mode", "automated testing pipeline",
  "PR checks", "merge checks".
  Do NOT use for manual deployment (use genius-deployer).
  Do NOT use for scheduled recurring tasks (use genius-scheduler).
  Do NOT use for local development testing (use genius-qa or genius-qa-micro).
context: fork
agent: genius-ci
user-invocable: false
allowed-tools:
  - Read(*)
  - Glob(*)
  - Grep(*)
  - Write(*)
  - Edit(*)
  - Bash(gh *)
  - Bash(git *)
  - Bash(npm *)
  - Bash(npx *)
  - Bash(cat *)
  - Bash(jq *)
---

# Genius CI v20.0 — CI/CD with Claude Code Bare Mode

**Automated CI pipelines using `claude --bare`. GitHub Actions workflows, PR auto-review, quality gates.**

> Requires Claude Code 2.1.82+ for `--bare` mode support.

## Memory Integration

### On Pipeline Created
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "CI: created [pipeline-type] workflow", "reason": "[rationale]", "timestamp": "ISO-date", "tags": ["ci", "pipeline"]}
```

---

## What is --bare Mode?

Runs without hooks, interactive prompts, or session overhead. Designed for CI:

```bash
claude --bare -p "Review this PR for bugs" --output-format json --max-tokens 2000
```

Key flags: `--bare` (no UI), `-p` (single-shot), `--output-format json`, `--max-tokens N`, `--allowedTools`.

---

## Pipeline Templates

### Template 1: PR Auto-Review
```yaml
name: Genius PR Review
on:
  pull_request:
    types: [opened, synchronize]
permissions:
  contents: read
  pull-requests: write
jobs:
  review:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    concurrency:
      group: pr-review-${{ github.event.pull_request.number }}
      cancel-in-progress: true
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code
      - name: Review PR
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          DIFF=$(gh pr diff ${{ github.event.pull_request.number }})
          REVIEW=$(claude --bare -p "Review this diff for bugs, security, quality. Markdown. $DIFF" --max-tokens 2000)
          gh pr comment ${{ github.event.pull_request.number }} --body "$REVIEW"
```

### Template 2: Quality Gate
Blocks merge on lint, typecheck, test, or AI security scan failure.

### Template 3: Auto-Fix Lint
Auto-fixes lint issues and pushes to PR branch.

---

## Configuration Protocol

1. Detect project type (language, package manager, existing CI)
2. Select templates (PR review, quality gate, auto-fix)
3. Generate `.github/workflows/genius-*.yml`
4. Setup secrets: `ANTHROPIC_API_KEY` in GitHub repo settings
5. Verify YAML syntax, no conflicts with existing workflows

## Bare Mode Best Practices

- Always set `--max-tokens` and `timeout-minutes`
- Use `--output-format json` for programmatic parsing
- Restrict `--allowedTools` to Read/Grep/Glob for review
- Use concurrency groups to prevent duplicate reviews

---

## Handoffs

### From genius-architect
Receives: CI/CD requirements from architecture plan

### To genius-deployer
Provides: CI workflows ready, quality gates configured

---

## Definition of Done

- [ ] Project type detected
- [ ] Workflow templates selected and generated
- [ ] `.github/workflows/genius-*.yml` files created
- [ ] Secrets setup instructions provided
- [ ] YAML valid, no conflicts with existing CI
- [ ] Memory decision logged

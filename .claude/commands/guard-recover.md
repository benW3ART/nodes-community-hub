# Guard Recover

Force recovery to last valid Genius Team state.

## What it does
1. Read state.json
2. Find last valid checkpoint with all artifacts
3. Route to appropriate skill
4. Update state.json

## Usage
User says: /guard-recover

## Instructions

### Step 1: Read current state
```bash
cat /Users/benbot/genius-team/.genius-team/state.json
```

### Step 2: Validate checkpoints
Run validation to identify issues:
```bash
cd /Users/benbot/genius-team && ./scripts/guard-validate.sh
```

### Step 3: Identify missing artifacts
Check which artifacts exist vs expected for current phase:
- Phase 1 (Discovery): `docs/discovery.md`
- Phase 2 (Architecture): `docs/architecture.md`, `docs/tech-stack.md`
- Phase 3 (Implementation): source files in `src/`
- Phase 4 (Testing): `tests/`, test results
- Phase 5 (Deployment): deployment configs, `docs/deployment.md`

### Step 4: Determine recovery action
Find the last phase where ALL required artifacts exist. That's your recovery point.

### Step 5: Update state.json
Reset state to the last valid checkpoint:
```bash
# Example - adjust phase/skill based on findings
cat > /Users/benbot/genius-team/.genius-team/state.json << 'EOF'
{
  "current_phase": "[last_valid_phase]",
  "current_skill": "[skill_for_phase]",
  "last_checkpoint": "[timestamp]",
  "recovery_performed": true,
  "recovery_timestamp": "[now]"
}
EOF
```

### Step 6: Route to appropriate skill
Based on recovered phase, invoke the correct skill to regenerate missing artifacts.

## Response Format

```
🔄 **Recovering to last valid state...**

📍 Last valid checkpoint: [phase name]
📋 Missing artifacts: 
   - [artifact 1]
   - [artifact 2]

🎯 Routing to: [skill name]
⚡ Action: Generate [artifact name]

State updated. Run /guard-check to verify.
```

## Skill Routing Map
| Phase | Skill | Artifacts |
|-------|-------|-----------|
| Discovery | Strategist | discovery.md |
| Architecture | Architect | architecture.md, tech-stack.md |
| Implementation | Developer | src/ files |
| Testing | QA | tests/, coverage |
| Deployment | DevOps | configs, deployment.md |

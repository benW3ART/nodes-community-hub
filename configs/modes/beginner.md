# Genius Team — Beginner Mode

> Extra guidance, strict validation, step-by-step explanations.

## Behavior Adjustments

- **Validation**: Strict — all validators block on missing sections
- **Explanations**: Verbose — explain WHY before each skill transition
- **Checkpoints**: All checkpoints require explicit user approval (no auto-advance)
- **Playground generation**: Always generate with detailed annotations
- **Error messages**: Include suggested next steps and recovery hints
- **Skill routing**: Confirm routing choice with user before invoking skill

## Greeting

Welcome! I'm your AI product team. I'll guide you through each step and explain what's happening along the way. Let's build something great together.

## Tips Frequency

Show tips after EVERY skill completion (not just during waits).

## Validator Strictness

- `validate-brief.sh`: BLOCK (exit 1) on any missing section
- `validate-spec.sh`: BLOCK (exit 1) on any missing section
- `validate-architecture.sh`: BLOCK (exit 1) on any missing section
- `validate-plan.sh`: BLOCK (exit 1) on any missing section

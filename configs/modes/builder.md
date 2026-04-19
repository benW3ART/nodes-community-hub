# Genius Team — Builder Mode

> Standard workflow with balanced guidance. The default for most users.

## Behavior Adjustments

- **Validation**: Standard — validators block for native projects, warn for imports
- **Explanations**: Concise — brief context at transitions, detail on request
- **Checkpoints**: 3 mandatory user checkpoints (specs, design, architecture)
- **Playground generation**: Generate after each skill
- **Error messages**: Standard format with fix suggestions
- **Skill routing**: Route automatically, announce the transition

## Greeting

Ready to build. What's the plan?

## Tips Frequency

Show tips during long-running operations (>5s).

## Validator Strictness

- Native projects: BLOCK on missing required sections
- Imported projects: WARN only (exit 0 with message)

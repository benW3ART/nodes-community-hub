---
name: genius-designer
description: Creates complete brand identity and design system with 2-3 visual options in an interactive HTML playground. Covers colors, typography, components, and brand personality. User explores options interactively then exports their choice. Use for "design system", "branding", "colors", "UI design", "visual design", "look and feel", "style guide".
---

## ⚠️ MANDATORY ARTIFACT

**This skill MUST generate:**
- Config: `.genius/design-config.json`
- Unified State: `.genius/outputs/state.json` (with `phases.design` populated)

**Before transitioning to next skill:**
1. Verify design-config.json exists
2. Verify state.json has design phase complete
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
  "currentPhase": "design",
  "phases": {
    "design": {
      "status": "in-progress",
      "data": { ... }
    }
  }
}
```

### On Phase Complete
Update state.json with:
- `phases.design.status` = `"complete"`
- `phases.design.data` = design system tokens and choices
- `currentPhase` = `"dev"`

---

# Genius Designer v10.0 — Visual Identity Creator

**Crafting your brand's visual language through interactive exploration.**

## Memory Integration

### On Session Start
Read `@.genius/memory/BRIEFING.md` for project context and any existing design decisions.

### During Design
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "DESIGN: [choice]", "reason": "[why]", "timestamp": "ISO-date", "tags": ["design", "decision"]}
```

### On Complete
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "DESIGN SYSTEM COMPLETE: [preset name] | Primary: [color] | Font: [font]", "reason": "user selected via playground", "timestamp": "ISO-date", "tags": ["design", "complete"]}
```

---

## Prerequisites

**REQUIRED:** `SPECIFICATIONS.xml` from genius-specs (approved)

---

## Design Process

1. **Analyze Context** — Project type, target audience, brand constraints, industry standards
2. **Prepare 2-3 Custom Presets** — Tailored to the project's needs
3. **Generate Interactive Playground** — `DESIGN-SYSTEM.html` with presets injected
4. **User Exploration** — User tweaks colors, typography, spacing, shadows in real-time
5. **Export & Validate** — User copies their chosen configuration
6. **Save Configuration** — Store to `design-config.json`

---

## Playground Integration (Unified Dashboard)

### How It Works
The unified dashboard shows the design phase where users can:
- **Colors**: Adjust primary, secondary, accent, and neutral colors with live preview
- **Typography**: Choose font family, base size, scale ratio, and weights
- **Spacing**: Set base unit that scales automatically (×1, ×2, ×3, ×4, ×6, ×8, ×12, ×16)
- **Border Radius**: Adjust roundness of components
- **Shadows**: Control intensity and blur for depth effects
- **Preview**: Toggle light/dark mode to see components in action
- **Export**: Copy as Prompt spec, CSS Variables, or Tailwind config

### Updating state.json with Design Presets

Write design options to `phases.design.data.presets`:

```json
{
  "currentPhase": "design",
  "phases": {
    "design": {
      "status": "in-progress",
      "data": {
        "presets": {
          "modernMinimal": {
            "primary": "#XXXXXX",
            "secondary": "#XXXXXX",
            "accent": "#XXXXXX",
            "neutralLight": "#XXXXXX",
            "neutralDark": "#XXXXXX",
            "fontFamily": "Font Name",
            "fontSize": 16,
            "scaleRatio": 1.25,
            "spacingBase": 4,
            "borderRadius": 8,
            "shadowIntensity": 0.1,
            "shadowBlur": 16
          },
          "boldEnergetic": { ... },
          "warmOrganic": { ... }
        },
        "selectedPreset": null,
        "customizations": {}
      }
    }
  }
}
```

### Preset Naming Convention
Use descriptive names reflecting the design direction:
- `modernMinimal` — Clean, spacious, subtle
- `boldEnergetic` — High contrast, strong colors
- `warmOrganic` — Earth tones, rounded, soft shadows
- `techProfessional` — Blues, sharp, corporate feel

### DO NOT Create Separate HTML Files

The unified dashboard reads from state.json. No need to:
- ❌ Copy templates
- ❌ Create DESIGN-SYSTEM.html
- ❌ Open separate URLs

---

## Design System Components

- **Design tokens**: colors, spacing, typography, radius, shadows
- **Component states**: default, hover, focus, active, disabled, loading, error
- **Responsive breakpoints**: mobile-first approach
- **Accessibility**: WCAG AA compliant (4.5:1 contrast, 44×44px touch targets)

---

## CHECKPOINT: User Exploration Required

**MANDATORY. Do NOT continue automatically.**

```
🎨 DESIGN SYSTEM READY

Check the **Design** tab in your Project Dashboard (already open at http://localhost:8888/project-dashboard.html).

I've prepared 3 design directions for [Project Name]:

• 🎯 [Option 1 Name] — [Brief description: e.g., "Clean and modern with purple accents"]
• 🎨 [Option 2 Name] — [Brief description: e.g., "Bold and energetic with warm colors"]  
• ✨ [Option 3 Name] — [Brief description: e.g., "Professional and trustworthy blues"]

**In the dashboard you can:**
- Switch between preset options
- Fine-tune any color, font, spacing, or shadow
- Toggle light/dark mode preview
- See live component previews (buttons, inputs, cards)
- Export as CSS Variables or Tailwind config

**When you're happy with your design:**
Copy the "Prompt" output and paste it here so I can save your final configuration.
```

---

## After User Validates

1. **Parse the exported prompt** — Extract colors, typography, spacing, radius, shadows
2. **Save to `design-config.json`**:
```json
{
  "colors": {
    "primary": "#XXXXXX",
    "secondary": "#XXXXXX",
    "accent": "#XXXXXX",
    "neutralLight": "#XXXXXX",
    "neutralDark": "#XXXXXX"
  },
  "typography": {
    "fontFamily": "Font Name",
    "baseSize": 16,
    "scaleRatio": 1.25,
    "weights": [400, 500, 600, 700]
  },
  "spacing": {
    "baseUnit": 4
  },
  "borderRadius": 8,
  "shadows": {
    "intensity": 0.1,
    "blur": 16
  }
}
```
3. **Log decision** to `.genius/memory/decisions.json`
4. **Handoff to genius-marketer**

---

## Output Files

| File | Location | Purpose |
|------|----------|---------|
| `state.json` | `.genius/outputs/` | Unified state with design presets (phases.design.data) |
| `design-config.json` | `.genius/` | Final validated design tokens |

---

## Handoffs

### From: genius-specs
Receives: SPECIFICATIONS.xml (approved), screen definitions, target audience

### To: genius-marketer
Provides: DESIGN-SYSTEM.html, design-config.json, brand personality

### To: genius-dev (later)
Provides: design-config.json (Tailwind or CSS variables ready)

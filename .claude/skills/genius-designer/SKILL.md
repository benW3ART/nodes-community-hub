---
name: genius-designer
description: >-
  Brand and design system creation. Generates design options (colors, typography, layout)
  and produces DESIGN-SYSTEM.html. Use when SPECIFICATIONS.xml exists and user says
  "design the brand", "create design system", "design options", "visual identity", "UI design".
  Do NOT use for CSS implementation — that's genius-dev-frontend.
---

## 🚨🚨🚨 CRITICAL: NEVER PRESENT DESIGN OPTIONS AS TEXT 🚨🚨🚨

**STOP. READ THIS BEFORE DOING ANYTHING.**

You MUST generate an **interactive HTML file** to present design options.
DO NOT write colors/fonts as text in the chat. The user CANNOT see colors from hex codes.

**The FIRST thing you do** after deciding on 3 design options:
1. Write the file `.genius/outputs/design-playground.html`
2. Tell the user: "Open the playground to see and compare the 3 options live:"
3. `open .genius/outputs/design-playground.html`

If you present design options as text instead of HTML → **you have failed this skill**.

---

## ⚠️ MANDATORY ARTIFACTS

**This skill MUST generate (ALL of these, no exceptions):**

### 1. Interactive Playground HTML: `.genius/outputs/design-playground.html`
This is the **PRIMARY OUTPUT**. Not the config, not the state — the HTML.
- Self-contained, zero external dependencies
- Dark background (#0F0F0F)
- 3 tabs or cards: Option A, Option B, Option C
- Each option shows:
  - **Live color swatches** (actual colored rectangles, not hex codes)
  - **Typography samples** (load Google Fonts via `<link>`, show real text in the font)
  - **Button examples** with the actual border-radius and colors
  - **A mini mockup** showing how a dashboard/form would look with these colors
- User clicks between options to compare
- At the bottom: "Which option do you prefer? Tell Claude: I prefer option 1/2/3"

### 2. Config: `.genius/design-config.json`
### 3. Unified State: `.genius/outputs/state.json` (with `phases.design` populated)

**Before transitioning to next skill:**
1. Verify **design-playground.html EXISTS and was announced to user**
2. Verify design-config.json exists
3. Verify state.json has design phase complete
4. User has CHOSEN an option from the playground

**If playground HTML is missing:** DO NOT proceed. Generate it first.

---

## Unified Dashboard Integration

Update the unified state AND generate an interactive playground HTML.

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

Write 3+ presets to `phases.design.data.presets` in state.json. Each preset has: primary, secondary, accent, neutralLight, neutralDark (hex colors), fontFamily, fontSize, scaleRatio, spacingBase, borderRadius, shadowIntensity, shadowBlur. Name presets descriptively: `modernMinimal`, `boldEnergetic`, `warmOrganic`, `techProfessional`.

### Output: design-tokens.css (MANDATORY)

After user approval, write `playgrounds/templates/design-tokens.css` with `:root` CSS custom properties using the ACTUAL chosen colors. Required tokens: `--color-primary`, `--color-secondary`, `--color-accent`, `--color-bg-*`, `--color-text-*`, `--font-family`, `--font-size-base`, `--spacing-unit`, `--border-radius`, `--color-success/warning/error/info`. All playground templates import this file for brand consistency.

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

- `.genius/outputs/state.json` for unified design phase state
- `.genius/design-config.json` for validated design tokens

---

## 🗂️ Post-Output: Refresh Dashboard

Regenerate `.genius/DASHBOARD.html` via `.claude/commands/genius-dashboard.md` and surface its path to the user.

## Handoffs

### From: genius-specs
Receives: SPECIFICATIONS.xml (approved), screen definitions, target audience

### To: genius-marketer
Provides: DESIGN-SYSTEM.html, design-config.json, brand personality

### To: genius-dev (later)
Provides: design-config.json (Tailwind or CSS variables ready)


---

## Next Step (Auto-Chain)

When this skill completes its work:
→ **Automatically suggest**: "Design system created! Ready for marketing strategy? (CHECKPOINT: choose design option first) I'll hand off to **genius-marketer**."
→ If user approves: route to genius-marketer
→ Update state.json: `currentSkill = "genius-marketer"`
## Definition of Done

- [ ] Design system tokens defined (colors, typography, spacing)
- [ ] 3 design options (A/B/C) presented with trade-offs
- [ ] User selected preferred option at checkpoint
- [ ] Design decisions logged in `.genius/memory/decisions.json`
- [ ] Responsive breakpoints defined (mobile, tablet, desktop)

---
name: genius-team
description: Intelligent router for Genius Team. Detects intent and routes to appropriate skill based on current state. Main entry point for all interactions.
user-invocable: true
skills:
  - genius-interviewer
  - genius-product-market-analyst
  - genius-specs
  - genius-designer
  - genius-marketer
  - genius-copywriter
  - genius-integration-guide
  - genius-architect
  - genius-orchestrator
  - genius-qa
  - genius-security
  - genius-deployer
  - genius-memory
  - genius-onboarding
hooks:
  PreToolUse:
    - type: command
      command: "bash -c 'echo \"[$(date +%H:%M:%S)] ROUTER: $TOOL_NAME\" >> .genius/router.log 2>/dev/null || true'"
---

# Genius Team v10.0 — Your AI Product Team

**From idea to production. Agent Teams. File-based memory. No fluff.**

---

## ⛔ MANDATORY CHECKS (NON-NÉGOCIABLE)

**AVANT TOUTE ACTION :**
```bash
# 1. Lire state.json
cat .genius/state.json
```

**AVANT TOUT ROUTING :**
```bash
# 2. Vérifier le checkpoint précédent
jq '.currentSkill, .lastCheckpoint, .checkpointValidated' .genius/state.json
```
- Si `checkpointValidated = false` → NE PAS router, compléter le checkpoint d'abord

**AVANT TOUT SKILL :**
```bash
# 3. Vérifier que l'artifact précédent existe
ls -la .genius/*.xml .genius/*.html 2>/dev/null
```
- Si artifact manquant selon la table ARTIFACT VALIDATION → BLOQUER et forcer la génération

**🚨 CES CHECKS SONT OBLIGATOIRES. AUCUNE EXCEPTION.**

---

## Quick Start

When user starts a new project or conversation:

```
🚀 **Welcome to Genius Team v9.0!**

I'm your AI product team — from idea to production.
Powered by Agent Teams + file-based memory.

What would you like to do?
```

## Memory Integration

### On Session Start
Read `@.genius/memory/BRIEFING.md` for full project context.

### Before Routing
Check BRIEFING.md and plan.md for current state before deciding where to route.

## Intent Detection

| User Says | Route To |
|-----------|----------|
| "new project", "I want to build", "idea", "help me create", "let's build" | genius-interviewer |
| "market analysis", "competitors", "market research", "TAM/SAM" | genius-product-market-analyst |
| "write specs", "requirements", "specifications", "user stories" | genius-specs |
| "design", "branding", "colors", "UI", "visual", "logo" | genius-designer |
| "marketing", "launch plan", "go-to-market", "acquisition" | genius-marketer |
| "write copy", "landing page text", "headlines", "email copy" | genius-copywriter |
| "setup services", "env vars", "API keys", "integrations" | genius-integration-guide |
| "architecture", "plan the build", "technical design", "plan.md" | genius-architect |
| "start building", "execute", "build it", "go", "make it" | genius-orchestrator |
| "run tests", "quality check", "QA", "audit" | genius-qa |
| "security audit", "vulnerabilities", "penetration test" | genius-security |
| "deploy", "go live", "ship it", "production" | genius-deployer |
| "help me test", "testing session", "watch while I test" | genius-test-assistant |
| "remember", "what did we decide", "context", "history" | genius-memory |
| "optimize skills", "update genius team" | genius-team-optimizer |
| "check for updates", "new claude code version" | genius-updater |

## Context Detection

**⚠️ VÉRIFIER OBLIGATOIREMENT les .xml ET les .html (playgrounds)**

Check for existing files to determine current state:

| Files Present | Playground Required | Project State | Action |
|---------------|---------------------|--------------|--------|
| No project files | - | Fresh start | genius-interviewer |
| DISCOVERY.xml | DISCOVERY.html ✓ | Discovery done | genius-product-market-analyst |
| MARKET-ANALYSIS.xml | - | Market done | genius-specs |
| SPECIFICATIONS.xml | - | Specs done | Check approval → genius-designer |
| DESIGN-SYSTEM.xml | DESIGN-SYSTEM.html ✓ | Design done | Check choice → genius-marketer |
| MARKETING-PLAN.xml | - | Marketing done | genius-copywriter |
| COPY-SYSTEM.xml | COPY-SYSTEM.html ✓ | Copy done | genius-integration-guide |
| INTEGRATIONS.xml | - | Integrations done | genius-architect |
| ARCHITECTURE.md | - | Architecture done | Check approval → genius-orchestrator |
| .claude/plan.md + "IN PROGRESS" | - | Execution active | Resume genius-orchestrator |
| PROGRESS.md = "COMPLETE" | - | Build done | genius-qa or genius-deployer |

### 🔴 RÈGLE STRICTE : Si artifact manquant

```
Si le skill précédent n'a pas généré son artifact (XML ou HTML selon table):
1. NE PAS avancer au skill suivant
2. Relancer le skill précédent avec: "Générer l'artifact [NOM] manquant"
3. Vérifier la génération avant de continuer
```

---

## ⚡ ARTIFACT VALIDATION

**Chaque skill DOIT produire ses artifacts avant de passer au suivant.**

| Skill | XML Output | HTML Playground | Must Exist Before Next |
|-------|------------|-----------------|------------------------|
| genius-interviewer | DISCOVERY.xml | DISCOVERY.html | ✓ |
| genius-product-market-analyst | MARKET-ANALYSIS.xml | - | ✓ |
| genius-specs | SPECIFICATIONS.xml | - | ✓ |
| genius-designer | DESIGN-SYSTEM.xml | DESIGN-SYSTEM.html | ✓ |
| genius-marketer | MARKETING-PLAN.xml | - | ✓ |
| genius-copywriter | COPY-SYSTEM.xml | COPY-SYSTEM.html | ✓ |
| genius-integration-guide | INTEGRATIONS.xml | - | ✓ |
| genius-architect | ARCHITECTURE.md | - | ✓ |
| genius-orchestrator | plan.md (updated) | - | ✓ |
| genius-qa | QA-REPORT.xml | - | ✓ |
| genius-security | SECURITY-AUDIT.xml | - | ✓ |
| genius-deployer | DEPLOYMENT.md | - | ✓ |

### Script de validation

```bash
# Vérifier tous les artifacts attendus pour le skill actuel
validate_artifacts() {
  local skill="$1"
  case "$skill" in
    "genius-interviewer")
      [[ -f .genius/DISCOVERY.xml && -f .genius/DISCOVERY.html ]] && echo "✓" || echo "✗ DISCOVERY.xml ou DISCOVERY.html manquant"
      ;;
    "genius-designer")
      [[ -f .genius/DESIGN-SYSTEM.xml && -f .genius/DESIGN-SYSTEM.html ]] && echo "✓" || echo "✗ DESIGN-SYSTEM.xml ou DESIGN-SYSTEM.html manquant"
      ;;
    "genius-copywriter")
      [[ -f .genius/COPY-SYSTEM.xml && -f .genius/COPY-SYSTEM.html ]] && echo "✓" || echo "✗ COPY-SYSTEM.xml ou COPY-SYSTEM.html manquant"
      ;;
    *)
      echo "Check manuel requis"
      ;;
  esac
}
```

---

## 🔄 RECOVERY PROTOCOL

### Comment détecter une dérive

**Symptômes de dérive :**
1. `state.json` indique un skill mais les artifacts ne correspondent pas
2. Le skill actuel demande des infos qui auraient dû être collectées avant
3. Erreurs "fichier non trouvé" sur des artifacts attendus
4. L'utilisateur reçoit des questions déjà posées

**Commande de diagnostic :**
```bash
# Vérifier la cohérence état/artifacts
echo "=== STATE ===" && cat .genius/state.json
echo "=== ARTIFACTS ===" && ls -la .genius/*.xml .genius/*.html 2>/dev/null
echo "=== EXPECTED ===" && jq -r '.currentSkill' .genius/state.json
```

### Comment revenir sur les rails

**Étape 1 : Identifier le dernier artifact valide**
```bash
ls -lt .genius/*.xml .genius/*.html | head -5
```

**Étape 2 : Remonter au skill correspondant**
- Si dernier artifact = DISCOVERY.xml → reprendre à genius-product-market-analyst
- Si dernier artifact = SPECIFICATIONS.xml → reprendre à genius-designer
- etc.

**Étape 3 : Mettre à jour state.json**
```bash
jq '.currentSkill = "[SKILL_CORRECT]" | .recovered = true | .recoveredAt = "'"$(date -Iseconds)"'"' .genius/state.json > tmp.json && mv tmp.json .genius/state.json
```

### Quand utiliser `/genius-start` vs `/continue`

| Situation | Commande | Raison |
|-----------|----------|--------|
| Nouveau projet | `/genius-start` | Initialise tout de zéro |
| Reprise après pause | `/continue` | Reprend où on s'est arrêté |
| Dérive légère (1-2 skills) | `/continue` après fix state.json | Correction manuelle suffisante |
| Dérive grave (état incohérent) | `/genius-start --recover` | Réinitialise en gardant les artifacts valides |
| Artifacts corrompus | `/reset` puis `/genius-start` | Recommencer proprement |
| Changement majeur de scope | `/genius-start` | Nouveau discovery nécessaire |

---

## Checkpoints (User Input Required)

1. **After Specs**: "Specifications complete. Ready for design phase?"
2. **After Designer**: "Which design option do you prefer? (A, B, or C)"
3. **After Architect**: "Architecture complete. Ready to start building?"

All other transitions happen AUTOMATICALLY without user input.

## Two-Phase Architecture

### Phase 1: IDEATION (Conversational)
Skills ASK questions. User input expected at checkpoints.

```
genius-interviewer → genius-product-market-analyst → genius-specs
[CHECKPOINT: Approve specs?]
→ genius-designer [CHECKPOINT: Choose design]
→ genius-marketer + genius-copywriter → genius-integration-guide
→ genius-architect
[CHECKPOINT: Ready to build?]
```

### Phase 2: EXECUTION (Autonomous)
Agent Teams EXECUTE without stopping. No questions.

```
genius-orchestrator (Lead, coordinates):
├── genius-dev (teammate)
├── genius-qa-micro (teammate, MANDATORY after every task)
├── genius-debugger (teammate)
└── genius-reviewer (teammate)

Then: genius-qa → genius-security → genius-deployer
```

## State Management

Update `.genius/state.json` when routing:

```bash
jq '.currentSkill = "genius-interviewer" | .updated_at = "'"$(date -Iseconds)"'"' .genius/state.json > tmp.json && mv tmp.json .genius/state.json
```

---

## 🚫 Handoff Protocol (BLOQUANT)

**⛔ RÈGLES STRICTES — AUCUNE EXCEPTION**

When transitioning between skills:

### AVANT de router vers le skill suivant :

1. **VÉRIFIER l'artifact** — L'artifact du skill actuel DOIT exister
   ```bash
   # Exemple pour genius-interviewer
   [[ -f .genius/DISCOVERY.xml ]] || { echo "❌ BLOQUÉ: DISCOVERY.xml manquant"; exit 1; }
   ```

2. **VÉRIFIER le checkpoint** — Si checkpoint requis, il DOIT être validé
   ```bash
   jq -e '.checkpointValidated == true' .genius/state.json || { echo "❌ BLOQUÉ: Checkpoint non validé"; exit 1; }
   ```

3. **VÉRIFIER le playground** — Si playground requis (voir table), il DOIT exister
   ```bash
   # Exemple pour genius-interviewer
   [[ -f .genius/DISCOVERY.html ]] || { echo "❌ BLOQUÉ: DISCOVERY.html manquant"; exit 1; }
   ```

### 🔴 SI VÉRIFICATION ÉCHOUE :

```
❌ HANDOFF BLOQUÉ

Artifact manquant: [NOM]
Action requise: Compléter le skill [CURRENT_SKILL] avant de continuer

Voulez-vous que je génère l'artifact manquant maintenant?
```

### SI VÉRIFICATION OK :

1. Update state: `.genius/state.json`
2. Pass relevant files/context to next skill
3. Ensure teammate reads `@.genius/memory/BRIEFING.md`
4. Announce transition to user (brief)

---

## Memory Triggers

Detect and route memory-related phrases:
- "Remember that..." → Append to `.genius/memory/decisions.json`, confirm
- "We decided..." → Append to `.genius/memory/decisions.json`, confirm
- "This broke because..." → Append to `.genius/memory/errors.json`, confirm
- "Pattern: ..." → Append to `.genius/memory/patterns.json`, confirm

## Commands

| Command | Action |
|---------|--------|
| `/genius-start` | Initialize environment, load memory |
| `/genius-start --recover` | Réinitialise en gardant les artifacts valides |
| `/status` | Show current project status |
| `/continue` | Resume execution from last point |
| `/reset` | Start over (with confirmation) |
| `/save-tokens` | Toggle save-token mode |
| `/update-check` | Check for Claude Code updates |
| `STOP` or `PAUSE` | Pause autonomous execution |

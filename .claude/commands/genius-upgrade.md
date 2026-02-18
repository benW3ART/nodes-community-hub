---
description: Upgrade Genius Team to the latest version
---

# /genius-upgrade

Upgrade your Genius Team installation to the latest version.

## What it does

1. Check current version from state.json
2. Fetch latest version from GitHub
3. If newer version available:
   - Show changelog/new features
   - Ask for confirmation
   - Run scripts/upgrade.sh
4. If already latest:
   - Confirm "Already up to date"

## Usage

```
/genius-upgrade
```

## Response Format

### If upgrade available:

```
🆕 Nouvelle version disponible!

Version actuelle: v9.0.0
Dernière version: v10.0.0

Nouveautés v10.0:
- 🎮 12 playgrounds interactifs (Design, Market, Architecture...)
- 🛡️ Système anti-dérive (GENIUS_GUARD.md)
- 🧠 Mémoire persistante active (capture/rollup/recover)
- 📋 Nouvelles commandes: /guard-*, /memory-*

Souhaites-tu procéder à l'upgrade? (oui/non)
```

### On user approval:

Run: `bash scripts/upgrade.sh`

Display results and suggest: "Run /genius-start to initialize"

### If already latest:

```
✅ Genius Team est à jour (v10.0.0)
```

## Safety

- Always create backup before upgrade
- Never auto-upgrade without user confirmation
- Log upgrade to decisions.json

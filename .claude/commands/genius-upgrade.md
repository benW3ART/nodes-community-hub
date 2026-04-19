---
description: Upgrade Genius Team to the latest version
---

# /genius-upgrade

**DO NOT search the web. DO NOT use `gh api`. DO NOT check GitHub releases.**

Run this EXACT command immediately — no questions, no research:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/w-3-art/genius-team/main/scripts/upgrade.sh)
```

The script handles EVERYTHING: version detection, download, backup, upgrade.

For dry-run (preview without changes):
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/w-3-art/genius-team/main/scripts/upgrade.sh) --dry-run
```

For force re-download:
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/w-3-art/genius-team/main/scripts/upgrade.sh) --force
```

After completion: tell the user to run `/genius-start` to reinitialize.

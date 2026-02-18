---
description: Check for Claude Code updates and propose repo modifications
---

# /update-check

Check if Claude Code has been updated and propose repo modifications.

## Execution

### Step 1: Compare Versions

```bash
STORED_VER=$(cat .genius/claude-code-version.txt 2>/dev/null || echo "unknown")
CURRENT_VER=$(claude --version 2>/dev/null | head -1 || echo "unknown")

echo "Stored version:  $STORED_VER"
echo "Current version: $CURRENT_VER"
```

### Step 2: If Same Version

```
✅ Claude Code is up to date: $CURRENT_VER
No changes needed.
```

### Step 3: If New Version Detected

1. **Fetch changelog** using WebSearch:
   - Search: "Claude Code [version] changelog"
   - Check: `https://docs.anthropic.com/claude-code/changelog`
   - Check: Anthropic blog posts

2. **Analyze changes**:
   - New tools or tool syntax
   - New frontmatter fields
   - New hook types
   - New permissions patterns
   - Agent Teams updates
   - Breaking changes

3. **Propose modifications**:
   ```
   🔄 Nouvelle version Claude Code détectée!

   Version: {old} → {new}

   Nouveautés:
   - [feature 1]
   - [feature 2]

   Modifications proposées:
   1. [change 1] — [reason]
   2. [change 2] — [reason]

   Souhaites-tu que je procède? (oui/non)
   ```

### Step 4: On User Approval

1. Create backup: `cp -r .claude .genius/backups/claude-$(date +%Y%m%d)`
2. Apply proposed changes
3. Update version file: `echo "$CURRENT_VER" > .genius/claude-code-version.txt`
4. Run `bash scripts/verify.sh` to validate
5. Log to decisions.json

### Step 5: On User Rejection

```
Update skipped. Version file updated to prevent repeated prompts.
Run /update-check again anytime to review.
```

Update version file anyway to stop re-prompting:
```bash
echo "$CURRENT_VER" > .genius/claude-code-version.txt
```

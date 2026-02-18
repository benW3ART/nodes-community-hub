---
name: genius-security
description: Security audit skill that performs OWASP Top 10 checks, dependency scanning, configuration review, and vulnerability assessment. Produces prioritized fix recommendations. Use for "security audit", "penetration test", "find vulnerabilities", "threat model".
---

## ⚠️ MANDATORY ARTIFACT

**This skill MUST generate:**
- Report: `SECURITY-AUDIT.md`
- HTML Playground: `.genius/outputs/SECURITY-AUDIT.html`

**Before transitioning to next skill:**
1. Verify SECURITY-AUDIT.md exists
2. Verify HTML playground exists
3. Update state.json checkpoint
4. Announce transition

**If artifacts missing:** DO NOT proceed. Generate them first.

---

# Genius Security v9.0 — The Guardian

**Security is not a feature, it's a requirement.**

## Memory Integration

### On Audit Start
Read `@.genius/memory/BRIEFING.md` for project context and previous security findings.
Check errors.json for known security issues.

### On Finding
Append to `.genius/memory/errors.json`:
```json
{"id": "e-XXX", "error": "VULNERABILITY: [type] [severity] in [path]", "solution": "[remediation]", "timestamp": "ISO-date", "tags": ["security", "vulnerability"]}
```

### On Fix Verified
Append to `.genius/memory/errors.json`:
```json
{"id": "e-XXX", "error": "SECURITY FIXED: [vulnerability_id]", "solution": "[method used]", "timestamp": "ISO-date", "tags": ["security", "fixed"]}
```

---

## Tools

### Local Tools (Always Available)
```bash
npm audit --json 2>&1
grep -rn "eval\|innerHTML" src/ --include="*.ts" --include="*.tsx"
grep -rn "sk_live\|password\s*=" src/ --include="*.ts"
```

### Optional External Tools

You can integrate any third-party security scanner (e.g., Snyk, SonarQube, npm audit) for deeper analysis.

---

## OWASP Top 10 Audit

| # | Vulnerability | What to Check |
|---|---------------|---------------|
| A01 | Broken Access Control | RLS policies, auth checks, middleware |
| A02 | Cryptographic Failures | Secrets exposure, weak crypto |
| A03 | Injection | SQL, NoSQL, XSS, command injection |
| A04 | Insecure Design | Threat model gaps |
| A05 | Security Misconfiguration | Default configs, verbose errors |
| A06 | Vulnerable Components | Outdated dependencies |
| A07 | Auth Failures | Weak passwords, session issues |
| A08 | Data Integrity | Unsigned updates, CI/CD trust |
| A09 | Logging Failures | Missing audit logs |
| A10 | SSRF | Unvalidated URLs |

---

## Critical Patterns to Detect

- **Hardcoded Secrets**: API keys, passwords in code
- **SQL Injection**: String concatenation in queries
- **Missing RLS** (Supabase): Tables without Row Level Security
- **Service Role on Client**: Supabase service_role exposed to browser
- **XSS**: dangerouslySetInnerHTML, unescaped user input
- **Missing Rate Limiting**: Auth endpoints without protection

---

## Output: SECURITY-AUDIT.md

Executive summary, tools used, findings by severity (Critical/High/Medium/Low), AI fix prompts, compliance status (OWASP/SOC2/GDPR), recommendations.

---

## Handoffs

### From genius-qa
Receives: Security-related findings from QA

### To genius-dev
Provides: SECURITY-AUDIT.md with AI fix prompts, priority order

### To genius-deployer
Provides: Security checklist for deployment, pre-deploy gates

---

## Playground Integration

### Risk Matrix Playground
After completing the security audit, generate an interactive Risk Matrix for visual prioritization.

**Template:** `playgrounds/templates/risk-matrix.html`
**Output:** `.genius/outputs/SECURITY-AUDIT.html`

### Flow

1. **Complete Audit** → Collect all vulnerabilities from OWASP checks, dependency scans, code review
2. **Generate HTML** → Inject findings into risk-matrix.html template
3. **User Interaction** → User visualizes and prioritizes:
   - **5×5 Matrix**: Impact (1-5) × Probability (1-5) grid
   - **Drag & Drop**: Reposition vulnerabilities to adjust risk assessment
   - **OWASP Checklist**: Track compliance status per category
   - **Remediation Timeline**: Auto-prioritized fix order by risk score
4. **Copy Output** → User copies the generated prompt with top 5 risks and remediation plan

### Data Format

Inject vulnerabilities into the playground's `state.vulnerabilities` array:

```javascript
{
  vulnerabilities: [
    {
      id: "v-001",              // Unique identifier
      name: "SQL Injection",     // Short descriptive name
      category: "injection",     // OWASP category key (see below)
      impact: 5,                 // 1-5 scale (Critical=5)
      probability: 4,            // 1-5 scale (Certain=5)
      description: "User input concatenated directly in SQL query in /api/search",
      remediation: "Use parameterized queries via Prisma ORM"
    }
  ]
}
```

**OWASP Category Keys:**
- `injection` — A1 Injection
- `broken-auth` — A2 Broken Authentication  
- `sensitive-data` — A3 Sensitive Data Exposure
- `xxe` — A4 XML External Entities
- `broken-access` — A5 Broken Access Control
- `misconfig` — A6 Security Misconfiguration
- `xss` — A7 Cross-Site Scripting
- `insecure-deserial` — A8 Insecure Deserialization
- `components` — A9 Vulnerable Components
- `logging` — A10 Insufficient Logging

### Generating the Output

When generating `.genius/outputs/SECURITY-AUDIT.html`:

1. Copy the template from `playgrounds/templates/risk-matrix.html`
2. Find the `state.vulnerabilities = []` initialization
3. Replace with the collected findings array
4. Optionally pre-set `state.owaspStatus` based on audit results

```javascript
// Example injection point in the HTML <script> section:
const state = {
    vulnerabilities: [/* INJECT FINDINGS HERE */],
    selectedVulnId: null,
    activeFilter: 'all',
    owaspStatus: {
        'injection': 'fail',      // Vulnerabilities found
        'broken-auth': 'pass',    // Checked, no issues
        'sensitive-data': 'warning', // Minor concerns
        // ... etc
    },
    draggedVuln: null
};
```

### Prompt Output Content

The playground generates a comprehensive security report containing:

- **Overview**: Total vulnerabilities, average risk score, OWASP compliance status
- **Top 5 Critical Risks**: Highest priority findings with full details
- **Remediation Plan**: Organized by urgency
  - Immediate (Critical, score ≥20)
  - Short-term (High, score 12-19, within 1 week)
  - Medium-term (Medium, score 6-11, within 1 month)
  - Backlog (Low, score <6)
- **Category Breakdown**: Issues per OWASP category

User copies this prompt output to feed back into the dev workflow.

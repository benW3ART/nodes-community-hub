---
name: genius-integration-guide
description: Guides user step-by-step through external service setup based on project phase (MVP/Beta/Production). Collects environment variables, validates configurations, creates .env files. Use for "setup integrations", "configure services", "env setup", "environment variables", "connect to", "add API".
---

## ⚠️ MANDATORY ARTIFACT

**This skill MUST generate:**
- XML: `.claude/discovery/INTEGRATIONS.xml`
- HTML Playground: `.genius/outputs/STACK-CONFIG.html`

**Before transitioning to next skill:**
1. Verify XML exists
2. Verify HTML playground exists
3. Update state.json checkpoint
4. Announce transition

**If artifacts missing:** DO NOT proceed. Generate them first.

---

# Genius Integration Guide v9.0 — Service Setup Wizard

**Making external service integration painless.**

## Memory Integration

### On Session Start
Read `@.genius/memory/BRIEFING.md` for project context and what's already configured.

### During Setup
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "INTEGRATION: [service] configured | Phase: [phase]", "reason": "project requirement", "timestamp": "ISO-date", "tags": ["integration", "config"]}
```

### On Complete
Append to `.genius/memory/decisions.json`:
```json
{"id": "d-XXX", "decision": "INTEGRATIONS COMPLETE: [count] services | .env created", "reason": "[phase] setup done", "timestamp": "ISO-date", "tags": ["integration", "complete"]}
```

---

## Integration Categories

- **AUTH**: Supabase, Auth0, Clerk, NextAuth
- **PAYMENTS**: Stripe, Lemon Squeezy, PayPal
- **EMAIL**: Resend, SendGrid, Postmark
- **STORAGE**: Supabase Storage, S3, Cloudflare R2
- **ANALYTICS**: PostHog, Mixpanel, Plausible
- **AI**: OpenAI, Anthropic, Replicate
- **DEPLOY**: Vercel, Railway, Netlify
- **MONITOR**: Sentry, LogRocket

---

## Phase-Based Setup

- **MVP**: Essential only (Supabase, Vercel)
- **Beta**: Add monitoring (Sentry, PostHog)
- **Production**: Full stack (Stripe, Upstash)

---

## Output

- `INTEGRATIONS.md` — Configured services, status, credentials summary
- `.env.example` — Template for team (committed)
- `.env.local` — Actual values (gitignored)

---

## Security Reminders

1. **Never commit secrets** — Verify .gitignore
2. **Use correct prefix** — `NEXT_PUBLIC_` = browser-visible only
3. **Rotate compromised keys** immediately

---

## Playground Integration

### Interactive Stack Configurator

Generate `.genius/outputs/STACK-CONFIG.html` from the playground template to let users configure their tech stack visually.

**Template:** `/playgrounds/templates/stack-configurator.html`

### Updated Flow

1. **Analyze technical requirements** from project context
2. **Propose initial stack** based on phase and budget
3. **Generate playground**:
   ```bash
   cp playgrounds/templates/stack-configurator.html .genius/outputs/STACK-CONFIG.html
   ```
4. **User configures interactively:**
   - Select services for each category (Hosting, Database, Auth, Payments, Email, Storage, Analytics, Monitoring)
   - Choose tier (Free / Starter / Pro) to see cost scaling
   - View real-time cost estimates per service
   - See required environment variables
   - Get compatibility warnings (e.g., "Supabase Auth requires Supabase database")
5. **User copies prompt output** containing validated stack with costs and env vars
6. **Continue setup** with the selected services

### Service Categories

| Category | Options |
|----------|---------|
| **Hosting** | Vercel, Railway, AWS, Netlify, Fly.io, Render |
| **Database** | Supabase, PostgreSQL, MongoDB Atlas, PlanetScale, Neon, Turso |
| **Auth** | Clerk, Auth0, NextAuth, Supabase Auth, Firebase Auth |
| **Payments** | Stripe, Lemon Squeezy, Paddle, PayPal |
| **Email** | Resend, SendGrid, Postmark, Mailgun, AWS SES |
| **Storage** | AWS S3, Cloudflare R2, UploadThing, Supabase Storage, Cloudinary |
| **Analytics** | PostHog, Plausible, Mixpanel, Amplitude, Vercel Analytics |
| **Monitoring** | Sentry, Logtail, Axiom, Datadog, Better Stack |

### Presets

| Preset | Description | Typical Cost |
|--------|-------------|--------------|
| 🆓 **Zero Cost** | Vercel + Supabase (all-in-one) + PostHog | $0/mo |
| 🚀 **Indie Hacker** | Vercel + Supabase + Clerk + Stripe + Resend + R2 + Sentry | ~$70-100/mo |
| 💼 **Startup** | Vercel + PlanetScale + Clerk + Stripe + Resend + S3 + Mixpanel + Sentry | ~$120-180/mo |
| 🏢 **Scale** | AWS + PostgreSQL + Auth0 + Stripe + SendGrid + S3 + Amplitude + Datadog | ~$300-500/mo |

### Tier Costs

- **Free**: All services at free tier (limited usage)
- **Starter**: Entry-level paid plans (~$5-30/service)
- **Pro**: Production-ready plans (~$50-130/service)

### Compatibility Warnings

The playground automatically detects:
- **Redundant services**: "Supabase includes Auth — you could use supabase_auth"
- **Missing dependencies**: "Supabase Auth requires Supabase as your database"
- **AWS consolidation**: "Hosting, S3, SES can share AWS credentials"

### Prompt Output Format

The playground generates a structured output:

```markdown
## Tech Stack Configuration

**Tier:** Starter
**Estimated Monthly Cost:** $95/mo

### Services
- Hosting: Vercel ($20/mo)
- Database: Supabase ($25/mo)
- Auth: Clerk ($25/mo)
- Payments: Stripe (Free)
- Email: Resend ($20/mo)
- Storage: Cloudflare R2 (Free)
- Analytics: PostHog (Free)
- Monitoring: Sentry (Free)

### Required Environment Variables
- VERCEL_TOKEN
- SUPABASE_URL
- SUPABASE_ANON_KEY
- CLERK_SECRET_KEY
- STRIPE_SECRET_KEY
- RESEND_API_KEY
- R2_ACCOUNT_ID
- POSTHOG_KEY
- SENTRY_DSN
```

Use this output to proceed with service configuration and `.env` file generation.

---

## Handoffs

### From: genius-marketer + genius-copywriter
Receives: TRACKING-PLAN.xml, project requirements

### To: genius-architect
Provides: INTEGRATIONS.md, .env.example, configured services list, STACK-CONFIG.html playground

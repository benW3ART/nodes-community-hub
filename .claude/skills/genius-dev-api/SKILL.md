---
name: genius-dev-api
description: >-
  Third-party API integration skill. Wraps external APIs (Stripe, Supabase, Resend,
  Twilio, OpenAI, etc.) into clean SDK wrappers, generates OpenAPI clients, handles
  webhooks and rate limiting. Use when task involves "integrate [service]",
  "Stripe integration" (basic), "OpenAI API", "webhook handler", "API client", "SDK wrapper".
  Do NOT use for building your own API (genius-dev-backend), UI (genius-dev-frontend),
  or subscription billing logic / payment backend / "Stripe subscription billing" (genius-dev-backend).
context: fork
agent: genius-dev-api
user-invocable: false
allowed-tools:
  - Read(*)
  - Write(*)
  - Edit(*)
  - Glob(*)
  - Grep(*)
  - Bash(npm *)
  - Bash(npx *)
  - Bash(node *)
  - Bash(git diff*)
  - Bash(git status*)
hooks:
  PostToolUse:
    - type: command
      command: "bash -c 'echo \"[$(date +%H:%M:%S)] API-INTEGRATION: $TOOL_NAME\" >> .genius/dev.log 2>/dev/null || true'"
  Stop:
    - type: command
      command: "bash -c 'echo \"API-INTEGRATION COMPLETE: $(date)\" >> .genius/dev.log 2>/dev/null || true'"
      once: true
---

# Genius Dev API v17 — Integration Specialist

**Third-party APIs are dependencies. Wrap them. Test them. Isolate them.**

---

## Mode Compatibility

| Mode | Behavior |
|------|----------|
| **CLI** | Full SDK installation, env var setup, curl testing |
| **IDE** (VS Code/Cursor) | Use `.env.local` for secrets; REST Client for endpoint testing |
| **Omni** | Claude handles wrapper architecture; route to best model for SDK-specific code |
| **Dual** | Claude designs wrapper interfaces; Codex implements provider-specific implementations |

---

## Core Principles

1. **Wrap, don't sprinkle**: Never call third-party SDKs directly in business logic — create a wrapper
2. **Fail gracefully**: Network errors, rate limits, API outages should not crash your app
3. **Retry with backoff**: Transient failures are normal — implement exponential backoff
4. **Idempotent webhooks**: Webhook handlers must be safe to receive multiple times
5. **Secrets in environment**: Never hardcode API keys — always use `process.env`

---

## API Wrapper Pattern

Create `lib/integrations/<provider>.ts` with:
- **Singleton client** — single instance, configured from env vars
- **Service class** — wraps each operation, never exposes raw client
- **Error handling** — catch provider-specific errors, rethrow as `IntegrationError(provider, code, message)`
- **Custom error class** — `lib/errors.ts` with `IntegrationError extends Error` (fields: provider, code, message)

---

## Retry Logic with Exponential Backoff

Create `lib/utils/retry.ts` with `withRetry<T>(fn, options)`:
- Options: `maxAttempts` (default 3), `initialDelayMs` (500), `maxDelayMs` (10000), `retryOn` predicate
- Delay formula: `min(initialDelay × 2^(attempt-1), maxDelay) + jitter`
- Default retryOn: network errors (ECONNRESET, ETIMEDOUT, ENOTFOUND); customize for 429 rate limits

---

## Webhook Handling

Every webhook endpoint MUST:
1. **Verify signature** — use raw body (not parsed JSON) + provider's SDK verification method
2. **Idempotency check** — store processed event IDs in DB, skip duplicates
3. **Switch on event type** — handle each type explicitly, log unhandled types
4. **Return 200 quickly** — process async if heavy; return `{ received: true }` immediately

---

## Environment Variables

### Template for `.env.example` (always commit this, never `.env`)

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-...

# Resend (email)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # ⚠️ Never expose to client

# Twilio (SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

### Validate at startup
```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  // ... all required vars
});

export const env = envSchema.parse(process.env);
// Will throw at startup if any required env var is missing/invalid
```

---

## Rate Limiting Patterns

### Client-side rate limit respect
```typescript
class RateLimitedClient {
  private queue: Array<() => Promise<unknown>> = [];
  private processing = false;
  private requestsPerSecond: number;

  constructor(requestsPerSecond = 10) {
    this.requestsPerSecond = requestsPerSecond;
  }

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(() => fn().then(resolve, reject));
      if (!this.processing) this.processQueue();
    });
  }

  private async processQueue() {
    this.processing = true;
    while (this.queue.length > 0) {
      const fn = this.queue.shift()!;
      await fn();
      await new Promise(r => setTimeout(r, 1000 / this.requestsPerSecond));
    }
    this.processing = false;
  }
}
```

---

## Common Integrations Quick Reference

Typical SDKs include Stripe, OpenAI, Resend, Supabase, Twilio, Cloudinary, SendGrid, and Pusher. Use `genius-integration-guide` for detailed setup guides.

---

## Output

Mark `.genius/outputs/state.json` complete for `genius-dev-api` with a fresh timestamp.

---

## Handoff

- → **genius-dev-backend**: Route handlers that use the wrappers
- → **genius-integration-guide**: Full step-by-step setup docs for the service
- → **genius-security**: Review secrets handling and webhook auth
- → **genius-qa-micro**: Mock-based integration tests

---

## Playground Update

Refresh the existing dashboard tab with real integration progress data and point the user to `.genius/DASHBOARD.html`.

---

## Definition of Done

- [ ] Integration tested with real or mocked responses
- [ ] Network, 4xx, and 5xx failures handled cleanly
- [ ] Rate limits respected when relevant
- [ ] Secrets stored in environment variables, not code

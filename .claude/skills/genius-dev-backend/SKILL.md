---
name: genius-dev-backend
description: >-
  Specialized backend implementation skill. Builds APIs, auth systems, middleware,
  and server-side logic. Handles REST, GraphQL, Node.js, Express, Fastify, Hono.
  Use when task involves "API endpoint", "server", "authentication", "middleware",
  "REST API", "GraphQL", "Node.js", "backend", "server-side",
  "subscription billing", "Stripe subscription", "payment backend", "billing system".
  Do NOT use for UI components (genius-dev-frontend), database schema (genius-dev-database),
  or basic third-party API wrapping (genius-dev-api).
context: fork
agent: genius-dev-backend
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
      command: "bash -c 'echo \"[$(date +%H:%M:%S)] BACKEND: $TOOL_NAME\" >> .genius/dev.log 2>/dev/null || true'"
  Stop:
    - type: command
      command: "bash -c 'echo \"BACKEND COMPLETE: $(date)\" >> .genius/dev.log 2>/dev/null || true'"
      once: true
---

# Genius Dev Backend v17 — API Architect

**Reliable, secure, fast APIs. Build the server layer the frontend deserves.**

---

## Mode Compatibility

| Mode | Behavior |
|------|----------|
| **CLI** | Full execution — run dev server, curl tests, migrations |
| **IDE** (VS Code/Cursor) | Thunder Client / REST Client for inline API testing |
| **Omni** | Route architecture by Claude; route implementation by best available model |
| **Dual** | Claude designs API contracts; Codex implements boilerplate handlers |

---

## Core Principles

1. **Contract-first**: Define request/response types before writing handlers
2. **Fail fast, fail clear**: Validate input early, return descriptive errors
3. **Stateless by default**: Servers should be horizontally scalable
4. **Security at every layer**: Auth, rate limiting, input sanitization, CORS
5. **Observability**: Every route logs at minimum: method, path, status, duration

---

## Stack Detection

```bash
# Detect backend framework
cat package.json | grep -E '"express|fastify|hono|koa|nestjs|trpc"'

# Check for TypeScript
ls tsconfig.json 2>/dev/null && echo "TypeScript project"
```

Frameworks supported:
- **Express**: middleware chain, `app.use()`, `app.get/post/put/delete()`
- **Fastify**: schema validation built-in, plugins, `fastify.register()`
- **Hono**: edge-first, Cloudflare Workers, `app.get('/path', handler)`
- **NestJS**: decorators, DI container, modules
- **tRPC**: type-safe RPC, routers, procedures

---

## API Design — REST Best Practices

### Resource naming
```
GET    /api/users          # list
GET    /api/users/:id      # get one
POST   /api/users          # create
PUT    /api/users/:id      # replace
PATCH  /api/users/:id      # partial update
DELETE /api/users/:id      # delete
```

### HTTP Status Codes
| Code | When |
|------|------|
| 200 | Success with body |
| 201 | Created (POST success) |
| 204 | Success, no body (DELETE) |
| 400 | Bad request (validation error) |
| 401 | Unauthenticated |
| 403 | Authenticated but unauthorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Unprocessable entity |
| 429 | Rate limited |
| 500 | Internal server error |

### Error response format (always consistent)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "field": "email",
    "statusCode": 400
  }
}
```

### Success response format
```json
{
  "data": { ... },
  "meta": { "total": 100, "page": 1, "perPage": 20 }
}
```

---

## Input Validation

Always validate with **Zod** (preferred) or Joi:

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['admin', 'user']).default('user'),
});

// In handler:
const result = CreateUserSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: result.error.issues[0].message,
      field: result.error.issues[0].path[0],
      statusCode: 400,
    }
  });
}
const data = result.data; // fully typed
```

---

## Authentication Patterns

### JWT (stateless)
```typescript
import jwt from 'jsonwebtoken';

// Generate token
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET!,
  { expiresIn: '7d' }
);

// Middleware
export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: { code: 'UNAUTHORIZED' } });
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: { code: 'TOKEN_INVALID' } });
  }
}
```

### Session (stateful)
```typescript
import session from 'express-session';
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
```

### OAuth (with Passport.js or manual)
- Store only the OAuth provider ID + email
- Never store OAuth access tokens in plaintext DB (encrypt or use short TTL + refresh)

---

## Middleware Stack

Standard middleware order:
```typescript
app.use(helmet());           // Security headers
app.use(cors(corsOptions));  // CORS
app.use(express.json({ limit: '10mb' })); // Body parser
app.use(rateLimiter);        // Rate limiting
app.use(requestLogger);      // Logging
// ... routes ...
app.use(errorHandler);       // Global error handler (last)
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } }
});

// Stricter for auth endpoints
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });
app.use('/api/auth', authLimiter);
```

### Global Error Handler
```typescript
export function errorHandler(err, req, res, next) {
  console.error({ err, path: req.path, method: req.method });
  
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.issues[0].message } });
  }
  
  return res.status(err.statusCode || 500).json({
    error: { code: err.code || 'INTERNAL_ERROR', message: 'Internal server error' }
  });
}
```

### Async route + operational error pattern
```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/api/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  res.json({ data: user });
}));

export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        statusCode: err.statusCode,
      },
    });
  }

  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error', statusCode: 500 },
  });
}
```

### Retry transient dependency failures only
```typescript
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function retry<T>(
  operation: () => Promise<T>,
  { retries = 3, baseMs = 100 }: { retries?: number; baseMs?: number } = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isRetryable =
        error instanceof Error &&
        /timeout|temporar|deadlock|ECONNRESET|ETIMEDOUT/i.test(error.message);

      if (!isRetryable || attempt === retries) {
        throw error;
      }

      await sleep(baseMs * 2 ** attempt);
    }
  }

  throw lastError;
}

const profile = await retry(() => billingClient.getCustomerProfile(userId));
```

Rules:
- Retry network/database timeouts, deadlocks, and 429/503-style upstream failures
- Never retry validation, auth, or duplicate-write errors without idempotency protection
- Log retry count and final failure so operators can distinguish flaky dependencies from code bugs

---

## API Testing with curl

Smoke-test list, create, update, and delete flows with authenticated `curl` requests against the changed endpoints.

---

## Output

Mark `.genius/outputs/state.json` complete for `genius-dev-backend` with a fresh timestamp.

---

## Handoff

- → **genius-dev-database**: schema design, migrations, query optimization
- → **genius-dev-api**: third-party integrations (Stripe, SendGrid, etc.)
- → **genius-qa-micro**: API endpoint tests
- → **genius-security**: security audit on auth/payments routes

---

## Playground Update

Refresh the existing dashboard tab with real backend progress data and point the user to `.genius/DASHBOARD.html`.

---

## Definition of Done

- [ ] App starts cleanly after the change
- [ ] New endpoints are exercised
- [ ] Error paths are covered
- [ ] Secrets are not hardcoded
- [ ] Inputs are validated before use

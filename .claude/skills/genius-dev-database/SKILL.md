---
name: genius-dev-database
description: >-
  Specialized database skill. Designs schemas, writes migrations, creates queries,
  and optimizes database performance. Supports SQL (PostgreSQL, MySQL, SQLite) and
  NoSQL (MongoDB, Redis). Works with ORMs: Prisma, Drizzle, TypeORM, Mongoose.
  Use when task involves "database schema", "migration", "SQL query", "index",
  "Prisma", "Drizzle", "database design", "optimize query", "seed data".
  Do NOT use for API routes that call the database — use genius-dev-backend.
context: fork
agent: genius-dev-database
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
      command: "bash -c 'echo \"[$(date +%H:%M:%S)] DATABASE: $TOOL_NAME\" >> .genius/dev.log 2>/dev/null || true'"
  Stop:
    - type: command
      command: "bash -c 'echo \"DATABASE COMPLETE: $(date)\" >> .genius/dev.log 2>/dev/null || true'"
      once: true
---

# Genius Dev Database v17 — Data Architect

**Data outlives code. Design schemas that survive requirements changes.**

---

## Mode Compatibility

| Mode | Behavior |
|------|----------|
| **CLI** | Full migration execution, `prisma db push`, `drizzle-kit generate` |
| **IDE** (VS Code/Cursor) | Prisma extension for schema visualization; inline query hints |
| **Omni** | Claude handles schema design; route to specialized model for complex SQL |
| **Dual** | Claude designs schema; Codex generates repetitive migration boilerplate |

---

## Core Principles

1. **Additive migrations only**: Never drop columns in production — deprecate then remove in a later cycle
2. **Normalize, then denormalize for performance**: Start normalized, add denormalized caches when profiling proves it
3. **Index for your queries**: Know your read patterns before adding indexes
4. **Data integrity at the database level**: Constraints, foreign keys, NOT NULL — don't rely on application-level alone
5. **Audit trail**: Every important entity needs `createdAt`, `updatedAt` at minimum

---

## ORM Detection

```bash
# Detect ORM in use
cat package.json | grep -E '"prisma|drizzle-orm|typeorm|mongoose|sequelize"'

# Prisma
ls prisma/schema.prisma 2>/dev/null && echo "Prisma"

# Drizzle
ls drizzle.config.ts 2>/dev/null && echo "Drizzle"
```

---

## Schema Design Principles

### Universal patterns

```sql
-- Every table needs these
id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

-- Soft delete pattern (preferred over hard delete)
deleted_at  TIMESTAMPTZ,
```

### Schema examples

**Prisma**: Use `cuid()` IDs, `@unique` on email, `@updatedAt`, `DateTime?` for soft delete, `@@index` on foreign keys + common queries, `@@map` for table names. Define enums separately.

**Drizzle**: Use `pgTable` + `pgEnum`, `uuid().defaultRandom().primaryKey()`, `timestamp('...', { withTimezone: true })`. Mirror same patterns as Prisma.

---

## Migration Strategy

### Golden rules
1. **Never destructive in production**: `DROP COLUMN`, `DROP TABLE` → first deprecate, remove in next release
2. **Backward compatible**: New columns must be nullable OR have a default value
3. **One change per migration**: Small, focused migrations are easier to roll back
4. **Test migration with EXPLAIN**: Before running on production, analyze query plans

### Prisma migrations
```bash
# Create migration (after editing schema.prisma)
npx prisma migrate dev --name add_user_profile

# Apply to production
npx prisma migrate deploy

# Reset dev DB (destructive! dev only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

### Drizzle migrations
```bash
# Generate migration
npx drizzle-kit generate:pg

# Apply migration
npx drizzle-kit push:pg

# View migration SQL
cat drizzle/*.sql
```

### Safe column removal (3-step process)
```
Step 1: Stop writing to the column (deploy code change)
Step 2: Add migration to deprecate: COMMENT ON COLUMN users.old_field IS 'DEPRECATED: use new_field';
Step 3: After 2+ deploy cycles, drop: ALTER TABLE users DROP COLUMN old_field;
```

---

## Query Optimization

### EXPLAIN ANALYZE (PostgreSQL)
```sql
-- Always test slow queries with EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT u.*, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON p.author_id = u.id
WHERE u.deleted_at IS NULL
GROUP BY u.id
ORDER BY post_count DESC
LIMIT 10;

-- Look for: Seq Scan (bad on large tables), missing indexes, high rows estimates
```

### Indexing rules
```sql
-- Index foreign keys (always)
CREATE INDEX idx_posts_author_id ON posts(author_id);

-- Index frequently filtered columns
CREATE INDEX idx_users_email ON users(email);

-- Composite index: column order = filter order
CREATE INDEX idx_posts_published_created ON posts(published, created_at DESC);

-- Partial index: only index a subset
CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;

-- Full-text search
CREATE INDEX idx_posts_search ON posts USING GIN(to_tsvector('english', title || ' ' || COALESCE(content, '')));
```

### N+1 prevention (Prisma)
```typescript
// ❌ N+1 problem
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { authorId: user.id } }); // N queries!
}

// ✅ Eager loading
const users = await prisma.user.findMany({
  include: { posts: { where: { published: true } } }
});

// ✅ Select only needed fields
const users = await prisma.user.findMany({
  select: { id: true, name: true, email: true }
});
```

---

## Seed Data

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Upsert to be idempotent (safe to run multiple times)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('Seeded:', admin);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Run: `npx prisma db seed`

---

## Backup Strategy

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore
psql $DATABASE_URL < backup-2025-01-01.sql

# Automated via cron (production)
# 0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz

# Point-in-time recovery: use managed DB (Supabase, PlanetScale, Railway)
# with built-in PITR — don't manage yourself in production
```

---

## Redis Patterns

Use Redis for cache-aside reads, invalidation on writes, and simple fixed-window rate limiting when the schema needs supporting infrastructure.

---

## Output

Mark `.genius/outputs/state.json` complete for `genius-dev-database` with a fresh timestamp.

---

## Handoff

- → **genius-dev-backend**: API routes that use the schema
- → **genius-qa-micro**: Seed data for test environments
- → **genius-security**: Column-level encryption for sensitive fields (PII, payment data)

---

## Playground Update

Refresh the existing dashboard tab with real database progress data and point the user to `.genius/DASHBOARD.html`.

---

## Definition of Done

- [ ] Migrations run cleanly
- [ ] Schema integrity is sound
- [ ] Important query paths have indexes
- [ ] Rollback path exists

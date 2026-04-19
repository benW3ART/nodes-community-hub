---
name: genius-template
description: >-
  Project template bootstrapper. Imports pre-built project templates for common
  app types: SaaS, e-commerce, mobile app, game, web3/DeFi, landing page, API.
  Sets up the project structure, initial files, and configures Genius Team skills
  for the template type. Use when user says "start from a template", "SaaS boilerplate",
  "e-commerce starter", "create from template", "/genius-template",
  "bootstrap a SaaS", "mobile app starter", "landing page template".
  Do NOT use for custom projects — use /genius-start with the interview flow instead.
context: fork
agent: >-
  You are the Project Bootstrapper on the Genius Team. You scaffold production-ready
  project structures from opinionated templates, so teams start with best practices
  already in place rather than accumulating technical debt from day one.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - exec
hooks:
  pre: read .genius/state.json
  post: update .genius/state.json with project.template and project.stack
---

# genius-template — Project Template Bootstrapper

## Available Templates

| Template | Stack | Best For |
|----------|-------|---------|
| `saas` | Next.js + Supabase + Stripe + Resend + shadcn/ui | B2B/B2C SaaS with subscriptions |
| `ecommerce` | Next.js + Medusa.js + Stripe + Cloudinary | Online stores, marketplaces |
| `mobile` | Expo + Supabase + React Navigation + Expo Notifications | iOS/Android apps |
| `landing` | Next.js + Tailwind + Framer Motion + Resend | Product landing pages, waitlists |
| `api` | Node.js + Fastify + Prisma + PostgreSQL + Zod | REST/GraphQL APIs, microservices |
| `web3` | Next.js + wagmi + viem + Dune MCP + genius-crypto | DeFi, NFT, Web3 apps |
| `game` | Phaser.js + Socket.io | Real-time multiplayer browser games |

---

## Template Selection Protocol

### Step 1 — Identify Template

If user ran `/genius-template {name}` → use that template directly.

Otherwise, present options:

```
Available templates:

1. saas       — Next.js + Supabase + Stripe + Resend + shadcn/ui
2. ecommerce  — Next.js + Medusa.js + Stripe + Cloudinary
3. mobile     — Expo + Supabase + React Navigation + Expo Notifications
4. landing    — Next.js + Tailwind + Framer Motion + Resend
5. api        — Node.js + Fastify + Prisma + PostgreSQL + Zod
6. web3       — Next.js + wagmi + viem + Dune MCP + genius-crypto
7. game       — Phaser.js + Socket.io (real-time multiplayer)

Which template? (or describe what you're building)
```

### Step 2 — Confirm Stack

Before generating, confirm:
- Project name
- Primary language (TypeScript preferred)
- Database preferences (if applicable)
- Deployment target (Vercel / Railway / Fly.io / App Store)

### Step 3 — Generate Project Structure

---

## Template Specifications

Each template provides: file structure, key packages, initial configuration, and Genius Team skill routing.

| Template | Stack | Key Packages | Features |
|----------|-------|-------------|----------|
| `saas` | Next.js 14 + Supabase + Stripe | next-auth, prisma, stripe, tailwind | Auth, billing, dashboard, landing |
| `ecommerce` | Next.js + Shopify/Medusa OR Stripe | shopify-buy, medusa, next-intl | Product catalog, cart, checkout, admin |
| `mobile` | Expo (React Native) | expo-router, nativewind, zustand | Tab nav, auth flow, push notifications |
| `landing` | Next.js + Framer Motion | framer-motion, react-hook-form, resend | Hero, features, pricing, contact, analytics |
| `api` | Node.js + Express/Fastify | prisma, zod, jose, pino | REST/GraphQL, auth, rate limiting, OpenAPI |
| `web3` | Next.js + wagmi + Hardhat | wagmi, viem, hardhat, ethers | Wallet connect, smart contracts, DeFi |
| `game` | Phaser.js + Vite | phaser, vite, matter-js | Game loop, physics, scenes, assets |

For detailed file structures, generate the template and inspect the output.

## Step 4 — Generate Initial Files

After template selection, generate:

1. **`README.md`** — Project-specific with setup instructions
2. **`.env.example`** — All required environment variables documented
3. **`package.json`** — Correct scripts (dev, build, start, test)
4. **`src/`** — Minimal working scaffold (not empty files)
5. **`.genius/state.json`** — Template context

---

## Step 5 — Initialize State

```json
// .genius/state.json
{
  "project": {
    "name": "{project-name}",
    "template": "saas",
    "stack": ["nextjs", "supabase", "stripe", "resend", "shadcn"],
    "deployment": "vercel",
    "created_at": "2026-03-10"
  },
  "recommended_skills": [
    "genius-dev-backend",
    "genius-dev-frontend",
    "genius-analytics"
  ],
  "phase": "setup"
}
```

---

## Handoff (by template type)

- **SaaS** → `genius-dev-backend` (auth + billing) → `genius-dev-frontend` (dashboard) → `genius-analytics`
- **E-commerce** → `genius-dev-backend` (catalog + orders) → `genius-seo` (product schema)
- **Mobile** → `genius-dev-mobile` → `genius-analytics`
- **Landing** → `genius-copywriter` (copy) → `genius-seo` (meta) → `genius-analytics` (conversion)
- **API** → `genius-dev-api` → `genius-docs` (OpenAPI)
- **Web3** → `genius-crypto` → `genius-dev-frontend`
- **Game** → `genius-dev-frontend` → `genius-performance`

## Definition of Done

- [ ] Template choice maps to a coherent stack and follow-up skills
- [ ] Generated starter state matches the selected template
- [ ] Recommendations are specific enough to start execution
- [ ] Template-specific caveats or assumptions are noted
- [ ] Handoff path is explicit

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

**Implementation complete.** Backend NestJS application with full provisioning pipeline.

## What This Builds

A **Course Provisioning Platform** that automates academic course setup by orchestrating:
- Discord server creation (channels, roles, permissions, invites) per course/semester
- GitHub repository creation (branch protection, seeded content) per course or per lab group
- Deterministic, idempotent, retry-safe async provisioning workflows
- Full audit logging of all external API calls

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS (TypeScript strict), modular architecture, DI, DTO validation, Swagger/OpenAPI |
| Database | PostgreSQL + Prisma 7 (pg adapter) |
| Queue | BullMQ (Redis-backed), deterministic provisioning state machine |
| Discord | discord.js v14 (REST only, no Gateway) |
| GitHub | @octokit/rest |

## Setup Commands

```bash
# 1. Copy environment file and fill in credentials
cp .env.example .env

# 2. Start Postgres + Redis
docker-compose up -d

# 3. Run database migrations
npm run prisma:migrate:dev -- --name init

# 4. Generate Prisma client
npm run prisma:generate

# 5. Start dev server
npm run start:dev
```

For production:
```bash
npm run build
npm run prisma:migrate    # runs prisma migrate deploy
npm start
```

## Environment Variables

See `.env.example` for all required variables.

| Variable | Description |
|----------|-------------|
| `API_KEY` | Secret key for `x-api-key` header authentication |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection URL |
| `DISCORD_BOT_TOKEN` | Discord bot token (requires Manage Guild, Manage Channels, Manage Roles) |
| `GITHUB_TOKEN` | GitHub PAT (requires `repo` + `admin:org` scopes) |
| `GITHUB_ORG` | GitHub organization name |

## API Surface

```
POST   /courses           – create and trigger provisioning (returns 202)
GET    /courses/:id        – course details
GET    /courses/:id/status – provisioning step-level status
POST   /courses/:id/retry  – retry failed provisioning (returns 202)
GET    /health            – Postgres + Redis health check
GET    /api/docs          – Swagger UI
```

All endpoints require `x-api-key` header (except `/health`).

## Core Domain Model

**Course types** drive the entire provisioning logic:

- **Lecture**: one cohort → one Discord server + one GitHub repo (shared access)
- **Laboratory**: multiple lab groups → one Discord server with per-group private channels/roles + one GitHub repo per group

## Project Structure

```
src/
├── main.ts                          ← Bootstrap, ValidationPipe, Swagger
├── app.module.ts                    ← Root module
├── config/
│   ├── configuration.ts             ← Config factory
│   └── env.validation.ts            ← Joi schema
├── prisma/
│   ├── prisma.service.ts            ← PrismaClient with pg adapter
│   └── prisma.module.ts             ← Global module
├── common/
│   ├── filters/global-exception.filter.ts
│   └── guards/api-key.guard.ts
├── modules/
│   ├── courses/                     ← CRUD + queue enqueue
│   ├── provisioning/                ← State machine processor + 11 step handlers
│   ├── discord/                     ← REST-only Discord integration
│   ├── github/                      ← Octokit GitHub integration
│   └── audit/                       ← Append-only audit log service
└── health/                          ← /health endpoint
```

## Key Architectural Constraints

- All provisioning steps are **idempotent** (read-before-act via `ExternalResource` table)
- External resource IDs persisted before moving to next step
- Every external API call is **audit logged** with timing
- State machine is **deterministic** — same input → same step sequence
- BullMQ: 5 attempts, exponential backoff (5s base), jobs never removed

## Prisma 7 Notes

Prisma 7 no longer accepts `url` in `schema.prisma` datasource block.
- Database URL for migrations → `prisma/prisma.config.ts`
- PrismaClient → initialized with `@prisma/adapter-pg` (pg Pool)
- Uses `findFirst` instead of `findUnique` for nullable composite unique fields

## GitHub Repository Provisioning

Each repo is private with branch protection (`require PR`, `≥1 approval`, `no force push`) and seeded atomically (Git Tree API) with: `README.md`, `syllabus.md`, `CONTRIBUTING.md`, PR template, assignment template.

## Discord Structure

- **Lecture**: `#announcements`, `#general`, `#lectures`, `#qa-help`
- **Laboratory**: per-group private channel + dedicated group role; @everyone denied VIEW_CHANNEL, group role allowed VIEW_CHANNEL

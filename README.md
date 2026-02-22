# Course Provisioning Platform

A production-grade NestJS backend that automates academic course setup by provisioning Discord servers and GitHub repositories with deterministic, idempotent, retry-safe workflows.

## What It Does

| Course Type | Discord | GitHub |
|-------------|---------|--------|
| **Lecture** | One server with `#announcements`, `#general`, `#lectures`, `#qa-help` | One private repo (branch protection + seeded content) |
| **Laboratory** | One server with a private channel + role per lab group | One private repo per lab group |

All external API calls are audit-logged. Every provisioning step is idempotent — safe to retry at any point.

## Tech Stack

- **NestJS** (TypeScript strict mode) — modular architecture, DI, DTO validation
- **PostgreSQL + Prisma 7** — migration-based schema, pg driver adapter
- **BullMQ + Redis** — async queue with exponential backoff retries
- **discord.js v14** — REST-only (no Gateway)
- **@octokit/rest** — GitHub API
- **Swagger/OpenAPI** — auto-generated at `/api/docs`

## Prerequisites

- Node.js 20+
- Docker (for Postgres + Redis)
- A Discord bot token with **Manage Guild**, **Manage Channels**, **Manage Roles** permissions
- A GitHub PAT with **`repo`** and **`admin:org`** scopes (or a fine-grained token with equivalent permissions) for a GitHub organization

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
API_KEY=your-secret-api-key
DATABASE_URL=postgresql://course_provisioning:course_provisioning@localhost:5432/course_provisioning
REDIS_URL=redis://localhost:6379
DISCORD_BOT_TOKEN=your-discord-bot-token
GITHUB_TOKEN=ghp_your-token
GITHUB_ORG=your-github-org
```

### 3. Start infrastructure

```bash
docker-compose up -d
```

### 4. Run database migrations

```bash
npm run prisma:migrate:dev -- --name init
```

### 5. Start the server

```bash
npm run start:dev
```

The server runs on `http://localhost:3000`.
Swagger UI is available at `http://localhost:3000/api/docs`.

## API

All endpoints require an `x-api-key` header matching the `API_KEY` env var.

### Create a course

```bash
# Lecture course
curl -X POST http://localhost:3000/courses \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-key" \
  -d '{
    "name": "Introduction to Computer Science",
    "semester": "2024-spring",
    "type": "LECTURE"
  }'

# Laboratory course
curl -X POST http://localhost:3000/courses \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-key" \
  -d '{
    "name": "Software Engineering Lab",
    "semester": "2024-spring",
    "type": "LABORATORY",
    "labGroups": [
      { "name": "Alpha", "number": 1 },
      { "name": "Beta",  "number": 2 }
    ]
  }'
```

Returns `202 Accepted` immediately. Provisioning runs asynchronously.

### Check provisioning status

```bash
curl http://localhost:3000/courses/{id}/status \
  -H "x-api-key: your-key"
```

Response:
```json
{
  "courseId": "clxxx...",
  "courseStatus": "IN_PROGRESS",
  "steps": [
    { "stepName": "CREATE_DISCORD_SERVER", "status": "COMPLETED", "attempts": 1 },
    { "stepName": "CREATE_DISCORD_CHANNELS", "status": "IN_PROGRESS", "attempts": 1 },
    { "stepName": "CREATE_GITHUB_REPO", "status": "PENDING", "attempts": 0 }
  ]
}
```

### Retry a failed course

```bash
curl -X POST http://localhost:3000/courses/{id}/retry \
  -H "x-api-key: your-key"
```

Resets `FAILED` steps to `PENDING` and re-enqueues. Completed steps are automatically skipped.

### Other endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/courses/:id` | Course details |
| `GET` | `/health` | Postgres + Redis health check |
| `GET` | `/api/docs` | Swagger UI |

## Provisioning Steps

### Lecture (5 steps)

1. `CREATE_DISCORD_SERVER` — creates the guild
2. `CREATE_DISCORD_CHANNELS` — creates `#announcements`, `#general`, `#lectures`, `#qa-help`
3. `CREATE_GITHUB_REPO` — creates private repo (422-safe)
4. `APPLY_BRANCH_PROTECTION` — requires PR + 1 approval, disables force push
5. `SEED_GITHUB_CONTENT` — atomic commit of `README.md`, `syllabus.md`, `CONTRIBUTING.md`, PR template, assignment template

### Laboratory (6 steps)

1. `CREATE_DISCORD_SERVER`
2. `CREATE_GROUP_ROLES` — one Discord role per lab group
3. `CREATE_GROUP_CHANNELS` — private channel per group (@everyone denied, group role allowed)
4. `CREATE_GROUP_REPOS` — one private repo per group
5. `APPLY_GROUP_BRANCH_PROTECTIONS` — branch protection on each repo
6. `SEED_GROUP_CONTENT` — seed content in each repo

## Architecture

```
POST /courses
  → INSERT Course (PENDING) + ProvisioningStep rows (one per step, PENDING)
  → BullMQ: queue.add('provision', { courseId })

ProvisioningProcessor.process():
  for each step in registry (ordered):
    if step.status === COMPLETED → skip   ← idempotency via DB checkpoint
    mark IN_PROGRESS, increment attempts
    step.execute(ctx)
      → getExternalResource()   ← read-before-act
      → call external API
      → saveExternalResource()  ← persist ID before continuing
    mark COMPLETED
  → mark Course COMPLETED

on error:
  mark step FAILED, mark Course FAILED
  throw → BullMQ retries with exponential backoff (5 attempts, 5s base)
```

Key design decisions:

- **Single BullMQ job per provisioning run** — DB records are the durable checkpoints, not queue messages
- **`ExternalResource` table** — unique constraint prevents duplicate API calls across retries
- **`AuditLog` table** — every external call logged with timing, payload, and result
- **Git Tree API** — seeds all files in a single atomic commit

## Project Structure

```
src/
├── main.ts
├── app.module.ts
├── config/               ← configuration + Joi env validation
├── prisma/               ← PrismaService (global)
├── common/
│   ├── filters/          ← GlobalExceptionFilter
│   └── guards/           ← ApiKeyGuard
├── modules/
│   ├── courses/          ← CoursesController, CoursesService, DTOs
│   ├── provisioning/
│   │   ├── provisioning.processor.ts   ← core state machine
│   │   ├── state-machine/              ← step registries
│   │   └── steps/
│   │       ├── base.step.ts
│   │       ├── lecture/    (5 handlers)
│   │       └── laboratory/ (6 handlers)
│   ├── discord/          ← DiscordService (REST only)
│   ├── github/           ← GithubService
│   └── audit/            ← AuditService
└── health/               ← /health endpoint
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `Course` | Core entity; tracks overall provisioning status |
| `LabGroup` | Lab groups belonging to a LABORATORY course |
| `ProvisioningStep` | One row per step per course; durable checkpoint |
| `ExternalResource` | Persisted Discord/GitHub IDs; prevents duplicate calls |
| `AuditLog` | Append-only log of every external API call |
| `JobExecution` | BullMQ job correlation records |

## Development Scripts

```bash
npm run start:dev          # watch mode
npm run build              # production build
npm run prisma:migrate:dev # create + apply migration
npm run prisma:migrate     # apply migrations (production)
npm run prisma:generate    # regenerate Prisma client
npm run prisma:studio      # open Prisma Studio GUI
```

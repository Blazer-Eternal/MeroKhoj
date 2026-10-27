# MeroKhoj Backend

**Find what's yours** — a job portal API built with Express + TypeScript + Sequelize + PostgreSQL.

## Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Language:** TypeScript
- **ORM:** Sequelize 6
- **Database:** PostgreSQL
- **Auth:** JWT (access + refresh)
- **Validation:** Zod
- **Docs:** Swagger UI at `/api/docs`

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# edit .env (or .env.local) — DB creds, JWT secrets, PORT

# 3. Run migrations (creates 12 tables)
npm run db:migrate

# 4. Seed roles + admin + demo company
npm run db:seed

# 5. Start dev server (ts-node + nodemon)
npm run dev
```

The API listens on `http://localhost:<PORT>` (default **8000**).

- Health check: `GET /api/health`
- Swagger docs: `GET /api/docs`

## Default Accounts (from seeder)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@merokhoj.com` | `Admin@123` |
| Company | `MeroKhoj Labs` (demo, VERIFIED) | — |

## Architecture

```
src/
├── api/
│   ├── controllers/    # Request → service orchestration
│   ├── routes/         # Express routers + guards
│   └── swagger/        # API docs
├── config/             # env, db, cors
├── db/
│   ├── migrations/     # 12 table migrations
│   └── seeders/        # baseSeeder (roles/admin/company)
├── enums/              # Statuses + transition graphs
├── interfaces/         # DTOs and contracts
├── middleware/         # guard, validator, errorHandler
├── models/             # 12 Sequelize models + associations
├── repositories/       # Data access
├── services/           # Business logic + workflow engine
├── utils/              # tokens, errors, pagination
└── validators/         # Zod schemas
```

Layering: **route → controller → service → repository → model**.

## Entities (12)

`users`, `roles`, `user_roles`, `jobseeker_profiles`, `companies`,
`company_members`, `jobs`, `skills`, `job_skills`, `applications`,
`application_status_history`, `interviews`

All primary keys are UUIDs (`gen_random_uuid()`).

## API Overview

### Auth — `/api/auth`
- `POST /register` — create a jobseeker account
- `POST /login` — returns access + refresh tokens
- `GET /me` — current user + roles
- `POST /refresh` — rotate tokens

### Jobs — `/api/jobs`
- `GET /` — public search (keyword, location, type, pagination)
- `POST /` — create (employer) — starts as `DRAFT`
- `GET /:id` — detail
- `PATCH /:id` — update
- `PATCH /:id/status` — workflow transition
- `POST /:id/applications` — apply (jobseeker)

### Applications — `/api/applications`
- `GET /` — employer/candidate listings
- `GET /:id` — detail
- `PATCH /:id/status` — workflow transition
- `GET /:id/history` — append-only status audit trail

### Interviews — `/api/interviews`
- `POST /` — schedule (requires SHORTLISTED application)
- `PATCH /:id/status` — update state
- `GET /:id` — detail

### Companies / Skills / Profiles
- `/api/companies` — employer CRUD + membership
- `/api/skills` — skill catalog
- `/api/profiles` — jobseeker profile management

## Workflows

Status changes are enforced by transition graphs in `src/enums/*` —
illegal transitions return **409 Conflict**.

- **Job:** `DRAFT → PENDING_REVIEW → PUBLISHED → CLOSED` (+ `REJECTED`, `DRAFT` rollback)
- **Application:** `APPLIED → UNDER_REVIEW → SHORTLISTED → INTERVIEW → HIRED` (plus `REJECTED`, `WITHDRAWN`)
- **Interview:** `SCHEDULED → COMPLETED / CANCELLED / NO_SHOW`

Every application transition is recorded in `application_status_history` (append-only).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon |
| `npm run build` | Compile to `dist/` |
| `npm run start` | Run compiled output |
| `npm run db:migrate` | Run migrations |
| `npm run db:migrate:undo` | Rollback last migration |
| `npm run db:seed` | Seed reference data |
| `npm run db:seed:undo` | Rollback seeder |
| `npx tsc --noEmit` | Type-check |
| `npx eslint "src/**/*.ts"` | Lint |

## Environment Variables

```env
PORT=8000                     # (default 5000 if unset)
ENVIRONMENT=development       # or NODE_ENV
DB_HOST=localhost
DB_PORT=5432
DB_NAME=JobPortal             # (default merokhoj)
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me  # or JWT_SECRET_KEY (shared fallback for both)
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

> `.env.local` is loaded first and overrides `.env`. `ENVIRONMENT` (or `NODE_ENV`) selects the mode; `JWT_SECRET_KEY` can stand in for both JWT secrets.

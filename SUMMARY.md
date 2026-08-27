# example-three-tier-application — Summary

A comprehensive reference guide for the example-three-tier-application repository. This document provides an overview of the project architecture, setup instructions, development patterns, and deployment procedures.

## Overview

**Project:** example-three-tier-application  
**Purpose:** A reference implementation of a three-tier web application demonstrating how a modern web stack is organized and deployed.  
**Application:** A simple task manager (to-do list) that showcases communication between frontend, API, and database layers.

### Architecture Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP
       ▼
┌──────────────────────┐
│  Web (Next.js :3000) │  ← Frontend
└──────┬───────────────┘
       │ HTTP
       ▼
┌──────────────────────┐
│ API (Express :3001)  │  ← Internal API
└──────┬───────────────┘
       │ TCP
       ▼
┌──────────────────────┐
│  PostgreSQL Database │  ← Persistent Storage
└──────────────────────┘
```

### Technology Stack

| Layer | Technology | Version | Location |
|-------|-----------|---------|----------|
| **Frontend** | Next.js | 16 | `src/web/` |
| | React | 19 | |
| | Tailwind CSS | Latest | |
| **API** | Express | 5 | `src/api/` |
| | Node.js | 22 | |
| **Database** | PostgreSQL | 17 | Docker / Cloud SQL |
| **Migrations** | node-pg-migrate | Latest | `src/db/` |
| **Infrastructure** | Terraform | Latest | `src/infrastructure/` |
| | GCP (Cloud Run, Cloud SQL) | — | |

### What This App Does

The application is a task manager (to-do list) where users can:
- View all tasks
- Create new tasks with a title
- Mark tasks as completed/incomplete
- Edit task titles

It demonstrates the complete flow of data through a three-tier architecture:
1. User interacts with the Next.js frontend in the browser
2. Frontend sends HTTP requests to the Express API
3. API queries PostgreSQL and returns JSON responses
4. Frontend updates to reflect the new state

---

## Quick Start

### Prerequisites

- **Docker Desktop** (or Docker Engine + Compose plugin)
  - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - Verify installation: `docker --version && docker compose --version`

### Start the Stack

Run a single command to build and start all services:

```bash
docker compose up --build
```

### Service Startup Order

The services start in dependency order:

1. **postgres** — PostgreSQL 17 database container
   - Waits for the database to be healthy (responds to `pg_isready`)
   - Creates the `app` database with user `app`

2. **migrate** — Database migration runner
   - Waits for postgres to be healthy
   - Runs `node-pg-migrate up` to apply all pending migrations
   - Exits after migrations complete

3. **api** — Express API server
   - Waits for migrate to complete successfully
   - Starts on port 3001 (internal only, not exposed)
   - Connects to PostgreSQL via `DATABASE_URL`

4. **web** — Next.js frontend
   - Waits for api to be ready
   - Starts on port 3000 (exposed to host)
   - Communicates with API via `http://api:3001`

### Access the Application

Once all services are running, open your browser:

```
http://localhost:3000
```

You should see the task manager interface.

### Stop and Clean Up

```bash
# Stop containers (keeps the postgres_data volume)
docker compose down

# Stop and delete all data (fresh start next time)
docker compose down -v
```

### Rebuild After Code Changes

When you modify code in `src/api/`, `src/web/`, or `src/db/`:

```bash
docker compose up --build
```

The `--build` flag rebuilds images before starting containers.

### Troubleshooting Docker Issues

**Containers won't start:**
- Check Docker Desktop is running
- Ensure ports 3000 and 3001 are not in use
- Try `docker compose down -v && docker compose up --build`

**Database connection errors:**
- Wait 10-15 seconds for postgres to be healthy
- Check logs: `docker compose logs postgres`

**Migrations fail:**
- Verify the migration files in `src/db/migrations/` are valid
- Check logs: `docker compose logs migrate`

**Port already in use:**
- Find and kill the process: `lsof -i :3000` (macOS/Linux)
- Or modify the port mapping in `docker-compose.yml`

---

## Project Structure

```
example-three-tier-application/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions CI/CD workflow
│
├── src/
│   ├── api/                        # Express REST API
│   │   ├── index.js                # Main file with route handlers
│   │   ├── db.js                   # PostgreSQL connection pool
│   │   ├── Dockerfile              # API container definition
│   │   ├── package.json            # API dependencies
│   │   └── .dockerignore           # Files to exclude from image
│   │
│   ├── db/                         # Database setup and migrations
│   │   ├── migrations/             # node-pg-migrate migration files
│   │   │   ├── 1718500000000_initial-schema.js
│   │   │   └── 1718500001000_create-tasks.js
│   │   ├── Dockerfile              # Migration runner container
│   │   ├── package.json            # node-pg-migrate dependency
│   │   └── .dockerignore
│   │
│   ├── web/                        # Next.js frontend application
│   │   ├── app/                    # App Router (pages and components)
│   │   ├── public/                 # Static assets
│   │   ├── Dockerfile              # Web container definition
│   │   ├── package.json            # Frontend dependencies
│   │   ├── next.config.ts          # Next.js configuration
│   │   ├── tsconfig.json           # TypeScript configuration
│   │   ├── postcss.config.mjs       # Tailwind CSS setup
│   │   ├── eslint.config.mjs        # ESLint configuration
│   │   └── .dockerignore
│   │
│   └── infrastructure/             # Terraform for GCP deployment
│       ├── main.tf                 # Primary infrastructure resources
│       ├── variables.tf            # Input variable definitions
│       ├── outputs.tf              # Output values (e.g., web_url)
│       ├── migration.tf            # Database migration setup
│       ├── terraform.tfvars.example # Template for terraform.tfvars
│       └── .gitignore              # Terraform state files excluded
│
├── docker-compose.yml              # Local development orchestration
├── README.md                        # Full documentation
├── agents.md                        # AI agent development guide
├── SUMMARY.md                       # This file
├── LICENSE                         # MIT License
└── .gitignore                      # Git exclusions

```

### Key Files Explained

- **docker-compose.yml** — Defines all four services (postgres, migrate, api, web) and their configuration for local development
- **src/api/Dockerfile** — Builds the Express API container (Node.js 22 base)
- **src/db/Dockerfile** — Builds the migration runner container
- **src/web/Dockerfile** — Builds the Next.js frontend container
- **.github/workflows/deploy.yml** — Automated CI/CD: builds images, pushes to GCP Container Registry, applies Terraform
- **src/infrastructure/terraform.tfvars.example** — Template showing required variables for GCP deployment

---

## API Reference

The API is an Express server running on port 3001 (internal to Docker network). All endpoints expect and return JSON.

### Endpoints

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| GET | `/health` | Health check | — | `{ "status": "ok" }` |
| GET | `/tasks` | List all tasks | — | `[{ id, title, completed, created_at }, ...]` |
| POST | `/tasks` | Create a new task | `{ "title": "..." }` | `{ id, title, completed, created_at }` (201) |
| PATCH | `/tasks/:id` | Update a task | `{ "completed": bool }` or `{ "title": "..." }` | `{ id, title, completed, created_at }` |

### Examples

**List all tasks:**
```bash
curl http://localhost:3001/tasks
```

**Create a task:**
```bash
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy milk"}'
```

**Mark task as complete:**
```bash
curl -X PATCH http://localhost:3001/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

---

## Database Schema

The database is PostgreSQL 17 with a schema defined by migrations in `src/db/migrations/`.

### Tables

#### `users` (from `1718500000000_initial-schema.js`)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PRIMARY KEY | Auto-incrementing |
| email | varchar(255) | NOT NULL, UNIQUE | User email address |
| created_at | timestamp | NOT NULL, DEFAULT now() | Creation timestamp |

#### `tasks` (from `1718500001000_create-tasks.js`)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | serial | PRIMARY KEY | Auto-incrementing |
| title | varchar(500) | NOT NULL | Task description |
| completed | boolean | NOT NULL, DEFAULT false | Completion status |
| created_at | timestamp | NOT NULL, DEFAULT now() | Creation timestamp |

### How Migrations Are Applied

During `docker compose up`, the workflow is:

1. postgres service starts and becomes healthy
2. migrate service runs with `DATABASE_URL` environment variable pointing to postgres
3. migrate container executes `node-pg-migrate up` which:
   - Connects to the database
   - Checks the `pgmigrations` table for previously applied migrations
   - Runs all pending migration files in order
   - Records each migration as applied
4. migrate service exits (successfully)
5. api service starts and can now query the fully initialized schema

### Migration Files

Migration files follow the naming convention: `{TIMESTAMP}_{description}.js`

Each exports two functions:
- `exports.up(pgm)` — Applied when migrating forward
- `exports.down(pgm)` — Applied when rolling back

**Important:** Migrations are append-only. Never edit an existing migration file; create a new one to make further changes.


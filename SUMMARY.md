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

---

## GCP Deployment

The `src/infrastructure/` directory contains Terraform code that provisions a complete three-tier application on Google Cloud Platform.

### What Terraform Provisions

When you run `terraform apply`, it creates:

- **VPC Network** — Private network for all resources
- **Subnet** — CIDR range for Cloud Run and Cloud SQL connectivity
- **Cloud SQL PostgreSQL 17** — Managed database with private IP
- **VPC Access Connector** — Allows Cloud Run to connect to Cloud SQL
- **Cloud Run Services** — Two services:
  - API service (internal, only accessible from web service)
  - Web service (public, accessible from the internet)
- **Secret Manager** — Stores the database URL securely
- **Service Accounts** — Separate accounts for API and web services
- **IAM Bindings** — Grants services permission to access secrets and databases

### Required Variables

Create a `terraform.tfvars` file in `src/infrastructure/` (use `terraform.tfvars.example` as a template):

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `project_id` | string | Yes | Your GCP project ID |
| `api_image` | string | Yes | Container image URI for API (e.g., `gcr.io/my-project/api:v1.0`) |
| `web_image` | string | Yes | Container image URI for web frontend |
| `region` | string | No | GCP region (default: `us-central1`) |
| `app_name` | string | No | Resource name prefix (default: `todo`) |
| `environment` | string | No | `dev`, `staging`, or `prod` (default: `dev`) |
| `subnet_cidr` | string | No | VPC subnet CIDR (default: `10.0.0.0/24`) |
| `connector_cidr` | string | No | VPC Access Connector CIDR (default: `10.0.1.0/28`) |
| `db_tier` | string | No | Cloud SQL machine tier (default: `db-f1-micro`) |

### Example terraform.tfvars

```hcl
project_id = "my-gcp-project"
region      = "us-central1"
environment = "dev"
app_name    = "todo"

api_image = "gcr.io/my-gcp-project/api:v1.0"
web_image = "gcr.io/my-gcp-project/web:v1.0"

db_tier = "db-f1-micro"
```

### Terraform Workflow

**Initialize Terraform** (first time only):
```bash
cd src/infrastructure
terraform init
```

**Plan the deployment** (review what will be created):
```bash
terraform plan -var-file=terraform.tfvars
```

**Apply the configuration** (create/update resources):
```bash
terraform apply -var-file=terraform.tfvars
```

**Destroy resources** (cleanup):
```bash
terraform destroy -var-file=terraform.tfvars
```

### Retrieving the Public URL

After `terraform apply` completes, get the public URL of the web service:

```bash
terraform output web_url
```

This URL is where your application is accessible on the internet.

### CI/CD Integration

The GitHub Actions workflow in `.github/workflows/deploy.yml` automates:
1. Building Docker images for API and web services
2. Pushing images to GCP Container Registry
3. Running `terraform apply` to update infrastructure
4. Deploying the new images to Cloud Run

See the **Deployment & CI/CD** section below for details.

---

## Development Workflow

This section documents the conventions and patterns used in this repository.

### Key Conventions

**1. Migrations are append-only**
- Never edit an existing migration file
- To make schema changes, create a new migration file
- Example: If you need to add a column, create `1718500002000_add-priority-to-tasks.js`
- Reason: Ensures consistency across environments (dev, staging, prod)

**2. The API is internal**
- The Express API on port 3001 is NOT exposed outside the Docker network
- All external traffic goes through the Next.js web tier on port 3000
- The API is only accessible from the web service and from within the docker-compose network
- To test the API directly, temporarily expose it in docker-compose.yml or use `docker compose exec`

**3. Environment variables are the config boundary**
- No hardcoded values for connection strings, ports, or URLs
- All configuration comes from environment variables (see docker-compose.yml)
- Example: `DATABASE_URL`, `API_URL`, `PORT` are all environment variables
- This allows the same image to run in different environments

**4. Node.js 22 and PostgreSQL 17 requirements**
- All Dockerfiles use Node.js 22 as the base image
- PostgreSQL version is pinned to 17 in docker-compose.yml and Terraform
- If adding new Dockerfiles or updating versions, maintain these versions

### Running Migrations Manually

To apply or rollback migrations outside of docker-compose:

**Apply all pending migrations:**
```bash
cd src/db
DATABASE_URL=postgres://app:app@localhost:5432/app npx node-pg-migrate up
```

**Rollback the last migration:**
```bash
cd src/db
DATABASE_URL=postgres://app:app@localhost:5432/app npx node-pg-migrate down
```

**Apply a specific number of migrations:**
```bash
cd src/db
DATABASE_URL=postgres://app:app@localhost:5432/app npx node-pg-migrate up --steps=2
```

**Check migration status:**
```bash
cd src/db
DATABASE_URL=postgres://app:app@localhost:5432/app npx node-pg-migrate status
```

### DATABASE_URL Format

The `DATABASE_URL` environment variable must follow this format:

```
postgres://username:password@host:port/database
```

For local development:
```
postgres://app:app@localhost:5432/app
```

For Cloud SQL (from Terraform):
```
postgres://app:password@cloudsql-private-ip:5432/app
```

### Scoped Feature Development

When adding a feature, follow this order to keep changes isolated:

1. **Database Layer** — Create a migration if schema changes are needed
2. **API Layer** — Add/modify Express endpoints
3. **Frontend Layer** — Update Next.js pages and components

This ensures each layer is tested independently before integration.

---

## Working with AI Agents

This repository is designed to work well with AI-assisted development tools like Claude Code. See **agents.md** for detailed guidance.

### Quick Summary

**AI agents work best when given:**
- Specific, scoped tasks (not "build a feature")
- Context about which tier to modify
- Examples of expected behavior

**Common patterns:**
- Scope changes to one tier at a time (migration → API → frontend)
- Ask the agent to explain its plan before making changes
- Have the agent run `docker compose up` and check logs for errors

### Suggested Prompts

**Understanding the codebase:**
```
Explain how a task flows from the browser through the web tier, to the API, and into the database.
```

**Adding features:**
```
Add a DELETE /tasks/:id endpoint to the API and wire it up to a delete button in the frontend.
```

**Database changes:**
```
Add a due_date column to the tasks table. Create the migration, update the API to accept and return it, and show it in the UI.
```

**Infrastructure:**
```
Explain the Terraform in src/infrastructure/ and what GCP resources it creates.
```

### Full Guide

For more prompts, patterns, and tips, see **agents.md** in the repository root.

---

## Deployment & CI/CD

The GitHub Actions workflow automates building, testing, and deploying the application.

### Workflow File

**Location:** `.github/workflows/deploy.yml`

### What the Workflow Does

On every push to the main branch:

1. **Build Docker Images**
   - Builds the API image from `src/api/Dockerfile`
   - Builds the web image from `src/web/Dockerfile`
   - Tags images with the git commit SHA

2. **Push to Container Registry**
   - Authenticates to GCP using a service account
   - Pushes API image to `gcr.io/PROJECT/api:COMMIT_SHA`
   - Pushes web image to `gcr.io/PROJECT/web:COMMIT_SHA`

3. **Apply Terraform**
   - Runs `terraform init` in `src/infrastructure/`
   - Runs `terraform apply` with the new image URIs
   - Updates Cloud Run services to use the new images

4. **Deploy to Cloud Run**
   - Cloud Run automatically pulls the new images
   - Starts new container instances
   - Routes traffic to the new version

### Environment-Specific Deployments

The workflow can deploy to different environments (dev, staging, prod) by:
- Using different `terraform.tfvars` files
- Setting different environment variables in Terraform
- Targeting different GCP projects

### Triggering Deployments

Deployments are triggered by:
- Pushing to the main branch
- Creating a pull request (runs tests, doesn't deploy)
- Manual trigger via GitHub Actions UI

### Monitoring Deployments

View deployment status in the GitHub Actions tab:
- Green check = deployment successful
- Red X = deployment failed
- Check the logs to see what went wrong

---

## Troubleshooting & Common Tasks

### Viewing Logs

**View all service logs:**
```bash
docker compose logs -f
```

**View logs from a specific service:**
```bash
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres
docker compose logs -f migrate
```

**View the last 100 lines:**
```bash
docker compose logs --tail=100 api
```

### Running Commands Inside Containers

**Execute a command in a running container:**
```bash
docker compose exec api npm test
docker compose exec web npm run build
```

**Open a shell in a container:**
```bash
docker compose exec api sh
docker compose exec postgres psql -U app -d app
```

### Resetting the Database

**Keep containers running, reset data only:**
```bash
docker compose down -v
docker compose up --build
```

**Full reset (delete everything):**
```bash
docker compose down -v
docker system prune -a
docker compose up --build
```

### Testing the API Manually

**Temporarily expose the API port** in docker-compose.yml:
```yaml
api:
  # ... other config ...
  ports:
    - "3001:3001"  # Add this line temporarily
```

Then use curl:
```bash
curl http://localhost:3001/health
curl http://localhost:3001/tasks
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test task"}'
```

**Or use docker compose exec:**
```bash
docker compose exec web curl http://api:3001/tasks
```

### Inspecting the Database Schema

**Connect to PostgreSQL directly:**
```bash
docker compose exec postgres psql -U app -d app
```

**Common psql commands:**
```sql
\dt                    -- List all tables
\d tasks               -- Describe the tasks table
SELECT * FROM tasks;   -- View all tasks
SELECT * FROM pgmigrations;  -- View applied migrations
```

### Common Error Scenarios

**Error: "port 3000 is already in use"**
- Kill the process using the port: `lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9`
- Or modify the port in docker-compose.yml

**Error: "postgres service won't become healthy"**
- Check logs: `docker compose logs postgres`
- Ensure Docker has enough memory (at least 2GB)
- Try deleting the volume: `docker compose down -v`

**Error: "migrate service keeps restarting"**
- Check migration syntax: `docker compose logs migrate`
- Ensure DATABASE_URL is correct in docker-compose.yml
- Verify the migration file is valid JavaScript

**Error: "API can't connect to database"**
- Ensure migrate service completed successfully
- Check DATABASE_URL in docker-compose.yml
- Verify postgres is healthy: `docker compose logs postgres`

**Error: "Web can't reach API"**
- Ensure API_URL is set to `http://api:3001` in docker-compose.yml
- Check that web service depends_on api
- Verify api service is running: `docker compose ps`

---

## References & Resources

### Documentation

- **README.md** — Full project documentation and getting started guide
- **agents.md** — Detailed guide for working with AI agents and Claude Code
- **SUMMARY.md** — This file; comprehensive reference guide

### Source Code

- **docker-compose.yml** — Local development configuration
- **src/api/package.json** — API dependencies (Express, node-pg)
- **src/web/package.json** — Frontend dependencies (Next.js, React, Tailwind)
- **src/db/package.json** — Database migration dependencies

### Dockerfiles

- **src/api/Dockerfile** — Express API container
- **src/web/Dockerfile** — Next.js frontend container
- **src/db/Dockerfile** — Migration runner container

### Infrastructure

- **src/infrastructure/main.tf** — Primary Terraform configuration
- **src/infrastructure/variables.tf** — Input variable definitions
- **src/infrastructure/outputs.tf** — Output values (e.g., web_url)
- **src/infrastructure/terraform.tfvars.example** — Template for variables

### External Documentation

- **Express.js** — [https://expressjs.com/](https://expressjs.com/)
- **Next.js** — [https://nextjs.org/](https://nextjs.org/)
- **React** — [https://react.dev/](https://react.dev/)
- **PostgreSQL** — [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
- **node-pg-migrate** — [https://salsita.github.io/node-pg-migrate/](https://salsita.github.io/node-pg-migrate/)
- **Terraform** — [https://www.terraform.io/](https://www.terraform.io/)
- **Docker** — [https://docs.docker.com/](https://docs.docker.com/)
- **Google Cloud Platform** — [https://cloud.google.com/docs](https://cloud.google.com/docs)

### GitHub Actions

- **Workflow file** — `.github/workflows/deploy.yml`
- **GitHub Actions docs** — [https://docs.github.com/en/actions](https://docs.github.com/en/actions)

---

## Summary

This document provides a complete reference for the example-three-tier-application repository. For quick answers:

- **"How do I start?"** → See **Quick Start**
- **"How does the app work?"** → See **Overview** and **API Reference**
- **"How do I add a feature?"** → See **Development Workflow** and **Working with AI Agents**
- **"How do I deploy?"** → See **GCP Deployment** and **Deployment & CI/CD**
- **"Something's broken"** → See **Troubleshooting & Common Tasks**

For detailed information on any component, refer to the relevant section or the external documentation links in **References & Resources**.

---

> **Note:** This file was generated with AI assistance.

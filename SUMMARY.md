# example-three-tier-application Summary

## Project Overview and Purpose

**example-three-tier-application** is a reference implementation demonstrating a modern three-tier web application architecture. It showcases best practices for building, containerizing, and deploying a full-stack application that includes a React/Next.js frontend, Express REST API, and PostgreSQL database.

This project serves as an educational resource and template for developers building scalable web applications with clear separation of concerns across presentation, business logic, and data layers. The application is distributed under the MIT License and is available on [GitHub](https://github.com/bflol/example-three-tier-application).

---

## Architecture

### Architecture Diagram

```
Browser → Web (Next.js :3000) → API (Express :3001) → PostgreSQL
```

### Layer Details

| Layer | Technology | Version | Location |
|-------|-----------|---------|----------|
| Frontend | Next.js, React, Tailwind CSS | Next.js 16, React 19, Tailwind CSS 4 | `src/web/` |
| API | Express, Node.js | Express 5, Node.js 22 | `src/api/` |
| Database | PostgreSQL | PostgreSQL 17 | Docker/Cloud SQL |
| Migrations | node-pg-migrate | Latest | `src/db/` |
| Infrastructure | Terraform (GCP) | Terraform 1.5+ | `src/infrastructure/` |

---

## Project Structure

```
example-three-tier-application/
├── src/
│   ├── api/
│   │   ├── index.js                 # Express route handlers
│   │   ├── db.js                    # PostgreSQL connection pool
│   │   ├── Dockerfile               # API container image
│   │   ├── package.json
│   │   └── package-lock.json
│   │
│   ├── db/
│   │   ├── migrations/
│   │   │   ├── 1718500000000_initial-schema.js
│   │   │   └── 1718500001000_create-tasks.js
│   │   ├── Dockerfile               # Migration container image
│   │   ├── package.json
│   │   └── package-lock.json
│   │
│   ├── web/
│   │   ├── app/
│   │   │   ├── page.tsx             # Main React component
│   │   │   ├── actions.ts           # Server actions for API calls
│   │   │   ├── layout.tsx           # App layout
│   │   │   └── ...
│   │   ├── Dockerfile               # Web container image
│   │   ├── package.json
│   │   ├── package-lock.json
│   │   ├── tsconfig.json
│   │   ├── next.config.ts
│   │   ├── postcss.config.mjs
│   │   ├── eslint.config.mjs
│   │   └── ...
│   │
│   └── infrastructure/
│       ├── main.tf                  # Terraform infrastructure definitions
│       ├── variables.tf             # Input variables
│       ├── outputs.tf               # Output values
│       ├── migration.tf             # Database migration job definition
│       └── terraform.tfvars.example # Example tfvars file
│
├── .github/
│   └── workflows/
│       └── deploy.yml               # GitHub Actions CI/CD pipeline
│
├── docker-compose.yml               # Local development orchestration
├── README.md                        # Project README
├── LICENSE                          # MIT License
└── SUMMARY.md                       # This file
```

---

## Local Development

### Prerequisites

- **Docker Desktop** (recommended) or **Docker Engine** with **Compose plugin**
- Git (for cloning the repository)

### Starting the Stack

To start all services locally, run:

```bash
docker compose up --build
```

This command will:

1. Build all Docker images (if not already built)
2. Start the services in dependency order:
   - **postgres** — PostgreSQL 17 database (waits until healthy)
   - **migrate** — Runs migrations automatically, then exits
   - **api** — Express REST API on port 3001 (internal only)
   - **web** — Next.js frontend on port 3000 (exposed to host)

Once all services are running, the application is accessible at:

```
http://localhost:3000
```

### Stopping and Cleanup

Stop containers while keeping data:

```bash
docker compose down
```

Stop containers and delete all data (including database):

```bash
docker compose down -v
```

### Rebuilding After Code Changes

After modifying code, rebuild and restart services:

```bash
docker compose up --build
```

---

## API Endpoints

The Express REST API provides the following endpoints:

### Health Check

```
GET /health
```

Returns the health status of the API service.

### List All Tasks

```
GET /tasks
```

Returns an array of all tasks with their properties (id, title, completed, created_at).

### Create a New Task

```
POST /tasks
Content-Type: application/json

{
  "title": "Task title"
}
```

Creates a new task and returns the created task object.

### Update a Task

```
PATCH /tasks/:id
Content-Type: application/json

{
  "title": "Updated title",
  "completed": true
}
```

Updates a task's `title` and/or `completed` status. Returns the updated task object.

**Note:** The API is not directly exposed to the host by default. To access it directly, you can temporarily map port 3001 in the docker-compose.yml file or access it from within the web container.

---

## Database Migrations

### Location and Tool

Database migrations are located in `src/db/migrations/` and are managed using **node-pg-migrate**, a Node.js-based database migration tool for PostgreSQL.

### Migration Files

The repository includes the following migration files:

- **1718500000000_initial-schema.js** — Creates the base schema and tables
- **1718500001000_create-tasks.js** — Creates the tasks table with columns: id, title, completed, created_at

### Running Migrations Manually

To run migrations manually, set the `DATABASE_URL` environment variable and use node-pg-migrate:

```bash
# Run all pending migrations
DATABASE_URL="postgresql://user:password@localhost:5432/app" npm run migrate up

# Rollback the last migration
DATABASE_URL="postgresql://user:password@localhost:5432/app" npm run migrate down
```

### Automatic Migration on Startup

When using Docker Compose, the **migrate** service automatically runs all pending migrations on startup. This ensures the database schema is always up-to-date before the API starts.

---

## Deploying to GCP

### Infrastructure Overview

The Terraform configuration in `src/infrastructure/` provisions a complete cloud infrastructure on Google Cloud Platform:

- **VPC Network and Subnet** — Private network for secure communication
- **Cloud SQL PostgreSQL 17** — Managed database with private IP
- **Cloud Run Services** — Serverless containers for API and web frontend
- **Secret Manager** — Secure storage for database connection strings
- **Service Accounts and IAM Bindings** — Least-privilege access control

### Required Terraform Variables

Before deploying, configure these variables in `terraform.tfvars`:

| Variable | Description | Example |
|----------|-------------|---------|
| `project_id` | Google Cloud Project ID | `my-project-123` |
| `api_image` | Docker image URI for API | `gcr.io/my-project/api:latest` |
| `web_image` | Docker image URI for web | `gcr.io/my-project/web:latest` |
| `region` | GCP region (default: us-central1) | `us-central1` |
| `environment` | Deployment environment | `dev`, `staging`, or `prod` |

### Deploying Infrastructure

```bash
cd src/infrastructure/

# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Apply infrastructure changes
terraform apply
```

### Accessing the Application

After deployment completes, retrieve the public URL of the web service:

```bash
terraform output web_url
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline is defined in `.github/workflows/deploy.yml` and automates building, testing, and deploying the application.

### Trigger Events

The workflow is triggered by:

- **Push to main branch** — Automatically builds and deploys on commits
- **Manual workflow dispatch** — Can be manually triggered from GitHub Actions UI

### Workflow Jobs

#### 1. Build Job

- Builds Docker images for API, Web, and Database migration services
- Pushes images to Google Container Registry (GCR)
- Tags images with git commit SHA and environment tag

#### 2. Infrastructure Job

- Runs `terraform init` to initialize Terraform state
- Executes `terraform plan` to review infrastructure changes
- Applies infrastructure changes with `terraform apply`
- Deploys to the specified environment (dev, staging, prod)

#### 3. Migrate Job

- Executes database migrations via Cloud Run Job
- Ensures database schema is up-to-date before API starts
- Waits for migration completion before proceeding

### Authentication

The workflow uses **Workload Identity Federation** for secure authentication to Google Cloud Platform, eliminating the need to store long-lived service account keys.

### Environment Support

The pipeline supports multiple deployment environments:

- **dev** — Development environment for testing
- **staging** — Staging environment for pre-production testing
- **prod** — Production environment

---

## Application Features

The example-three-tier-application is a simple **task manager** (to-do list) that demonstrates how the three tiers communicate and interact:

### User Capabilities

1. **View All Tasks** — Display a list of all tasks with their current status
2. **Create New Tasks** — Add new tasks by entering a title
3. **Mark Tasks Complete/Incomplete** — Toggle the completion status of tasks
4. **Update Task Titles** — Edit existing task titles

### Technical Features

- **Dark Mode Support** — The frontend includes Tailwind CSS dark mode classes for a dark theme option
- **Real-time Updates** — Server actions provide instant feedback on task changes
- **Responsive Design** — Works seamlessly on desktop and mobile devices
- **Database Persistence** — All tasks are stored in PostgreSQL and persist across sessions

---

## Technology Stack

### Comprehensive Technology Overview

| Category | Technology | Version |
|----------|-----------|---------|
| **Frontend** | Next.js | 16 |
| | React | 19 |
| | Tailwind CSS | 4 |
| | TypeScript | 5 |
| | ESLint | 9 |
| **Backend** | Express | 5 |
| | Node.js | 22 |
| | pg (PostgreSQL driver) | 8.21.0 |
| **Database** | PostgreSQL | 17 |
| **DevOps** | Docker | Latest |
| | Docker Compose | Latest |
| | Terraform | 1.5+ |
| | Google Cloud Platform | - |
| | - Cloud Run | - |
| | - Cloud SQL | - |
| | - Secret Manager | - |
| | - Container Registry | - |
| **CI/CD** | GitHub Actions | - |
| | Workload Identity Federation | - |

---

## Key Files and Their Purposes

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Orchestrates local development environment with all four services (postgres, migrate, api, web) |
| `src/api/index.js` | Express server configuration and REST API route handlers for tasks |
| `src/api/db.js` | PostgreSQL connection pool initialization and database utilities |
| `src/web/app/page.tsx` | Main React component rendering the task manager UI |
| `src/web/app/actions.ts` | Next.js server actions that call the Express API endpoints |
| `src/infrastructure/main.tf` | Primary Terraform configuration defining GCP resources (Cloud Run, Cloud SQL, VPC, etc.) |
| `src/infrastructure/variables.tf` | Terraform input variables for customizing deployments |
| `src/infrastructure/migration.tf` | Terraform configuration for Cloud Run Job that executes database migrations |
| `.github/workflows/deploy.yml` | GitHub Actions workflow defining the CI/CD pipeline for automated builds and deployments |

---

## Quick Start Guide

Get the application running locally in just a few steps:

### Step 1: Clone the Repository

```bash
git clone https://github.com/bflol/example-three-tier-application.git
cd example-three-tier-application
```

### Step 2: Ensure Docker is Installed

Verify Docker Desktop is installed and running:

```bash
docker --version
docker compose --version
```

### Step 3: Start All Services

From the repository root, run:

```bash
docker compose up --build
```

### Step 4: Wait for Services to Be Healthy

Watch the logs and wait until you see:

```
web_1  | ▲ Next.js 16.x.x
web_1  | ▲ Local:        http://localhost:3000
```

### Step 5: Open the Application

Open your web browser and navigate to:

```
http://localhost:3000
```

### Step 6: Start Using the To-Do List

- **Add a Task:** Enter a task title and click "Add"
- **Complete a Task:** Click the checkbox next to a task to mark it complete
- **Edit a Task:** Click on a task title to edit it
- **Delete a Task:** Click the delete button to remove a task

---

## Development Guidelines

### Frontend Development

To develop the Next.js frontend locally:

```bash
cd src/web/
npm run dev
```

This starts the Next.js development server with hot-reload on port 3000.

### API Development

To develop the Express API locally:

```bash
cd src/api/
npm run dev
```

This starts the Express server with automatic restart on code changes (using nodemon).

### Database Changes

To modify the database schema:

1. Create a new migration file in `src/db/migrations/`:

```bash
cd src/db/
npm run migrate create -- --name "migration-description"
```

2. Edit the generated migration file with your schema changes
3. Run migrations to apply changes locally

### Linting

To check code quality in the frontend:

```bash
cd src/web/
npm run lint
```

This uses ESLint (v9) to identify code style issues and potential bugs.

### Building for Production

To build the Next.js frontend for production:

```bash
cd src/web/
npm run build
```

This creates an optimized production build in the `.next/` directory.

### Testing

Currently, the repository does not include a test suite. However, you can add tests by:

- **Frontend:** Adding Jest and React Testing Library
- **API:** Adding Jest and Supertest for endpoint testing
- **Database:** Adding migration testing with test database instances

---

## Resources and References

### Official Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-pg-migrate Documentation](https://salsita.github.io/node-pg-migrate/)
- [Terraform Google Provider Documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Project Resources

- [Project README](README.md)
- [MIT License](LICENSE)
- [GitHub Repository](https://github.com/bflol/example-three-tier-application)

---

## Additional Notes

This summary serves as a comprehensive reference guide for developers, DevOps engineers, and stakeholders. For the most up-to-date information, always refer to the project's [README.md](README.md) and the individual component documentation within each directory.

For questions, issues, or contributions, please visit the [GitHub repository](https://github.com/bflol/example-three-tier-application).

---

*Last Updated: 2024*
*License: MIT*

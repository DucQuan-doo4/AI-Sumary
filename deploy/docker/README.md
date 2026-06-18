# Docker Compose VM Deployment

This folder contains everything needed to deploy the project to one real VM using Docker Compose.

## What Runs On The VM

- `frontend`: production React build served by Nginx on port `80`
- `backend`: FastAPI running with Uvicorn on internal port `8000`
- `postgres`: PostgreSQL 16 with persistent Docker volume `postgres_data`

The frontend proxies API requests from:

```text
/api/*
```

to:

```text
backend:8000
```

So users only need to open:

```text
http://YOUR_VM_PUBLIC_IP
```

## 1. Prepare Ubuntu VM

Open inbound ports:

- `22` for SSH
- `80` for web

Install Docker:

```bash
chmod +x scripts/install-docker-ubuntu.sh
./scripts/install-docker-ubuntu.sh
```

Then log out and log back in, or run:

```bash
newgrp docker
```

## 2. Put Project On VM

Example:

```bash
git clone <your-repo-url> meeting-ai
cd meeting-ai/deploy/docker
```

If you upload by SCP instead, keep the same folder structure.

## 3. Create Production Env

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Change at least:

```env
POSTGRES_PASSWORD=your-strong-db-password
DATABASE_URL=postgresql://postgres:your-strong-db-password@postgres:5432/meeting_ai
JWT_SECRET_KEY=your-long-random-jwt-secret
DEFAULT_ADMIN_PASSWORD=your-strong-admin-password
BACKEND_CORS_ORIGINS=http://YOUR_VM_PUBLIC_IP
```

Keep:

```env
VITE_API_URL=/api
```

Do not commit `.env.prod`.

## 4. Deploy

```bash
chmod +x scripts/*.sh
./scripts/deploy.sh
```

This command will:

1. Build backend and frontend images
2. Start PostgreSQL, backend, frontend
3. Wait for backend health
4. Run Alembic migrations
5. Seed admin user

Open:

```text
http://YOUR_VM_PUBLIC_IP
```

## 5. Login

Use values from `.env.prod`:

```text
DEFAULT_ADMIN_EMAIL
DEFAULT_ADMIN_PASSWORD
```

## Operations

Status:

```bash
./scripts/status.sh
```

Logs:

```bash
./scripts/logs.sh
./scripts/logs.sh backend
./scripts/logs.sh frontend
./scripts/logs.sh postgres
```

Restart:

```bash
./scripts/restart.sh
```

Stop:

```bash
./scripts/stop.sh
```

Run migration:

```bash
./scripts/migrate.sh
```

Seed admin:

```bash
./scripts/seed-admin.sh
```

Backup PostgreSQL:

```bash
./scripts/backup-postgres.sh
```

Restore PostgreSQL:

```bash
./scripts/restore-postgres.sh backups/meeting_ai-YYYYMMDD-HHMMSS.sql
```

## Mock AI

Default local/VM-safe mode:

```env
AI_PROVIDER=vertexai
USE_MOCK_AI=true
```

This requires no GCP credential.

## Vertex AI Gemini On GCP VM

Set:

```env
AI_PROVIDER=vertexai
USE_MOCK_AI=false
GCP_PROJECT_ID=lyrical-link-498907-a2
GCP_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash
```

Attach a service account to the GCP VM and grant it Vertex AI permissions, for example `Vertex AI User`.

Do not use:

- `GEMINI_API_KEY`
- Google AI Studio API keys
- service account JSON key files
- `GOOGLE_APPLICATION_CREDENTIALS`

## Updating The App

Pull latest code:

```bash
git pull
cd deploy/docker
./scripts/deploy.sh
```

## Troubleshooting

Check containers:

```bash
./scripts/status.sh
```

Check backend logs:

```bash
./scripts/logs.sh backend
```

Check frontend logs:

```bash
./scripts/logs.sh frontend
```

Check API health from the VM:

```bash
curl http://localhost/api/health
```

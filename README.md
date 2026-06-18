# AI Meeting Action Tracking System

AI Meeting Action Tracking System is a modular monolith web application for managing meeting follow-up work with AI support.

Users can create meetings, enter meeting content, run AI analysis, review suggested tasks, edit them, and save confirmed tasks into the system.

## Technologies

Backend:

- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic
- Pydantic
- JWT Auth
- passlib bcrypt
- CORS
- Vertex AI Gemini or mock AI

Frontend:

- ReactJS
- Vite
- React Router
- Axios
- Tailwind CSS
- Recharts

DevOps:

- Docker
- Docker Compose
- Backend Dockerfile
- Frontend production Dockerfile with Nginx
- `.env.example`

Architecture:

- Modular Monolith
- No microservices

## Folder Structure

```text
.
|-- backend/
|   |-- alembic/
|   |-- app/
|   |   |-- ai/
|   |   |-- auth/
|   |   |-- dashboard/
|   |   |-- meetings/
|   |   |-- notifications/
|   |   |-- services/
|   |   |-- tasks/
|   |   |-- users/
|   |   |-- config.py
|   |   |-- database.py
|   |   `-- main.py
|   |-- Dockerfile
|   |-- requirements.txt
|   `-- .env.example
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- layouts/
|   |   `-- pages/
|   |-- Dockerfile
|   |-- nginx.conf
|   |-- package.json
|   `-- .env.example
|-- docker-compose.yml
|-- .env.example
`-- README.md
```

## Local Development

Start backend dependencies:

```powershell
docker compose up -d postgres
```

Run backend locally:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Run frontend locally:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:8000
```

Health check:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

## Docker Compose

For default local Docker usage:

```powershell
docker compose up --build -d
```

Services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

PostgreSQL data is persisted in the named volume:

```text
postgres_data
```

For real local secrets, copy the example file:

```powershell
Copy-Item .env.example .env
```

Then edit `.env`. Do not commit `.env`.

For real VM or Kubernetes deployment, see:

```text
DEPLOYMENT.md
deploy/docker/README.md
deploy/k8s/README.md
GITHUB_ACTIONS_DEPLOY.md
```

## Database Migration

Run migrations:

```powershell
docker compose exec backend alembic upgrade head
```

Check current migration:

```powershell
docker compose exec backend alembic current
```

## Create Admin User

Seed the default admin:

```powershell
docker compose exec backend python -m app.users.seed_admin
```

Default admin from `.env.example`:

```text
email: admin@example.com
password: admin123
role: ADMIN
```

Change these values in `.env` for real environments.

## Main APIs

Auth:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

Meetings:

- `POST /meetings`
- `GET /meetings`
- `GET /meetings/{id}`
- `PUT /meetings/{id}`
- `DELETE /meetings/{id}`
- `POST /meetings/{id}/analyze`

Tasks:

- `POST /tasks`
- `POST /meetings/{id}/tasks/bulk`
- `GET /tasks`
- `GET /tasks/{id}`
- `PUT /tasks/{id}`
- `PATCH /tasks/{id}/status`
- `DELETE /tasks/{id}`

Dashboard:

- `GET /dashboard/overview`
- `GET /dashboard/tasks-by-status`
- `GET /dashboard/tasks-by-user`
- `GET /dashboard/overdue-tasks`
- `GET /dashboard/upcoming-deadlines`

Notifications:

- `GET /notifications`
- `PATCH /notifications/{id}/read`

## System Flow

1. User logs in and receives a JWT access token.
2. Frontend stores the token in `localStorage`.
3. Axios automatically sends `Authorization: Bearer <token>` on API requests.
4. User creates a meeting and enters meeting content.
5. User opens meeting detail and clicks `Analyze with AI`.
6. Backend analyzes meeting content using mock AI or Vertex AI Gemini.
7. Backend saves the generated summary to `meetings.summary`.
8. Backend logs the AI request/response to `ai_logs`.
9. Frontend displays AI suggested tasks as editable preview items.
10. User edits the preview tasks.
11. User clicks `Confirm Save Tasks`.
12. Frontend calls `POST /meetings/{id}/tasks/bulk`.
13. Backend saves confirmed tasks.
14. If a task has `assignee_id`, backend creates a notification for that user.
15. Dashboard and notifications update from backend APIs.

## Mock AI

Mock AI is enabled by default:

```env
AI_PROVIDER=vertexai
USE_MOCK_AI=true
```

This mode is for local testing without GCP credentials. It returns a predictable summary and sample task suggestions.

After changing env values, restart Docker Compose:

```powershell
docker compose up --build -d
```

## Vertex AI Gemini

To use real Gemini analysis through Vertex AI:

1. Copy `.env.example` to `.env`.
2. Set mock AI to false.
3. Configure the GCP project, location, and Gemini model.

Example:

```env
AI_PROVIDER=vertexai
USE_MOCK_AI=false
GCP_PROJECT_ID=lyrical-link-498907-a2
GCP_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash
```

Restart:

```powershell
docker compose up --build -d
```

On a GCP VM, attach a service account to the VM and grant it permission to use Vertex AI, for example `Vertex AI User`.

This project intentionally does not use:

- `GEMINI_API_KEY`
- Google AI Studio API keys
- service account JSON key files
- `GOOGLE_APPLICATION_CREDENTIALS`

The backend uses Application Default Credentials from the VM metadata server through:

```python
genai.Client(vertexai=True, project=GCP_PROJECT_ID, location=GCP_LOCATION)
```

Do not hardcode credentials and do not commit `.env`.

## Frontend Production Build

Build locally:

```powershell
cd frontend
npm.cmd install
npm.cmd run build
```

The Docker production frontend image builds static files with Vite and serves them through Nginx.

## Useful Test Commands

Login:

```powershell
$login = Invoke-RestMethod -Method Post `
  -Uri http://localhost:8000/auth/login `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"admin123"}'

$headers = @{ Authorization = "Bearer $($login.access_token)" }
```

Create a meeting:

```powershell
$meeting = Invoke-RestMethod -Method Post `
  -Uri http://localhost:8000/meetings `
  -Headers $headers `
  -ContentType "application/json" `
  -Body '{"title":"Marketing Q4","content":"Lan prepares brand assets by 2026-06-25. Hung writes blog posts by 2026-07-10.","participant_user_ids":[1]}'
```

Analyze meeting:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8000/meetings/$($meeting.id)/analyze" `
  -Headers $headers
```

Dashboard overview:

```powershell
Invoke-RestMethod `
  -Uri http://localhost:8000/dashboard/overview `
  -Headers $headers
```

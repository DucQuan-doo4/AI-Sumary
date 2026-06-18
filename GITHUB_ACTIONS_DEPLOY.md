# GitHub Actions Docker Compose Deploy

This guide sets up automatic deployment to your VM when code is pushed to `main`.

## 1. Create SSH Key For GitHub Actions

Run on your local machine or Cloud Shell:

```bash
ssh-keygen -t ed25519 -C "github-actions-meeting-ai" -f github-actions-meeting-ai
```

This creates:

```text
github-actions-meeting-ai
github-actions-meeting-ai.pub
```

## 2. Add Public Key To VM

Copy the public key:

```bash
cat github-actions-meeting-ai.pub
```

On the VM, append it to the deploy user's SSH authorized keys:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

The deploy user must be able to run Docker:

```bash
groups
docker ps
```

If Docker permission fails, add the user to the `docker` group using an admin/root account.

## 3. Create GitHub Secrets

Go to:

```text
GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret
```

Create these secrets:

```text
VM_HOST
VM_USER
VM_SSH_PRIVATE_KEY
ENV_PROD_CONTENT
```

Example:

```text
VM_HOST=34.16.14.116
VM_USER=ducquan2213
```

`VM_SSH_PRIVATE_KEY` is the full content of:

```bash
cat github-actions-meeting-ai
```

`ENV_PROD_CONTENT` is the full content of your production env file.

Example:

```env
POSTGRES_DB=meeting_ai
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-db-password

APP_NAME=AI Meeting Action Tracking System
ENVIRONMENT=production
DATABASE_URL=postgresql://postgres:your-db-password@postgres:5432/meeting_ai

JWT_SECRET_KEY=your-long-random-jwt-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
BACKEND_CORS_ORIGINS=http://34.16.14.116

DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=your-admin-password
DEFAULT_ADMIN_FULL_NAME=System Admin

AI_PROVIDER=vertexai
USE_MOCK_AI=false
GCP_PROJECT_ID=lyrical-link-498907-a2
GCP_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash

VITE_API_URL=/api
```

Do not commit real `.env.prod`.

## 4. Run Deployment

Push to `main`:

```bash
git push origin main
```

Or run manually:

```text
GitHub repo -> Actions -> Deploy Docker Compose VM -> Run workflow
```

## 5. Check On VM

```bash
cd ~/meeting-ai/deploy/docker
./scripts/status.sh
./scripts/logs.sh backend
```

Open:

```text
http://VM_HOST
```

# Deployment Guide

This project is ready for two deployment paths:

1. Single VM with Docker Compose
2. Kubernetes or AWS EKS

For your current plan, use Docker Compose on one VM first. It is the fastest and most reliable path for this MVP. Keep the Kubernetes/EKS files as a later scaling path.

## Option 1: VM With Docker Compose

Use:

```text
deploy/docker/
```

Best for:

- MVP launch
- One VM
- Fast setup
- Simple operations

Main files:

- `deploy/docker/docker-compose.prod.yml`
- `deploy/docker/.env.prod.example`
- `deploy/docker/README.md`
- `deploy/docker/scripts/deploy.sh`
- `deploy/docker/scripts/migrate.sh`
- `deploy/docker/scripts/seed-admin.sh`
- `deploy/docker/scripts/logs.sh`
- `deploy/docker/scripts/status.sh`
- `deploy/docker/scripts/backup-postgres.sh`

Quick flow on the VM:

```bash
git clone <your-repo-url>
cd <repo>/deploy/docker
cp .env.prod.example .env.prod
nano .env.prod
chmod +x scripts/*.sh
./scripts/deploy.sh
```

Open:

```text
http://YOUR_VM_PUBLIC_IP
```

## Option 2: Kubernetes/EKS

Use:

```text
deploy/k8s/
```

Best for:

- Existing EKS cluster
- Scaling frontend/backend replicas
- Image registry based releases
- Ingress/load balancer setup

Main files:

- `deploy/k8s/base/*.yaml`
- `deploy/k8s/scripts/build-and-push.sh`
- `deploy/k8s/scripts/deploy.sh`
- `deploy/k8s/scripts/seed-admin.sh`

Quick flow:

```bash
cd deploy/k8s
cp base/02-secret.example.yaml base/02-secret.yaml
nano base/02-secret.yaml
kubectl apply -f base/00-namespace.yaml
kubectl apply -f base/02-secret.yaml
chmod +x scripts/*.sh
./scripts/build-and-push.sh <registry> <tag>
./scripts/deploy.sh <registry> <tag>
./scripts/seed-admin.sh <registry> <tag>
```

## Vertex AI Gemini

Mock mode is default:

```env
AI_PROVIDER=vertexai
USE_MOCK_AI=true
```

For real Vertex AI:

```env
AI_PROVIDER=vertexai
USE_MOCK_AI=false
GCP_PROJECT_ID=lyrical-link-498907-a2
GCP_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash
```

On a GCP VM, attach a service account to the VM and grant it Vertex AI permissions. Do not use service account JSON keys.

On EKS, you need a proper identity setup for Google Application Default Credentials, such as Workload Identity Federation. Do not mount JSON key files into pods.

## Security Checklist

- Change `POSTGRES_PASSWORD`
- Change `JWT_SECRET_KEY`
- Change `DEFAULT_ADMIN_PASSWORD`
- Do not commit `.env`, `.env.prod`, or real Kubernetes secret files
- Do not expose PostgreSQL publicly
- Use HTTPS in production
- Use managed PostgreSQL such as RDS or Cloud SQL for serious production workloads

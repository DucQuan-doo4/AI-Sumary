# Kubernetes/EKS Deployment

Use this path when deploying to Kubernetes or AWS EKS.

## Notes

- For real production, prefer managed PostgreSQL such as AWS RDS instead of the in-cluster Postgres manifest.
- The included Postgres manifest is suitable for MVP/demo deployments.
- Replace `YOUR_REGISTRY` with your image registry, usually AWS ECR for EKS.
- For Vertex AI on GCP, the runtime must have Application Default Credentials. On AWS EKS this usually requires Workload Identity Federation or another approved identity bridge. Do not use JSON key files.

## Prepare Secret

Copy the secret template:

```bash
cp base/02-secret.example.yaml base/02-secret.yaml
```

Edit:

- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `DEFAULT_ADMIN_PASSWORD`

Apply:

```bash
kubectl apply -f base/00-namespace.yaml
kubectl apply -f base/02-secret.yaml
```

## Build And Push Images

Example using ECR:

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

chmod +x scripts/*.sh
./scripts/build-and-push.sh 123456789012.dkr.ecr.us-east-1.amazonaws.com v1
```

## Deploy

```bash
./scripts/deploy.sh 123456789012.dkr.ecr.us-east-1.amazonaws.com v1
```

Check:

```bash
kubectl -n meeting-ai get pods
kubectl -n meeting-ai get svc
kubectl -n meeting-ai logs deploy/backend
```

## Seed Admin

```bash
./scripts/seed-admin.sh 123456789012.dkr.ecr.us-east-1.amazonaws.com v1
```

## Frontend Access

The `frontend` service is `LoadBalancer`:

```bash
kubectl -n meeting-ai get svc frontend
```

Open the external hostname or IP.

## Ingress

If you use an ingress controller, edit:

```text
base/08-ingress.example.yaml
```

Set your real host, then apply:

```bash
kubectl apply -f base/08-ingress.example.yaml
```

## Mock AI

In `base/01-configmap.yaml`:

```yaml
AI_PROVIDER: "vertexai"
USE_MOCK_AI: "true"
```

## Vertex AI Real Mode

Set:

```yaml
AI_PROVIDER: "vertexai"
USE_MOCK_AI: "false"
GCP_PROJECT_ID: "lyrical-link-498907-a2"
GCP_LOCATION: "us-central1"
GEMINI_MODEL: "gemini-2.5-flash"
```

Do not use:

- `GEMINI_API_KEY`
- Google AI Studio API keys
- service account JSON key files
- `GOOGLE_APPLICATION_CREDENTIALS`

#!/usr/bin/env sh
set -eu

if [ $# -ne 2 ]; then
  echo "Usage: $0 <registry> <tag>"
  exit 1
fi

REGISTRY="$1"
TAG="$2"

cd "$(dirname "$0")/.."

TMP_DIR="$(mktemp -d)"
cp base/*.yaml "$TMP_DIR/"

for file in "$TMP_DIR"/*.yaml; do
  sed -i "s|YOUR_REGISTRY/meeting-ai-backend:latest|$REGISTRY/meeting-ai-backend:$TAG|g" "$file"
  sed -i "s|YOUR_REGISTRY/meeting-ai-frontend:latest|$REGISTRY/meeting-ai-frontend:$TAG|g" "$file"
done

kubectl apply -f "$TMP_DIR/00-namespace.yaml"

if ! kubectl -n meeting-ai get secret meeting-ai-secret >/dev/null 2>&1; then
  echo "Missing Kubernetes secret meeting-ai-secret."
  echo "Copy base/02-secret.example.yaml, edit values, then apply it before deploying."
  exit 1
fi

kubectl apply -f "$TMP_DIR/01-configmap.yaml"
kubectl apply -f "$TMP_DIR/03-postgres.yaml"
kubectl apply -f "$TMP_DIR/04-backend.yaml"
kubectl apply -f "$TMP_DIR/05-frontend.yaml"
kubectl delete job -n meeting-ai backend-migrate --ignore-not-found
kubectl apply -f "$TMP_DIR/06-migrate-job.yaml"

echo "Deploy applied. Check status with: kubectl -n meeting-ai get pods,svc,jobs"

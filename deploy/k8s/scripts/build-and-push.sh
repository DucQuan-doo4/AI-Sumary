#!/usr/bin/env sh
set -eu

if [ $# -ne 2 ]; then
  echo "Usage: $0 <registry> <tag>"
  echo "Example: $0 123456789012.dkr.ecr.us-east-1.amazonaws.com v1"
  exit 1
fi

REGISTRY="$1"
TAG="$2"

cd "$(dirname "$0")/../../.."

docker build -t "$REGISTRY/meeting-ai-backend:$TAG" -f backend/Dockerfile backend
docker build -t "$REGISTRY/meeting-ai-frontend:$TAG" --build-arg VITE_API_URL=/api -f frontend/Dockerfile frontend

docker push "$REGISTRY/meeting-ai-backend:$TAG"
docker push "$REGISTRY/meeting-ai-frontend:$TAG"

#!/usr/bin/env sh
set -eu

if [ $# -ne 2 ]; then
  echo "Usage: $0 <registry> <tag>"
  exit 1
fi

REGISTRY="$1"
TAG="$2"

cd "$(dirname "$0")/.."

TMP_FILE="$(mktemp)"
cp base/07-seed-admin-job.yaml "$TMP_FILE"
sed -i "s|YOUR_REGISTRY/meeting-ai-backend:latest|$REGISTRY/meeting-ai-backend:$TAG|g" "$TMP_FILE"

kubectl delete job -n meeting-ai seed-admin --ignore-not-found
kubectl apply -f "$TMP_FILE"

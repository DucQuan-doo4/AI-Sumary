#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."
SERVICE="${1:-}"

if [ -n "$SERVICE" ]; then
  docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f "$SERVICE"
else
  docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f
fi

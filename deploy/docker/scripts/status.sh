#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."
docker compose --env-file .env.prod -f docker-compose.prod.yml ps

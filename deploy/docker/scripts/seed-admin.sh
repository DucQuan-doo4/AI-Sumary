#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."
docker compose --env-file .env.prod -f docker-compose.prod.yml exec backend python -m app.users.seed_admin

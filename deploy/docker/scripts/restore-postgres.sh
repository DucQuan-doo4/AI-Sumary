#!/usr/bin/env sh
set -eu

if [ $# -ne 1 ]; then
  echo "Usage: $0 <backup-file.sql>"
  exit 1
fi

cd "$(dirname "$0")/.."

BACKUP_FILE="$1"
POSTGRES_USER="$(grep '^POSTGRES_USER=' .env.prod | cut -d '=' -f2-)"
POSTGRES_DB="$(grep '^POSTGRES_DB=' .env.prod | cut -d '=' -f2-)"

docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T postgres \
  psql -U "$POSTGRES_USER" "$POSTGRES_DB" < "$BACKUP_FILE"

echo "Restore complete."

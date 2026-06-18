#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/meeting_ai-$TIMESTAMP.sql"

POSTGRES_USER="$(grep '^POSTGRES_USER=' .env.prod | cut -d '=' -f2-)"
POSTGRES_DB="$(grep '^POSTGRES_DB=' .env.prod | cut -d '=' -f2-)"

docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"

echo "Backup saved: $BACKUP_FILE"

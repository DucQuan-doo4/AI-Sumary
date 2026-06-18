#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

if [ ! -f .env.prod ]; then
  echo "Missing deploy/docker/.env.prod. Copy .env.prod.example to .env.prod and edit secrets first."
  exit 1
fi

docker compose --env-file .env.prod -f docker-compose.prod.yml up --build -d

echo "Waiting for backend health check..."
for i in $(seq 1 30); do
  if docker compose --env-file .env.prod -f docker-compose.prod.yml exec backend python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')" >/dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Backend did not become healthy in time."
    docker compose --env-file .env.prod -f docker-compose.prod.yml logs backend
    exit 1
  fi
  sleep 2
done

docker compose --env-file .env.prod -f docker-compose.prod.yml exec backend alembic upgrade head
docker compose --env-file .env.prod -f docker-compose.prod.yml exec backend python -m app.users.seed_admin

echo "Deployment complete."
echo "Open: http://YOUR_VM_PUBLIC_IP"

#!/usr/bin/env sh
set -eu
docker compose build
docker compose run --rm app npx prisma migrate deploy
docker compose run --rm app npx prisma db seed
docker compose up -d
./scripts/health-check.sh

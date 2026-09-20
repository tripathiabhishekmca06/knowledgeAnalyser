#!/usr/bin/env sh
set -eu
BASE_URL="${APP_BASE_URL:-http://localhost:3000}"
curl -fsS "$BASE_URL/health/live" >/dev/null
curl -fsS "$BASE_URL/health/ready" >/dev/null
echo "Readiness health checks passed"

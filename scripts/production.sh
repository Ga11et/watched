#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

compose() {
  docker compose -p watched-production -f "$ROOT_DIR/compose.production.yml" "$@"
}

require_env_file() {
  if [[ ! -f "$ROOT_DIR/.env.production.local" ]]; then
    echo "Create .env.production.local from .env.production.example and set POSTGRES_PASSWORD and JWT_SECRET." >&2
    exit 1
  fi
}

require_local_images() {
  if ! docker image inspect watched-api:local >/dev/null 2>&1; then
    echo "Missing watched-api:local. Run pnpm prod:build first." >&2
    exit 1
  fi
  if ! docker image inspect postgres:16-alpine >/dev/null 2>&1; then
    echo "Missing postgres:16-alpine. Run docker pull postgres:16-alpine first." >&2
    exit 1
  fi
}

case "${1:-}" in
  build)
    docker build \
      -f "$ROOT_DIR/Dockerfile.api" \
      -t watched-api:local \
      "$ROOT_DIR"
    ;;
  migrate)
    require_env_file
    require_local_images
    compose up -d --no-build --pull never \
      --wait --wait-timeout 60 db
    compose run --rm --no-deps --pull never api \
      node node_modules/typeorm/cli.js migration:run \
      -d dist/database/data-source.js
    ;;
  start)
    require_env_file
    require_local_images
    if ! compose up -d --no-build --pull never \
      --wait --wait-timeout 60; then
      compose logs --tail 20 api
      exit 1
    fi
    ;;
  stop)
    require_env_file
    compose stop
    ;;
  *)
    echo "Usage: bash scripts/production.sh {build|migrate|start|stop}" >&2
    exit 1
    ;;
esac

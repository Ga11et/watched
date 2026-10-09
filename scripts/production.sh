#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

compose() {
  docker compose -p watched-production -f "$ROOT_DIR/compose.production.yml" "$@"
}

require_env_file() {
  for file in .env.production.api.local .env.production.client.local; do
    if [[ ! -f "$ROOT_DIR/$file" ]]; then
      echo "Create $file from ${file%.local}.example before running production services." >&2
      exit 1
    fi
  done
}

require_local_images() {
  for image in "$@"; do
    if ! docker image inspect "$image" >/dev/null 2>&1; then
      echo "Missing $image. Run pnpm prod:build first." >&2
      exit 1
    fi
  done
}

case "${1:-}" in
  build)
    for service in api client; do
      docker build \
        -f "$ROOT_DIR/Dockerfile.$service" \
        -t "watched-$service:local" \
        "$ROOT_DIR"
    done
    if ! docker image inspect postgres:16-alpine >/dev/null 2>&1; then
      docker pull postgres:16-alpine
    fi
    ;;
  migrate)
    require_env_file
    require_local_images watched-api:local postgres:16-alpine
    compose up -d --no-build --pull never \
      --wait --wait-timeout 60 db
    compose run --rm --no-deps --pull never api \
      node node_modules/typeorm/cli.js migration:run \
      -d dist/database/data-source.js
    ;;
  start)
    require_env_file
    require_local_images watched-api:local watched-client:local postgres:16-alpine
    if ! compose up -d --no-build --pull never \
      --wait --wait-timeout 60; then
      compose logs --tail 20 api client
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

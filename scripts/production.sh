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
      echo "Missing $image. Run: bash \"$ROOT_DIR/scripts/production.sh\" build" >&2
      exit 1
    fi
  done
}

stop_stack() {
  local status=$?
  trap - EXIT INT TERM
  if [[ -n "${compose_pid:-}" ]]; then
    kill "$compose_pid" 2>/dev/null || true
    wait "$compose_pid" 2>/dev/null || true
  fi
  compose stop || status=1
  exit "$status"
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
    compose config --quiet
    trap stop_stack EXIT
    trap 'exit 130' INT
    trap 'exit 143' TERM
    compose up -d --no-build --pull never \
      --wait --wait-timeout 60 &
    compose_pid=$!
    if ! wait "$compose_pid"; then
      compose_pid=
      echo "Production startup failed. Check required values in .env.production.api.local and .env.production.client.local." >&2
      echo "If migrations are missing or pending, run: bash \"$ROOT_DIR/scripts/production.sh\" migrate" >&2
      compose ps --all || true
      compose logs --tail 50 || true
      exit 1
    fi
    compose_pid=
    printf 'Frontend: http://127.0.0.1:33000\nAPI: http://127.0.0.1:33010\nSwagger: http://127.0.0.1:33010/api\nPress Ctrl+C to stop the production stack.\n'
    compose logs --follow --tail 50 &
    compose_pid=$!
    wait "$compose_pid"
    compose_pid=
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

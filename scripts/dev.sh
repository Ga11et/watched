#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

compose() {
  docker compose -p watched-development -f "$ROOT_DIR/compose.development.yml" "$@"
}

require_env_file() {
  for file in .env.development.api.local .env.development.client.local; do
    if [[ ! -f "$ROOT_DIR/$file" ]]; then
      echo "Create $file from ${file%.local}.example before running the development stack." >&2
      exit 1
    fi
  done
}

stop_dev() {
  local status=$?
  trap - EXIT INT TERM
  if [[ -n "${compose_pid:-}" ]]; then
    kill "$compose_pid" 2>/dev/null || true
    wait "$compose_pid" 2>/dev/null || true
  fi
  compose stop || status=1
  exit "$status"
}

run_migrations() {
  compose run --rm --no-deps api pnpm exec typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts
}

stop_db_if_was_down() {
  local status=$?
  trap - EXIT
  if [[ "$db_was_running" -eq 0 ]]; then
    compose stop db || status=1
  fi
  exit "$status"
}

case "${1:-}" in
  start)
    require_env_file
    compose config --quiet
    trap stop_dev EXIT
    trap 'exit 130' INT
    trap 'exit 143' TERM
    compose build api client
    compose up -d --wait --wait-timeout 60 db
    run_migrations
    # Refresh package symlinks to match the pnpm store in the rebuilt images.
    compose up -d --renew-anon-volumes --wait --wait-timeout 180 api client &
    compose_pid=$!
    if ! wait "$compose_pid"; then
      compose_pid=
      echo "Development startup failed." >&2
      compose ps --all || true
      compose logs --tail 50 || true
      exit 1
    fi
    compose_pid=
    printf 'Frontend: http://127.0.0.1:33000\nAPI: http://127.0.0.1:33010\nSwagger: http://127.0.0.1:33010/api\nPress Ctrl+C to stop the development stack.\n'
    compose logs --follow --tail 50 &
    compose_pid=$!
    wait "$compose_pid"
    compose_pid=
    ;;
  migrate)
    require_env_file
    db_was_running=0
    [[ -n "$(compose ps --status running --quiet db)" ]] && db_was_running=1
    trap stop_db_if_was_down EXIT
    compose up -d --wait --wait-timeout 60 db
    compose build api
    run_migrations
    ;;
  stop)
    compose stop
    ;;
  *)
    echo "Usage: bash scripts/dev.sh {start|migrate|stop}" >&2
    exit 1
    ;;
esac

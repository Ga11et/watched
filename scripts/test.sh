#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

compose() {
  docker compose -p watched-test -f "$ROOT_DIR/compose.test.yml" "$@"
}

cleanup_test() {
  local status=$?
  trap - EXIT INT TERM
  compose down -v || status=1
  exit "$status"
}

trap cleanup_test EXIT INT TERM

if [[ "${1:-}" == "--" ]]; then
  shift
fi

compose build api
compose run --rm api pnpm test:e2e "$@"

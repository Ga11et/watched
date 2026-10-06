#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${1:-watched_postgres}"
DB_NAME="${2:-watched}"
DB_USER="${3:-watched}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${4:-$SCRIPT_DIR/../backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTPUT_FILE="$OUTPUT_DIR/${DB_NAME}_${TIMESTAMP}.sql"

mkdir -p "$OUTPUT_DIR"

docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$OUTPUT_FILE"

echo "Dump created: $OUTPUT_FILE"

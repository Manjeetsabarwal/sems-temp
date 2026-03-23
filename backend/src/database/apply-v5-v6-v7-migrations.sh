#!/bin/bash
# Apply migrations in order: v4 (Coaching), v5 (Financial), v6 (Broadcast), v7 (Report Card Templates).
# Safe to re-run: uses IF NOT EXISTS / ON CONFLICT DO NOTHING.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${DATABASE_NAME:-school_exam_db}"
DB_USER="${DATABASE_USER:-postgres}"

if [ -z "$DATABASE_PASSWORD" ]; then
  echo "Please set DATABASE_PASSWORD (or create .env in backend with DATABASE_PASSWORD=...)"
  exit 1
fi

export PGPASSWORD="$DATABASE_PASSWORD"

echo "Applying v4 (Coaching Management)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/v4-coaching-management.sql"
echo "v4 OK."

echo "Applying v5 (Financial Management)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/v5-financial-management.sql"
echo "v5 OK."

echo "Applying v6 (Broadcast)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/v6-broadcast.sql"
echo "v6 OK."

echo "Applying v7 (Report Card Templates)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/v7-report-card-templates.sql"
echo "v7 OK."

echo "All migrations (v4, v5, v6, v7) applied successfully."

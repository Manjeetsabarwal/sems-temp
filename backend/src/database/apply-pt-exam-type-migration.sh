#!/bin/bash

# Script to apply the PT exam type migration
# This adds 'PT' (Periodic Test) to the allowed exam types

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-school_exam_db}"
DB_USER="${DB_USER:-postgres}"

echo "🔄 Applying PT exam type migration..."
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Check if password is set
if [ -z "$DB_PASSWORD" ]; then
  echo "⚠️  DB_PASSWORD not set in .env, will prompt for password"
  PGPASSWORD_OPTION=""
else
  export PGPASSWORD="$DB_PASSWORD"
  PGPASSWORD_OPTION=""
fi

# Apply migration
psql $PGPASSWORD_OPTION -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/add-pt-exam-type-migration.sql"

echo ""
echo "✅ Migration applied successfully!"
echo "   'PT' (Periodic Test) is now available as an exam type."

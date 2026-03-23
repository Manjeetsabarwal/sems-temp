#!/bin/bash
# Apply V8 License table migration (Razorpay + PayU)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_USER="${DATABASE_USER:-postgres}"
DB_NAME="${DATABASE_NAME:-school_exam_db}"
export PGPASSWORD="${DATABASE_PASSWORD:-postgres}"

echo "Applying V8 License migration..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/v8-license.sql"
if [ $? -eq 0 ]; then
  echo "V8 License migration applied successfully."
else
  echo "V8 License migration failed."
  exit 1
fi

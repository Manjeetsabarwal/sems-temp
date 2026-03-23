#!/bin/bash

# Script to apply the student fields optional migration
# This makes class_id, section_id, and roll_no nullable and adds exam_registration_fees

echo "Applying student fields optional migration..."

# Read database connection details from .env or use defaults
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-school_exam_db}"
DB_USER="${DB_USER:-postgres}"

# Check if password is provided
if [ -z "$DB_PASSWORD" ]; then
    echo "Please set DB_PASSWORD environment variable or use .env file"
    echo "Example: export DB_PASSWORD=your_password"
    exit 1
fi

# Apply the migration
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$(dirname "$0")/make-student-fields-optional.sql"

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi

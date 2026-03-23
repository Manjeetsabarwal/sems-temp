#!/bin/bash

# Script to apply the student_habits table migration (Version 3)
# This creates the student_habits table for Template 3 Report Cards

echo "Applying Student Habits Migration (Version 3)..."

# Read database connection details from .env or use defaults
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${DATABASE_NAME:-school_exam_db}"
DB_USER="${DATABASE_USER:-postgres}"

# Check if password is provided
if [ -z "$DATABASE_PASSWORD" ]; then
    echo "Please set DATABASE_PASSWORD environment variable or use .env file"
    echo "Example: export DATABASE_PASSWORD=your_password"
    echo "Or create a .env file in the backend directory with DATABASE_PASSWORD=your_password"
    exit 1
fi

# Apply the migration
PGPASSWORD=$DATABASE_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$(dirname "$0")/v3-create-student-habits-table.sql"

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo "✅ student_habits table created"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi

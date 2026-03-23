# Database Migration Instructions - Internal/External Marks (Version 2)

## Issue
If you're seeing a 500 error when fetching marks, it's because the database migration hasn't been run yet. The new columns for internal/external marks don't exist in the database.

## Solution

### Option 1: Run Migration via SQL (Recommended)

1. Connect to your PostgreSQL database:
```bash
psql -h localhost -U postgres -d school_exam_db
```

2. Run the migration:
```sql
\i backend/src/database/add-internal-external-marks-migration.sql
```

Or copy and paste the contents of `backend/src/database/add-internal-external-marks-migration.sql` into your psql session.

### Option 2: Run Migration via Script

```bash
cd backend/src/database
./run-migration.sh
```

Make sure to set your database environment variables:
- `DB_HOST` (default: localhost)
- `DB_PORT` (default: 5432)
- `DB_NAME` (default: school_exam_db)
- `DB_USER` (default: postgres)
- `DB_PASSWORD` (default: postgres)

### Option 3: Manual SQL Execution

If you're using a database GUI tool (pgAdmin, DBeaver, etc.), open the file:
`backend/src/database/add-internal-external-marks-migration.sql`

And execute it against your database.

## What the Migration Does

The migration adds the following columns to the `marks` table:
- `internal_marks` - Internal marks out of 20
- `external_marks` - External marks out of 80
- `unit_test_marks` - Unit test marks out of 10
- `assignment_marks` - Assignment marks out of 5
- `attendance_marks` - Attendance marks out of 5
- `marks_type` - Type of marks ('Unit Test' or 'Final')

## Verification

After running the migration, verify it worked:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'marks' 
AND column_name IN ('internal_marks', 'external_marks', 'unit_test_marks', 'assignment_marks', 'attendance_marks', 'marks_type');
```

You should see all 6 columns listed.

## Note

The entity has been updated to handle missing columns gracefully (using `select: false`), but for full functionality, the migration must be run.

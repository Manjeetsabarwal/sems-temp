-- =====================================================
-- Fix Duplicate Students Table Issue
-- =====================================================
-- This script consolidates the duplicate 'students' and 'students_2fbe5237' tables
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query

-- Step 1: Backup existing data (optional but recommended)
-- Uncomment if you want to create a backup first
-- CREATE TABLE students_backup AS SELECT * FROM students;
-- CREATE TABLE students_2fbe5237_backup AS SELECT * FROM students_2fbe5237;

-- Step 2: Ensure students_2fbe5237 table exists with correct schema
CREATE TABLE IF NOT EXISTS students_2fbe5237 (
  studentid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  classid TEXT,
  sectionid TEXT,
  rollno INTEGER NOT NULL,
  dateofbirth TEXT,
  gender TEXT,
  email TEXT,
  phone TEXT,
  parentname TEXT,
  parentphone TEXT,
  parentcontact TEXT,
  parentemail TEXT,
  address TEXT,
  status TEXT DEFAULT 'Active',
  avatar TEXT,
  createdat TIMESTAMP DEFAULT NOW(),
  updatedat TIMESTAMP DEFAULT NOW(),
  CONSTRAINT students_2fbe5237_classid_sectionid_rollno_key UNIQUE (classid, sectionid, rollno)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_2fbe5237_classid ON students_2fbe5237(classid);
CREATE INDEX IF NOT EXISTS idx_students_2fbe5237_sectionid ON students_2fbe5237(sectionid);
CREATE INDEX IF NOT EXISTS idx_students_2fbe5237_name ON students_2fbe5237(name);
CREATE INDEX IF NOT EXISTS idx_students_2fbe5237_status ON students_2fbe5237(status);

-- Step 4: Migrate data from old 'students' table if it exists
-- This will copy data only if the old table exists and has a different schema
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'students'
  ) THEN
    -- Copy data from old table to new table (handle both schema formats)
    -- Try snake_case columns first (student_id, class_id, etc.)
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'students' AND column_name = 'student_id'
    ) THEN
      INSERT INTO students_2fbe5237 (
        studentid, name, classid, sectionid, rollno, 
        dateofbirth, gender, email, phone,
        parentname, parentphone, parentcontact, parentemail,
        address, status, avatar, createdat, updatedat
      )
      SELECT 
        student_id, name, class_id, section_id, roll_no,
        date_of_birth, gender, email, phone,
        parent_name, parent_phone, parent_contact, parent_email,
        address, COALESCE(status, 'Active'), avatar, 
        COALESCE(created_at, NOW()), COALESCE(updated_at, NOW())
      FROM students
      ON CONFLICT (studentid) DO UPDATE SET
        name = EXCLUDED.name,
        classid = EXCLUDED.classid,
        sectionid = EXCLUDED.sectionid,
        rollno = EXCLUDED.rollno,
        updatedat = NOW();
      
      RAISE NOTICE 'Data migrated from students (snake_case schema)';
    
    -- Try lowercase columns (studentid, classid, etc.)
    ELSIF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'students' AND column_name = 'studentid'
    ) THEN
      INSERT INTO students_2fbe5237 
      SELECT * FROM students
      ON CONFLICT (studentid) DO UPDATE SET
        name = EXCLUDED.name,
        classid = EXCLUDED.classid,
        sectionid = EXCLUDED.sectionid,
        rollno = EXCLUDED.rollno,
        updatedat = NOW();
      
      RAISE NOTICE 'Data migrated from students (lowercase schema)';
    END IF;
  END IF;
END $$;

-- Step 5: Add foreign key constraints (reference the tables without suffix)
-- These may fail if classes/sections tables don't exist - that's OK
DO $$
BEGIN
  -- Add foreign key to classes if the table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'classes') THEN
    ALTER TABLE students_2fbe5237
      DROP CONSTRAINT IF EXISTS students_2fbe5237_classid_fkey;
    
    ALTER TABLE students_2fbe5237
      ADD CONSTRAINT students_2fbe5237_classid_fkey 
      FOREIGN KEY (classid) REFERENCES classes(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added foreign key constraint to classes table';
  END IF;

  -- Add foreign key to sections if the table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sections') THEN
    ALTER TABLE students_2fbe5237
      DROP CONSTRAINT IF EXISTS students_2fbe5237_sectionid_fkey;
    
    ALTER TABLE students_2fbe5237
      ADD CONSTRAINT students_2fbe5237_sectionid_fkey 
      FOREIGN KEY (sectionid) REFERENCES sections(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added foreign key constraint to sections table';
  END IF;
END $$;

-- Step 6: Drop the old duplicate 'students' table
-- IMPORTANT: Only uncomment this after you've verified the data migration was successful!
-- DROP TABLE IF EXISTS students CASCADE;

-- Step 7: Verify the migration
SELECT 
  'students_2fbe5237' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT classid) as unique_classes,
  COUNT(DISTINCT sectionid) as unique_sections
FROM students_2fbe5237;

-- Display sample data to verify
SELECT studentid, name, classid, sectionid, rollno, status 
FROM students_2fbe5237 
ORDER BY classid, sectionid, rollno 
LIMIT 10;

-- =====================================================
-- AFTER RUNNING THIS SCRIPT:
-- =====================================================
-- 1. Verify the row counts and sample data above
-- 2. If everything looks good, uncomment Step 6 and run again to drop old table
-- 3. Test your application thoroughly
-- 4. Delete the backup tables if you created them: 
--    DROP TABLE IF EXISTS students_backup;
--    DROP TABLE IF EXISTS students_2fbe5237_backup;
-- =====================================================

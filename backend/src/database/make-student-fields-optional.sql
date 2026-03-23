-- ============================================
-- Migration: Make class_id, section_id, roll_no optional
-- Add exam_registration_fees field
-- ============================================

-- Step 1: Drop the existing unique constraint
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_class_id_section_id_roll_no_key;
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_class_id_section_id_roll_no_unique;

-- Step 2: Make class_id, section_id, and roll_no nullable
ALTER TABLE students ALTER COLUMN class_id DROP NOT NULL;
ALTER TABLE students ALTER COLUMN section_id DROP NOT NULL;
ALTER TABLE students ALTER COLUMN roll_no DROP NOT NULL;

-- Step 3: Update foreign key constraints to allow NULL
-- (PostgreSQL foreign keys already allow NULL by default, but we ensure it)
ALTER TABLE students 
  DROP CONSTRAINT IF EXISTS fk_students_class,
  DROP CONSTRAINT IF EXISTS students_class_id_fkey,
  DROP CONSTRAINT IF EXISTS fk_students_section,
  DROP CONSTRAINT IF EXISTS students_section_id_fkey;

ALTER TABLE students 
  ADD CONSTRAINT fk_students_class FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_students_section FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE SET NULL;

-- Step 4: Add exam_registration_fees column
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS exam_registration_fees DECIMAL(10, 2);

-- Step 5: Create a partial unique constraint (only when all three fields are provided)
-- This ensures uniqueness only when class_id, section_id, and roll_no are all NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS students_class_section_roll_unique 
  ON students (class_id, section_id, roll_no) 
  WHERE class_id IS NOT NULL AND section_id IS NOT NULL AND roll_no IS NOT NULL;

-- Step 6: Update existing NULL values to be properly NULL (if any were set to empty strings)
UPDATE students 
SET class_id = NULL 
WHERE class_id = '';

UPDATE students 
SET section_id = NULL 
WHERE section_id = '';

UPDATE students 
SET roll_no = NULL 
WHERE roll_no = 0 OR roll_no IS NULL;

-- ============================================
-- Verification
-- ============================================
-- Run these queries to verify:
-- SELECT column_name, is_nullable, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'students' 
-- AND column_name IN ('class_id', 'section_id', 'roll_no', 'exam_registration_fees');

-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'students';

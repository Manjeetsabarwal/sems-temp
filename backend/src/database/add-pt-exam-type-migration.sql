-- Migration: Add 'PT' (Periodic Test) to exam_type CHECK constraint
-- This allows exams to have 'PT' as an exam type in addition to existing types

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE exams DROP CONSTRAINT IF EXISTS exams_exam_type_check;

-- Step 2: Add the new CHECK constraint with 'PT' included
ALTER TABLE exams ADD CONSTRAINT exams_exam_type_check 
  CHECK (exam_type IN ('Mid-Term', 'Final', 'Unit Test', 'Quarterly', 'Half-Yearly', 'Annual', 'PT'));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'exams'::regclass 
  AND conname = 'exams_exam_type_check';

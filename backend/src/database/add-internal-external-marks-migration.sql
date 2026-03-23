-- Migration: Add Internal/External Marks Support (Version 2)
-- This migration adds support for internal (20 marks) and external (80 marks) breakdown
-- Internal: Unit Test (10) + Assignment (5) + Attendance (5) = 20 marks
-- External: Final Exam = 80 marks
-- Total: 100 marks per subject

-- Add new columns to marks table
ALTER TABLE marks 
  ADD COLUMN IF NOT EXISTS internal_marks NUMERIC(5,2) DEFAULT 0 CHECK (internal_marks >= 0),
  ADD COLUMN IF NOT EXISTS external_marks NUMERIC(5,2) DEFAULT 0 CHECK (external_marks >= 0),
  ADD COLUMN IF NOT EXISTS unit_test_marks NUMERIC(5,2) DEFAULT 0 CHECK (unit_test_marks >= 0 AND unit_test_marks <= 10),
  ADD COLUMN IF NOT EXISTS assignment_marks NUMERIC(5,2) DEFAULT 0 CHECK (assignment_marks >= 0 AND assignment_marks <= 5),
  ADD COLUMN IF NOT EXISTS attendance_marks NUMERIC(5,2) DEFAULT 0 CHECK (attendance_marks >= 0 AND attendance_marks <= 5),
  ADD COLUMN IF NOT EXISTS marks_type TEXT DEFAULT 'Final';

-- Ensure marks_type has the expected allowed values (supports Template 1/2/3 + Mid-Term)
ALTER TABLE marks
  DROP CONSTRAINT IF EXISTS marks_marks_type_check;

ALTER TABLE marks
  ADD CONSTRAINT marks_marks_type_check
  CHECK (marks_type IN ('Unit Test', 'Final', 'Mid-Term', 'Periodic Test', 'Notebook', 'Subject Enrichment'));

-- Update existing marks: if marks_type is 'Final', set external_marks = marks_obtained (scaled to 80)
-- and internal_marks = 0 (will be calculated from unit tests later)
UPDATE marks 
SET 
  external_marks = CASE 
    WHEN marks_type = 'Final' THEN (marks_obtained / total_marks) * 80
    ELSE 0
  END,
  internal_marks = 0,
  marks_type = 'Final'
WHERE marks_type IS NULL OR marks_type = 'Final';

-- Add constraint: internal + external should not exceed total_marks
ALTER TABLE marks 
  ADD CONSTRAINT check_marks_breakdown 
  CHECK (internal_marks + external_marks <= total_marks);

-- Add index for marks_type for faster queries
CREATE INDEX IF NOT EXISTS idx_marks_type ON marks(marks_type);
CREATE INDEX IF NOT EXISTS idx_marks_student_subject ON marks(student_id, subject_id);

-- Add comment
COMMENT ON COLUMN marks.internal_marks IS 'Internal marks out of 20 (Unit Test 10 + Assignment 5 + Attendance 5)';
COMMENT ON COLUMN marks.external_marks IS 'External marks out of 80 (Final Exam scaled from 100)';
COMMENT ON COLUMN marks.unit_test_marks IS 'Unit test marks out of 10 (calculated from average/highest of all unit tests)';
COMMENT ON COLUMN marks.assignment_marks IS 'Assignment/Project marks out of 5';
COMMENT ON COLUMN marks.attendance_marks IS 'Attendance/Participation marks out of 5';
COMMENT ON COLUMN marks.marks_type IS 'Type of marks: Unit Test or Final';

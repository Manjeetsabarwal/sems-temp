-- ============================================
-- VERSION 3: EXAM PAPER MODULE - STEP 5
-- Migration: Create student_attempt table
-- Date: 2024
-- ============================================
-- This migration adds support for student exam attempts
-- Tracks when students start, submit, and complete online exams
-- ============================================

-- Create student_attempt table
CREATE TABLE IF NOT EXISTS student_attempt (
  attempt_id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  paper_id TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMP, -- NULL if not yet submitted
  completed_at TIMESTAMP, -- NULL if not yet completed/evaluated
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'EVALUATED', 'ABANDONED')),
  time_spent_minutes INTEGER DEFAULT 0, -- Total time spent on exam
  total_marks_obtained NUMERIC(5,2) DEFAULT 0, -- Calculated after evaluation
  total_marks_available NUMERIC(5,2), -- Total marks for the paper
  percentage NUMERIC(5,2), -- Calculated percentage
  is_passed BOOLEAN, -- Pass/fail status (calculated from paper rules)
  auto_submitted BOOLEAN DEFAULT false, -- True if auto-submitted due to time limit
  ip_address TEXT, -- For security/audit
  user_agent TEXT, -- Browser/device info
  meta JSONB DEFAULT '{}'::jsonb, -- Flexible storage for additional data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_attempt_student FOREIGN KEY (student_id) 
    REFERENCES students(student_id) ON DELETE CASCADE,
  CONSTRAINT fk_attempt_paper FOREIGN KEY (paper_id) 
    REFERENCES exam_paper(paper_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attempt_student_id ON student_attempt(student_id);
CREATE INDEX IF NOT EXISTS idx_attempt_paper_id ON student_attempt(paper_id);
CREATE INDEX IF NOT EXISTS idx_attempt_status ON student_attempt(status);
CREATE INDEX IF NOT EXISTS idx_attempt_student_paper ON student_attempt(student_id, paper_id);
CREATE INDEX IF NOT EXISTS idx_attempt_started_at ON student_attempt(started_at);
CREATE INDEX IF NOT EXISTS idx_attempt_submitted_at ON student_attempt(submitted_at) WHERE submitted_at IS NOT NULL;

-- Partial unique index: Ensure one active attempt per student per paper
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_paper_active_unique 
  ON student_attempt(student_id, paper_id) 
  WHERE status = 'IN_PROGRESS';

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_student_attempt_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_student_attempt_timestamp ON student_attempt;
CREATE TRIGGER trigger_update_student_attempt_timestamp
  BEFORE UPDATE ON student_attempt
  FOR EACH ROW
  EXECUTE FUNCTION update_student_attempt_timestamp();

-- Add comments
COMMENT ON TABLE student_attempt IS 'Version 3: Student attempts for online exam papers';
COMMENT ON COLUMN student_attempt.status IS 'IN_PROGRESS: Currently taking exam, SUBMITTED: Submitted but not evaluated, EVALUATED: Fully evaluated, ABANDONED: Left without submitting';
COMMENT ON COLUMN student_attempt.auto_submitted IS 'True if exam was auto-submitted when time limit was reached';
COMMENT ON COLUMN student_attempt.time_spent_minutes IS 'Total time spent on exam in minutes';

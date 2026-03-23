-- ============================================
-- VERSION 3: EXAM PAPER MODULE - STEP 6
-- Migration: Create student_response table
-- Date: 2024
-- ============================================
-- This migration adds support for student responses to questions
-- Stores answers for both MCQ and Theory/Descriptive questions
-- ============================================

-- Create student_response table
CREATE TABLE IF NOT EXISTS student_response (
  response_id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_option_id TEXT, -- For MCQ: which option was selected
  answer_text TEXT, -- For Theory/Descriptive: text answer
  answer_image_url TEXT, -- Optional: image answer
  marks_awarded NUMERIC(5,2) DEFAULT 0, -- Marks given for this answer
  is_correct BOOLEAN, -- For MCQ: true if correct option selected
  is_evaluated BOOLEAN DEFAULT false, -- Whether this response has been evaluated
  evaluated_by TEXT, -- User ID who evaluated (for manual evaluation)
  evaluated_at TIMESTAMP, -- When evaluation was done
  feedback TEXT, -- Optional feedback from evaluator
  time_spent_seconds INTEGER DEFAULT 0, -- Time spent on this question
  meta JSONB DEFAULT '{}'::jsonb, -- Flexible storage for additional data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_response_attempt FOREIGN KEY (attempt_id) 
    REFERENCES student_attempt(attempt_id) ON DELETE CASCADE,
  CONSTRAINT fk_response_question FOREIGN KEY (question_id) 
    REFERENCES question(question_id) ON DELETE CASCADE,
  CONSTRAINT fk_response_option FOREIGN KEY (selected_option_id) 
    REFERENCES question_option(option_id) ON DELETE SET NULL,
  
  -- Ensure one response per question per attempt
  CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_response_attempt_id ON student_response(attempt_id);
CREATE INDEX IF NOT EXISTS idx_response_question_id ON student_response(question_id);
CREATE INDEX IF NOT EXISTS idx_response_option_id ON student_response(selected_option_id) WHERE selected_option_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_response_evaluated ON student_response(is_evaluated);
CREATE INDEX IF NOT EXISTS idx_response_attempt_question ON student_response(attempt_id, question_id);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_student_response_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_student_response_timestamp ON student_response;
CREATE TRIGGER trigger_update_student_response_timestamp
  BEFORE UPDATE ON student_response
  FOR EACH ROW
  EXECUTE FUNCTION update_student_response_timestamp();

-- Add comments
COMMENT ON TABLE student_response IS 'Version 3: Student responses to exam questions';
COMMENT ON COLUMN student_response.selected_option_id IS 'For MCQ: ID of the selected option';
COMMENT ON COLUMN student_response.answer_text IS 'For Theory/Descriptive: text answer provided by student';
COMMENT ON COLUMN student_response.is_evaluated IS 'Whether this response has been manually or automatically evaluated';
COMMENT ON COLUMN student_response.marks_awarded IS 'Marks given for this answer (0 if not evaluated yet)';

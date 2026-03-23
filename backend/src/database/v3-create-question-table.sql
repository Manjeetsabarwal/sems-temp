-- ============================================
-- VERSION 3: EXAM PAPER MODULE - STEP 3
-- Migration: Create question table
-- Date: 2024
-- ============================================
-- This migration adds support for questions in exam papers
-- Supports MCQ, Theory, and Descriptive question types
-- ============================================

-- Create question table
CREATE TABLE IF NOT EXISTS question (
  question_id TEXT PRIMARY KEY,
  paper_id TEXT NOT NULL,
  section_id TEXT, -- Optional: for future section support
  question_type TEXT NOT NULL CHECK (question_type IN ('MCQ', 'THEORY', 'DESCRIPTIVE')),
  question_text TEXT NOT NULL,
  question_image_url TEXT, -- Optional: for image-based questions
  marks NUMERIC(5,2) NOT NULL CHECK (marks > 0),
  negative_marks NUMERIC(5,2) DEFAULT 0 CHECK (negative_marks >= 0), -- For wrong answers (MCQ)
  difficulty TEXT DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  display_order INTEGER DEFAULT 1, -- Order within paper/section
  is_required BOOLEAN DEFAULT true, -- Must answer this question
  correct_answer_text TEXT, -- For Theory/Descriptive (expected answer or rubric)
  solution_text TEXT, -- Solution/explanation
  solution_image_url TEXT, -- Optional: solution image
  meta JSONB DEFAULT '{}'::jsonb, -- Flexible storage for future fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key to exam_paper table
  CONSTRAINT fk_question_paper FOREIGN KEY (paper_id) 
    REFERENCES exam_paper(paper_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_paper_id ON question(paper_id);
CREATE INDEX IF NOT EXISTS idx_question_section_id ON question(section_id) WHERE section_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_question_type ON question(question_type);
CREATE INDEX IF NOT EXISTS idx_question_difficulty ON question(difficulty);
CREATE INDEX IF NOT EXISTS idx_question_paper_type ON question(paper_id, question_type);
CREATE INDEX IF NOT EXISTS idx_question_paper_order ON question(paper_id, display_order);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_question_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_question_timestamp ON question;
CREATE TRIGGER trigger_update_question_timestamp
  BEFORE UPDATE ON question
  FOR EACH ROW
  EXECUTE FUNCTION update_question_timestamp();

-- Add comments
COMMENT ON TABLE question IS 'Version 3: Questions for exam papers - supports MCQ, Theory, and Descriptive types';
COMMENT ON COLUMN question.question_type IS 'MCQ (multiple choice), THEORY (short answer), DESCRIPTIVE (long answer)';
COMMENT ON COLUMN question.section_id IS 'Optional: for grouping questions into sections (future feature)';
COMMENT ON COLUMN question.negative_marks IS 'Marks deducted for wrong answer (typically for MCQ)';
COMMENT ON COLUMN question.correct_answer_text IS 'Expected answer or rubric for Theory/Descriptive questions';
COMMENT ON COLUMN question.meta IS 'JSONB field for flexible storage of additional question data';

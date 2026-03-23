-- ============================================
-- VERSION 3: EXAM PAPER MODULE - STEP 4
-- Migration: Create question_option table
-- Date: 2024
-- ============================================
-- This migration adds support for MCQ options
-- Each MCQ question can have multiple options (typically 4)
-- ============================================

-- Create question_option table
CREATE TABLE IF NOT EXISTS question_option (
  option_id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  option_text TEXT NOT NULL,
  option_image_url TEXT, -- Optional: for image-based options
  is_correct BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER DEFAULT 1, -- Order within question (A, B, C, D)
  explanation TEXT, -- Optional: explanation for why this option is correct/incorrect
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key to question table
  CONSTRAINT fk_option_question FOREIGN KEY (question_id) 
    REFERENCES question(question_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_option_question_id ON question_option(question_id);
CREATE INDEX IF NOT EXISTS idx_option_question_order ON question_option(question_id, display_order);
CREATE INDEX IF NOT EXISTS idx_option_correct ON question_option(question_id, is_correct) WHERE is_correct = true;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_question_option_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_question_option_timestamp ON question_option;
CREATE TRIGGER trigger_update_question_option_timestamp
  BEFORE UPDATE ON question_option
  FOR EACH ROW
  EXECUTE FUNCTION update_question_option_timestamp();

-- Add comments
COMMENT ON TABLE question_option IS 'Version 3: Multiple choice options for MCQ questions';
COMMENT ON COLUMN question_option.is_correct IS 'Whether this option is the correct answer';
COMMENT ON COLUMN question_option.display_order IS 'Order in which options should be displayed (1, 2, 3, 4, etc.)';
COMMENT ON COLUMN question_option.explanation IS 'Optional explanation for why this option is correct or incorrect';

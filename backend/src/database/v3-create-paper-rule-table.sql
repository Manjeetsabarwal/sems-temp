-- ============================================
-- VERSION 3: EXAM PAPER MODULE - STEP 2
-- Migration: Create paper_rule table
-- Date: 2024
-- ============================================
-- This migration adds support for pass/fail rules per paper
-- Each paper can have its own evaluation criteria
-- ============================================

-- Create paper_rule table
CREATE TABLE IF NOT EXISTS paper_rule (
  rule_id TEXT PRIMARY KEY,
  paper_id TEXT NOT NULL UNIQUE, -- One rule per paper
  min_marks_to_pass NUMERIC(5,2) NOT NULL CHECK (min_marks_to_pass >= 0),
  min_percentage NUMERIC(5,2) NOT NULL CHECK (min_percentage >= 0 AND min_percentage <= 100),
  section_wise_pass_required BOOLEAN DEFAULT false, -- If true, must pass each section separately
  must_attempt_percentage NUMERIC(5,2) DEFAULT 100 CHECK (must_attempt_percentage >= 0 AND must_attempt_percentage <= 100), -- Minimum % of questions to attempt
  evaluation_mode TEXT DEFAULT 'MANUAL' CHECK (evaluation_mode IN ('AUTO', 'MANUAL', 'MIXED')),
  -- AUTO: Fully automated (MCQ only)
  -- MANUAL: Fully manual evaluation (Theory/Descriptive)
  -- MIXED: Combination (auto for MCQ, manual for others)
  negative_marking_enabled BOOLEAN DEFAULT false,
  negative_marking_per_question NUMERIC(5,2) DEFAULT 0 CHECK (negative_marking_per_question >= 0), -- Negative marks per wrong answer
  grace_marks NUMERIC(5,2) DEFAULT 0 CHECK (grace_marks >= 0), -- Grace marks to add
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key to exam_paper table
  CONSTRAINT fk_rule_paper FOREIGN KEY (paper_id) 
    REFERENCES exam_paper(paper_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rule_paper_id ON paper_rule(paper_id);
CREATE INDEX IF NOT EXISTS idx_rule_evaluation_mode ON paper_rule(evaluation_mode);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_paper_rule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_paper_rule_timestamp ON paper_rule;
CREATE TRIGGER trigger_update_paper_rule_timestamp
  BEFORE UPDATE ON paper_rule
  FOR EACH ROW
  EXECUTE FUNCTION update_paper_rule_timestamp();

-- Add comments
COMMENT ON TABLE paper_rule IS 'Version 3: Pass/fail rules and evaluation criteria per exam paper';
COMMENT ON COLUMN paper_rule.min_marks_to_pass IS 'Minimum absolute marks required to pass';
COMMENT ON COLUMN paper_rule.min_percentage IS 'Minimum percentage required to pass (0-100)';
COMMENT ON COLUMN paper_rule.section_wise_pass_required IS 'If true, student must pass each section separately';
COMMENT ON COLUMN paper_rule.must_attempt_percentage IS 'Minimum percentage of questions that must be attempted';
COMMENT ON COLUMN paper_rule.evaluation_mode IS 'AUTO (MCQ only), MANUAL (human evaluation), or MIXED (both)';
COMMENT ON COLUMN paper_rule.negative_marking_enabled IS 'Whether negative marking is applied for wrong answers';
COMMENT ON COLUMN paper_rule.grace_marks IS 'Additional marks to add to final score (for rounding up)';

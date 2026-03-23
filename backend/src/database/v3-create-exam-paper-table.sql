-- ============================================
-- VERSION 3: EXAM PAPER MODULE
-- Migration: Create exam_paper table
-- Date: 2024
-- ============================================
-- This migration adds support for exam papers (online and manual)
-- without modifying existing exams table structure
-- ============================================

-- Create exam_paper table
CREATE TABLE IF NOT EXISTS exam_paper (
  paper_id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  paper_title TEXT NOT NULL,
  paper_code TEXT, -- Optional: e.g., "Paper-1", "Paper-2", "Set-A"
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  total_marks NUMERIC(5,2) NOT NULL CHECK (total_marks > 0),
  is_online BOOLEAN NOT NULL DEFAULT false, -- true = online, false = manual
  display_order INTEGER DEFAULT 1, -- For ordering multiple papers
  instructions TEXT, -- Instructions for students
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key to existing exams table (no changes to exams table)
  CONSTRAINT fk_paper_exam FOREIGN KEY (exam_id) 
    REFERENCES exams(exam_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_paper_exam_id ON exam_paper(exam_id);
CREATE INDEX IF NOT EXISTS idx_paper_status ON exam_paper(status);
CREATE INDEX IF NOT EXISTS idx_paper_is_online ON exam_paper(is_online);
CREATE INDEX IF NOT EXISTS idx_paper_exam_status ON exam_paper(exam_id, status);

-- Partial unique index for paper codes (only when paper_code is not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_paper_code_exam_unique 
  ON exam_paper(exam_id, paper_code) 
  WHERE paper_code IS NOT NULL;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_exam_paper_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_exam_paper_timestamp ON exam_paper;
CREATE TRIGGER trigger_update_exam_paper_timestamp
  BEFORE UPDATE ON exam_paper
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_paper_timestamp();

-- Add comments
COMMENT ON TABLE exam_paper IS 'Version 3: Exam papers - supports both online and manual exams';
COMMENT ON COLUMN exam_paper.is_online IS 'true = online exam (with questions), false = manual exam (traditional marks entry)';
COMMENT ON COLUMN exam_paper.paper_code IS 'Optional code for paper identification (e.g., Paper-1, Set-A)';
COMMENT ON COLUMN exam_paper.display_order IS 'Order in which papers should be displayed (for multi-paper exams)';

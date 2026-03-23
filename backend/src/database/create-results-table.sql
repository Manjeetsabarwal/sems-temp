-- Create Results Table for School Exam Management System
-- This table stores calculated results for students in exams

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS results CASCADE;

-- Create results table
CREATE TABLE results (
  result_id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  total_marks_obtained DECIMAL(10, 2) NOT NULL,
  total_max_marks DECIMAL(10, 2) NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  grade TEXT NOT NULL,
  is_passed BOOLEAN NOT NULL DEFAULT FALSE,
  subjects JSONB DEFAULT '[]',
  rank INTEGER,
  status TEXT DEFAULT 'Draft',
  remarks TEXT,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_result_student FOREIGN KEY (student_id) 
    REFERENCES students(student_id) ON DELETE CASCADE,
  CONSTRAINT fk_result_exam FOREIGN KEY (exam_id) 
    REFERENCES exams(exam_id) ON DELETE CASCADE,
  CONSTRAINT fk_result_class FOREIGN KEY (class_id) 
    REFERENCES classes(class_id) ON DELETE CASCADE,
  
  -- Unique constraint: one result per student per exam
  CONSTRAINT uq_result_student_exam UNIQUE (student_id, exam_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_results_student_id ON results(student_id);
CREATE INDEX idx_results_exam_id ON results(exam_id);
CREATE INDEX idx_results_class_id ON results(class_id);
CREATE INDEX idx_results_status ON results(status);
CREATE INDEX idx_results_percentage ON results(percentage DESC);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_results_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_results_timestamp ON results;
CREATE TRIGGER trigger_update_results_timestamp
  BEFORE UPDATE ON results
  FOR EACH ROW
  EXECUTE FUNCTION update_results_timestamp();

-- Grant permissions (adjust as needed for your database user)
-- GRANT ALL PRIVILEGES ON TABLE results TO your_db_user;

-- Success message
SELECT 'Results table created successfully!' AS message;

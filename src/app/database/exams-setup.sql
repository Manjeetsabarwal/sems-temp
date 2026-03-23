-- Exams Table Setup for SEMS
-- This script creates the exams_2fbe5237 table in your Supabase database

CREATE TABLE IF NOT EXISTS exams_2fbe5237 (
  exam_id TEXT PRIMARY KEY,
  exam_name TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('Mid-Term', 'Final', 'Unit Test', 'Quarterly')),
  academic_year TEXT NOT NULL,
  class_id TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('Term 1', 'Term 2')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  total_marks INTEGER NOT NULL DEFAULT 0,
  passing_marks INTEGER NOT NULL DEFAULT 40,
  subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('Scheduled', 'Ongoing', 'Completed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_exams_class_id ON exams_2fbe5237(class_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams_2fbe5237(status);
CREATE INDEX IF NOT EXISTS idx_exams_start_date ON exams_2fbe5237(start_date);
CREATE INDEX IF NOT EXISTS idx_exams_academic_year ON exams_2fbe5237(academic_year);

-- Insert sample exam data
INSERT INTO exams_2fbe5237 (exam_id, exam_name, exam_type, academic_year, class_id, term, start_date, end_date, total_marks, passing_marks, subjects, status) VALUES
  ('EXM001', 'Mid-Term Examination 2024', 'Mid-Term', '2023-2024', '10', 'Term 1', '2024-02-01', '2024-02-15', 500, 40, 
   '[
     {"subjectId":"MATH","subjectName":"Mathematics","subjectCode":"MATH","maxMarks":100,"passingMarks":40,"examDate":"2024-02-01","duration":180},
     {"subjectId":"ENG","subjectName":"English","subjectCode":"ENG","maxMarks":100,"passingMarks":40,"examDate":"2024-02-03","duration":180},
     {"subjectId":"SCI","subjectName":"Science","subjectCode":"SCI","maxMarks":100,"passingMarks":40,"examDate":"2024-02-05","duration":180},
     {"subjectId":"SOC","subjectName":"Social Studies","subjectCode":"SOC","maxMarks":100,"passingMarks":40,"examDate":"2024-02-07","duration":180},
     {"subjectId":"HIN","subjectName":"Hindi","subjectCode":"HIN","maxMarks":100,"passingMarks":40,"examDate":"2024-02-09","duration":180}
   ]'::jsonb, 
   'Completed'),
  ('EXM002', 'Final Examination 2024', 'Final', '2023-2024', '10', 'Term 2', '2024-05-01', '2024-05-20', 500, 40,
   '[
     {"subjectId":"MATH","subjectName":"Mathematics","subjectCode":"MATH","maxMarks":100,"passingMarks":40,"examDate":"2024-05-01","duration":180},
     {"subjectId":"ENG","subjectName":"English","subjectCode":"ENG","maxMarks":100,"passingMarks":40,"examDate":"2024-05-03","duration":180},
     {"subjectId":"SCI","subjectName":"Science","subjectCode":"SCI","maxMarks":100,"passingMarks":40,"examDate":"2024-05-05","duration":180},
     {"subjectId":"SOC","subjectName":"Social Studies","subjectCode":"SOC","maxMarks":100,"passingMarks":40,"examDate":"2024-05-07","duration":180},
     {"subjectId":"HIN","subjectName":"Hindi","subjectCode":"HIN","maxMarks":100,"passingMarks":40,"examDate":"2024-05-09","duration":180}
   ]'::jsonb,
   'Scheduled'),
  ('EXM003', 'Unit Test 1', 'Unit Test', '2024-2025', '11', 'Term 1', '2024-08-15', '2024-08-20', 300, 40,
   '[
     {"subjectId":"MATH","subjectName":"Mathematics","subjectCode":"MATH","maxMarks":100,"passingMarks":40,"examDate":"2024-08-15","duration":120},
     {"subjectId":"PHY","subjectName":"Physics","subjectCode":"PHY","maxMarks":100,"passingMarks":40,"examDate":"2024-08-17","duration":120},
     {"subjectId":"CHEM","subjectName":"Chemistry","subjectCode":"CHEM","maxMarks":100,"passingMarks":40,"examDate":"2024-08-19","duration":120}
   ]'::jsonb,
   'Ongoing')
ON CONFLICT (exam_id) DO NOTHING;

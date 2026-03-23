-- ============================================
-- SEMS - School Exam Management System
-- Complete Database Setup - Fresh Start
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- It will create all required tables with sample data
-- ============================================

-- Clean slate - Drop all existing tables
DROP TABLE IF EXISTS marks_2fbe5237 CASCADE;
DROP TABLE IF EXISTS subjects_2fbe5237 CASCADE;
DROP TABLE IF EXISTS exams_2fbe5237 CASCADE;
DROP TABLE IF EXISTS students_2fbe5237 CASCADE;
DROP TABLE IF EXISTS teachers_2fbe5237 CASCADE;
DROP TABLE IF EXISTS sections_2fbe5237 CASCADE;
DROP TABLE IF EXISTS classes_2fbe5237 CASCADE;
DROP TABLE IF EXISTS academic_years_2fbe5237 CASCADE;

-- ============================================
-- 1. ACADEMIC YEARS TABLE
-- ============================================
CREATE TABLE academic_years_2fbe5237 (
  id TEXT PRIMARY KEY,
  year_name TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Upcoming')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. CLASSES TABLE
-- ============================================
CREATE TABLE classes_2fbe5237 (
  class_id TEXT PRIMARY KEY,
  class_name TEXT NOT NULL,
  academic_year_id TEXT,
  class_teacher_id TEXT,
  total_students INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years_2fbe5237(id) ON DELETE SET NULL
);

-- ============================================
-- 3. SECTIONS TABLE
-- ============================================
CREATE TABLE sections_2fbe5237 (
  section_id TEXT PRIMARY KEY,
  section_name TEXT NOT NULL,
  class_id TEXT NOT NULL,
  capacity INTEGER DEFAULT 40,
  current_strength INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (class_id) REFERENCES classes_2fbe5237(class_id) ON DELETE CASCADE,
  UNIQUE(class_id, section_name)
);

-- ============================================
-- 4. TEACHERS TABLE
-- ============================================
CREATE TABLE teachers_2fbe5237 (
  teacher_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  subjects TEXT[] DEFAULT '{}',
  classes TEXT[] DEFAULT '{}',
  qualification TEXT,
  experience INTEGER DEFAULT 0,
  joining_date DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'On Leave')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. STUDENTS TABLE
-- ============================================
CREATE TABLE students_2fbe5237 (
  student_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  roll_no INTEGER NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  email TEXT,
  phone TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  address TEXT,
  admission_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Graduated', 'Transferred')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (class_id) REFERENCES classes_2fbe5237(class_id) ON DELETE RESTRICT,
  FOREIGN KEY (section_id) REFERENCES sections_2fbe5237(section_id) ON DELETE RESTRICT,
  UNIQUE(class_id, section_id, roll_no)
);

-- ============================================
-- 6. SUBJECTS TABLE
-- ============================================
CREATE TABLE subjects_2fbe5237 (
  subject_id TEXT PRIMARY KEY,
  subject_name TEXT NOT NULL,
  subject_code TEXT NOT NULL UNIQUE,
  class_id TEXT NOT NULL,
  teacher_id TEXT,
  description TEXT,
  credits INTEGER DEFAULT 1,
  hours_per_week INTEGER DEFAULT 4,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (class_id) REFERENCES classes_2fbe5237(class_id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers_2fbe5237(teacher_id) ON DELETE SET NULL
);

-- ============================================
-- 7. EXAMS TABLE
-- ============================================
CREATE TABLE exams_2fbe5237 (
  exam_id TEXT PRIMARY KEY,
  exam_name TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('Mid-Term', 'Final', 'Unit Test', 'Quarterly', 'Half-Yearly', 'Annual')),
  academic_year TEXT NOT NULL,
  class_id TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('Term 1', 'Term 2', 'Term 3')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_marks INTEGER DEFAULT 100,
  passing_marks INTEGER DEFAULT 40,
  subjects JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Ongoing', 'Completed', 'Cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (class_id) REFERENCES classes_2fbe5237(class_id) ON DELETE CASCADE,
  CHECK (end_date >= start_date)
);

-- ============================================
-- 8. MARKS TABLE
-- ============================================
CREATE TABLE marks_2fbe5237 (
  mark_id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  marks_obtained NUMERIC(5,2) NOT NULL CHECK (marks_obtained >= 0),
  total_marks INTEGER DEFAULT 100 CHECK (total_marks > 0),
  percentage NUMERIC(5,2) GENERATED ALWAYS AS ((marks_obtained / total_marks) * 100) STORED,
  grade TEXT,
  remarks TEXT,
  is_absent BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published')),
  entered_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (student_id) REFERENCES students_2fbe5237(student_id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams_2fbe5237(exam_id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects_2fbe5237(subject_id) ON DELETE CASCADE,
  UNIQUE(student_id, exam_id, subject_id),
  CHECK (marks_obtained <= total_marks)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Students indexes
CREATE INDEX idx_students_class ON students_2fbe5237(class_id);
CREATE INDEX idx_students_section ON students_2fbe5237(section_id);
CREATE INDEX idx_students_name ON students_2fbe5237(name);
CREATE INDEX idx_students_status ON students_2fbe5237(status);

-- Exams indexes
CREATE INDEX idx_exams_class ON exams_2fbe5237(class_id);
CREATE INDEX idx_exams_status ON exams_2fbe5237(status);
CREATE INDEX idx_exams_start_date ON exams_2fbe5237(start_date);
CREATE INDEX idx_exams_academic_year ON exams_2fbe5237(academic_year);

-- Marks indexes
CREATE INDEX idx_marks_student ON marks_2fbe5237(student_id);
CREATE INDEX idx_marks_exam ON marks_2fbe5237(exam_id);
CREATE INDEX idx_marks_subject ON marks_2fbe5237(subject_id);
CREATE INDEX idx_marks_status ON marks_2fbe5237(status);

-- Subjects indexes
CREATE INDEX idx_subjects_class ON subjects_2fbe5237(class_id);
CREATE INDEX idx_subjects_teacher ON subjects_2fbe5237(teacher_id);

-- Teachers indexes
CREATE INDEX idx_teachers_name ON teachers_2fbe5237(name);
CREATE INDEX idx_teachers_email ON teachers_2fbe5237(email);
CREATE INDEX idx_teachers_status ON teachers_2fbe5237(status);

-- Sections indexes
CREATE INDEX idx_sections_class ON sections_2fbe5237(class_id);

-- ============================================
-- SAMPLE DATA - Academic Year
-- ============================================
INSERT INTO academic_years_2fbe5237 (id, year_name, start_date, end_date, is_current, status) VALUES
('AY2024-25', '2024-2025', '2024-04-01', '2025-03-31', true, 'Active'),
('AY2025-26', '2025-2026', '2025-04-01', '2026-03-31', false, 'Upcoming');

-- ============================================
-- SAMPLE DATA - Classes
-- ============================================
INSERT INTO classes_2fbe5237 (class_id, class_name, academic_year_id, status) VALUES
('10', 'Class 10', 'AY2024-25', 'Active'),
('11', 'Class 11', 'AY2024-25', 'Active'),
('12', 'Class 12', 'AY2024-25', 'Active'),
('9', 'Class 9', 'AY2024-25', 'Active');

-- ============================================
-- SAMPLE DATA - Sections
-- ============================================
INSERT INTO sections_2fbe5237 (section_id, section_name, class_id, capacity) VALUES
('10-A', 'Section A', '10', 40),
('10-B', 'Section B', '10', 40),
('11-A', 'Section A', '11', 40),
('11-B', 'Section B', '11', 40),
('12-A', 'Section A', '12', 40),
('9-A', 'Section A', '9', 40);

-- ============================================
-- SAMPLE DATA - Teachers
-- ============================================
INSERT INTO teachers_2fbe5237 (teacher_id, name, email, phone, subjects, classes, qualification, experience, joining_date) VALUES
('TCH001', 'Dr. Rajesh Kumar', 'rajesh.kumar@school.edu', '+91-9876543210', ARRAY['Mathematics', 'Physics'], ARRAY['10', '11', '12'], 'M.Sc Physics, B.Ed', 15, '2010-06-15'),
('TCH002', 'Mrs. Priya Sharma', 'priya.sharma@school.edu', '+91-9876543211', ARRAY['English', 'Hindi'], ARRAY['9', '10', '11'], 'M.A English, B.Ed', 12, '2012-07-01'),
('TCH003', 'Mr. Amit Patel', 'amit.patel@school.edu', '+91-9876543212', ARRAY['Chemistry', 'Biology'], ARRAY['10', '11', '12'], 'M.Sc Chemistry, B.Ed', 10, '2014-08-20'),
('TCH004', 'Ms. Sneha Verma', 'sneha.verma@school.edu', '+91-9876543213', ARRAY['History', 'Geography'], ARRAY['9', '10'], 'M.A History, B.Ed', 8, '2016-06-10'),
('TCH005', 'Dr. Vikram Singh', 'vikram.singh@school.edu', '+91-9876543214', ARRAY['Mathematics', 'Computer Science'], ARRAY['11', '12'], 'Ph.D Computer Science', 18, '2008-04-05');

-- ============================================
-- SAMPLE DATA - Students
-- ============================================
INSERT INTO students_2fbe5237 (student_id, name, class_id, section_id, roll_no, date_of_birth, gender, parent_name, parent_phone, parent_email) VALUES
('STU001', 'Rahul Sharma', '10', '10-A', 1, '2008-05-15', 'Male', 'Mr. Anil Sharma', '+91-9876540001', 'anil.sharma@email.com'),
('STU002', 'Priya Patel', '10', '10-A', 2, '2008-08-22', 'Female', 'Mrs. Kavita Patel', '+91-9876540002', 'kavita.patel@email.com'),
('STU003', 'Amit Kumar', '10', '10-A', 3, '2008-03-10', 'Male', 'Mr. Suresh Kumar', '+91-9876540003', 'suresh.kumar@email.com'),
('STU004', 'Sneha Reddy', '10', '10-A', 4, '2008-11-30', 'Female', 'Dr. Ramesh Reddy', '+91-9876540004', 'ramesh.reddy@email.com'),
('STU005', 'Arjun Singh', '10', '10-A', 5, '2008-07-18', 'Male', 'Col. Vikram Singh', '+91-9876540005', 'vikram.singh@email.com'),
('STU006', 'Anjali Verma', '10', '10-B', 1, '2008-09-25', 'Female', 'Mr. Rajesh Verma', '+91-9876540006', 'rajesh.verma@email.com'),
('STU007', 'Rohan Gupta', '10', '10-B', 2, '2008-12-05', 'Male', 'Mrs. Sunita Gupta', '+91-9876540007', 'sunita.gupta@email.com'),
('STU008', 'Kavya Nair', '11', '11-A', 1, '2007-06-12', 'Female', 'Mr. Krishna Nair', '+91-9876540008', 'krishna.nair@email.com'),
('STU009', 'Vikram Rao', '11', '11-A', 2, '2007-04-08', 'Male', 'Dr. Madhav Rao', '+91-9876540009', 'madhav.rao@email.com'),
('STU010', 'Divya Shah', '12', '12-A', 1, '2006-10-20', 'Female', 'Mr. Kiran Shah', '+91-9876540010', 'kiran.shah@email.com'),
('STU011', 'Karan Mehta', '10', '10-A', 6, '2008-02-14', 'Male', 'Mrs. Neha Mehta', '+91-9876540011', 'neha.mehta@email.com'),
('STU012', 'Isha Joshi', '10', '10-B', 3, '2008-01-28', 'Female', 'Mr. Prakash Joshi', '+91-9876540012', 'prakash.joshi@email.com'),
('STU013', 'Aditya Desai', '11', '11-A', 3, '2007-09-17', 'Male', 'Dr. Sanjay Desai', '+91-9876540013', 'sanjay.desai@email.com'),
('STU014', 'Meera Iyer', '11', '11-B', 1, '2007-12-03', 'Female', 'Mr. Ravi Iyer', '+91-9876540014', 'ravi.iyer@email.com'),
('STU015', 'Siddharth Roy', '12', '12-A', 2, '2006-07-25', 'Male', 'Mrs. Anita Roy', '+91-9876540015', 'anita.roy@email.com');

-- ============================================
-- SAMPLE DATA - Subjects
-- ============================================
INSERT INTO subjects_2fbe5237 (subject_id, subject_name, subject_code, class_id, teacher_id, credits, hours_per_week) VALUES
-- Class 10 Subjects
('SUB001', 'Mathematics', 'MATH10', '10', 'TCH001', 2, 6),
('SUB002', 'Science', 'SCI10', '10', 'TCH003', 2, 6),
('SUB003', 'English', 'ENG10', '10', 'TCH002', 2, 5),
('SUB004', 'Social Studies', 'SS10', '10', 'TCH004', 2, 5),
('SUB005', 'Hindi', 'HIN10', '10', 'TCH002', 1, 4),

-- Class 11 Subjects
('SUB011', 'Mathematics', 'MATH11', '11', 'TCH001', 2, 6),
('SUB012', 'Physics', 'PHY11', '11', 'TCH001', 2, 6),
('SUB013', 'Chemistry', 'CHE11', '11', 'TCH003', 2, 6),
('SUB014', 'Biology', 'BIO11', '11', 'TCH003', 2, 6),
('SUB015', 'English', 'ENG11', '11', 'TCH002', 2, 5),

-- Class 12 Subjects
('SUB021', 'Mathematics', 'MATH12', '12', 'TCH005', 2, 6),
('SUB022', 'Physics', 'PHY12', '12', 'TCH001', 2, 6),
('SUB023', 'Chemistry', 'CHE12', '12', 'TCH003', 2, 6),
('SUB024', 'Computer Science', 'CS12', '12', 'TCH005', 2, 6),
('SUB025', 'English', 'ENG12', '12', 'TCH002', 2, 5);

-- ============================================
-- SAMPLE DATA - Exams
-- ============================================
INSERT INTO exams_2fbe5237 (exam_id, exam_name, exam_type, academic_year, class_id, term, start_date, end_date, total_marks, passing_marks, subjects, status) VALUES
('EXM001', 'Mid-Term Examination 2024', 'Mid-Term', '2024-2025', '10', 'Term 1', '2024-09-15', '2024-09-25', 500, 200, 
  '[
    {"subject_id":"SUB001","subject_name":"Mathematics","max_marks":100},
    {"subject_id":"SUB002","subject_name":"Science","max_marks":100},
    {"subject_id":"SUB003","subject_name":"English","max_marks":100},
    {"subject_id":"SUB004","subject_name":"Social Studies","max_marks":100},
    {"subject_id":"SUB005","subject_name":"Hindi","max_marks":100}
  ]'::jsonb, 
  'Completed'),

('EXM002', 'Final Examination 2025', 'Final', '2024-2025', '10', 'Term 2', '2025-03-01', '2025-03-15', 500, 200, 
  '[
    {"subject_id":"SUB001","subject_name":"Mathematics","max_marks":100},
    {"subject_id":"SUB002","subject_name":"Science","max_marks":100},
    {"subject_id":"SUB003","subject_name":"English","max_marks":100},
    {"subject_id":"SUB004","subject_name":"Social Studies","max_marks":100},
    {"subject_id":"SUB005","subject_name":"Hindi","max_marks":100}
  ]'::jsonb, 
  'Scheduled'),

('EXM003', 'Mid-Term Examination 2024', 'Mid-Term', '2024-2025', '11', 'Term 1', '2024-09-15', '2024-09-25', 500, 200, 
  '[
    {"subject_id":"SUB011","subject_name":"Mathematics","max_marks":100},
    {"subject_id":"SUB012","subject_name":"Physics","max_marks":100},
    {"subject_id":"SUB013","subject_name":"Chemistry","max_marks":100},
    {"subject_id":"SUB014","subject_name":"Biology","max_marks":100},
    {"subject_id":"SUB015","subject_name":"English","max_marks":100}
  ]'::jsonb, 
  'Completed');

-- ============================================
-- SAMPLE DATA - Marks (for EXM001 - Class 10 Mid-Term)
-- ============================================
INSERT INTO marks_2fbe5237 (mark_id, student_id, exam_id, subject_id, marks_obtained, total_marks, grade, status) VALUES
-- STU001 - Rahul Sharma
('MRK001', 'STU001', 'EXM001', 'SUB001', 85, 100, 'A', 'Published'),
('MRK002', 'STU001', 'EXM001', 'SUB002', 90, 100, 'A+', 'Published'),
('MRK003', 'STU001', 'EXM001', 'SUB003', 78, 100, 'B+', 'Published'),
('MRK004', 'STU001', 'EXM001', 'SUB004', 82, 100, 'A', 'Published'),
('MRK005', 'STU001', 'EXM001', 'SUB005', 88, 100, 'A', 'Published'),

-- STU002 - Priya Patel
('MRK006', 'STU002', 'EXM001', 'SUB001', 92, 100, 'A+', 'Published'),
('MRK007', 'STU002', 'EXM001', 'SUB002', 88, 100, 'A', 'Published'),
('MRK008', 'STU002', 'EXM001', 'SUB003', 95, 100, 'A+', 'Published'),
('MRK009', 'STU002', 'EXM001', 'SUB004', 90, 100, 'A+', 'Published'),
('MRK010', 'STU002', 'EXM001', 'SUB005', 85, 100, 'A', 'Published'),

-- STU003 - Amit Kumar
('MRK011', 'STU003', 'EXM001', 'SUB001', 75, 100, 'B+', 'Published'),
('MRK012', 'STU003', 'EXM001', 'SUB002', 80, 100, 'A', 'Published'),
('MRK013', 'STU003', 'EXM001', 'SUB003', 72, 100, 'B+', 'Published'),
('MRK014', 'STU003', 'EXM001', 'SUB004', 78, 100, 'B+', 'Published'),
('MRK015', 'STU003', 'EXM001', 'SUB005', 82, 100, 'A', 'Published'),

-- STU004 - Sneha Reddy
('MRK016', 'STU004', 'EXM001', 'SUB001', 88, 100, 'A', 'Published'),
('MRK017', 'STU004', 'EXM001', 'SUB002', 92, 100, 'A+', 'Published'),
('MRK018', 'STU004', 'EXM001', 'SUB003', 90, 100, 'A+', 'Published'),
('MRK019', 'STU004', 'EXM001', 'SUB004', 85, 100, 'A', 'Published'),
('MRK020', 'STU004', 'EXM001', 'SUB005', 87, 100, 'A', 'Published'),

-- STU005 - Arjun Singh
('MRK021', 'STU005', 'EXM001', 'SUB001', 95, 100, 'A+', 'Published'),
('MRK022', 'STU005', 'EXM001', 'SUB002', 93, 100, 'A+', 'Published'),
('MRK023', 'STU005', 'EXM001', 'SUB003', 85, 100, 'A', 'Published'),
('MRK024', 'STU005', 'EXM001', 'SUB004', 88, 100, 'A', 'Published'),
('MRK025', 'STU005', 'EXM001', 'SUB005', 90, 100, 'A+', 'Published');

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE timestamps
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students_2fbe5237 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers_2fbe5237 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes_2fbe5237 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON sections_2fbe5237 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects_2fbe5237 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams_2fbe5237 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marks_updated_at BEFORE UPDATE ON marks_2fbe5237 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON academic_years_2fbe5237 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the setup

SELECT 'Academic Years' as table_name, COUNT(*) as count FROM academic_years_2fbe5237
UNION ALL
SELECT 'Classes', COUNT(*) FROM classes_2fbe5237
UNION ALL
SELECT 'Sections', COUNT(*) FROM sections_2fbe5237
UNION ALL
SELECT 'Teachers', COUNT(*) FROM teachers_2fbe5237
UNION ALL
SELECT 'Students', COUNT(*) FROM students_2fbe5237
UNION ALL
SELECT 'Subjects', COUNT(*) FROM subjects_2fbe5237
UNION ALL
SELECT 'Exams', COUNT(*) FROM exams_2fbe5237
UNION ALL
SELECT 'Marks', COUNT(*) FROM marks_2fbe5237;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ DATABASE SETUP COMPLETE!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables Created: 8';
  RAISE NOTICE 'Sample Academic Years: 2';
  RAISE NOTICE 'Sample Classes: 4';
  RAISE NOTICE 'Sample Sections: 6';
  RAISE NOTICE 'Sample Teachers: 5';
  RAISE NOTICE 'Sample Students: 15';
  RAISE NOTICE 'Sample Subjects: 15';
  RAISE NOTICE 'Sample Exams: 3';
  RAISE NOTICE 'Sample Marks: 25';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Ready to use! All tables have sample data.';
  RAISE NOTICE '============================================';
END $$;

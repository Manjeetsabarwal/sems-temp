-- ============================================
-- Student Personal/Social/Work Habits Table
-- For Template 3 Report Cards
-- ============================================
-- This table stores grades for Personal/Social/Work Habits
-- Each student can have multiple habits tracked per academic year

CREATE TABLE IF NOT EXISTS student_habits (
  id SERIAL PRIMARY KEY,
  habit_id TEXT NOT NULL UNIQUE,
  student_id TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  habit_name TEXT NOT NULL CHECK (habit_name IN (
    'Courteous',
    'Art/Craft',
    'Responsibility',
    'Systematic',
    'Sports',
    'Elocution',
    'Gen.Knowledge',
    'Cultural Activities',
    'Cleanliness',
    'Hindi Oral',
    'English Oral'
  )),
  term1_grade TEXT CHECK (term1_grade IN ('A', 'B', 'C', 'D', 'E')),
  term2_grade TEXT CHECK (term2_grade IN ('A', 'B', 'C', 'D', 'E')),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  UNIQUE(student_id, academic_year, habit_name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_student_habits_student ON student_habits(student_id);
CREATE INDEX IF NOT EXISTS idx_student_habits_academic_year ON student_habits(academic_year);
CREATE INDEX IF NOT EXISTS idx_student_habits_student_year ON student_habits(student_id, academic_year);

-- Add comment
COMMENT ON TABLE student_habits IS 'Stores Personal/Social/Work Habits grades for students per academic year';
COMMENT ON COLUMN student_habits.habit_name IS 'Name of the habit/activity being graded';
COMMENT ON COLUMN student_habits.term1_grade IS 'Grade for Term 1 (A=Excellent, B=Very Good, C=Good, D=Average, E=Below Average)';
COMMENT ON COLUMN student_habits.term2_grade IS 'Grade for Term 2 (A=Excellent, B=Very Good, C=Good, D=Average, E=Below Average)';

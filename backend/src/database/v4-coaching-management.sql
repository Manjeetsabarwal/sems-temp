-- ============================================
-- School Exam Management System
-- V4: Coaching Management System Migration
-- ============================================

-- ============================================
-- 1. COURSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER,
  class TEXT,
  sem TEXT,
  stream TEXT,
  year TEXT,
  semester TEXT,
  education TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_title ON courses(title);
CREATE INDEX IF NOT EXISTS idx_courses_class ON courses(class);
CREATE INDEX IF NOT EXISTS idx_courses_stream ON courses(stream);

-- ============================================
-- 2. COURSE_SUBJECTS TABLE (Junction)
-- ============================================
CREATE TABLE IF NOT EXISTS course_subjects (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
  UNIQUE(course_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_course_subjects_course ON course_subjects(course_id);
CREATE INDEX IF NOT EXISTS idx_course_subjects_subject ON course_subjects(subject_id);

-- ============================================
-- 3. COURSE_BATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS course_batches (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(class_id) ON DELETE SET NULL,
  section_id TEXT REFERENCES sections(section_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  teacher_share_percent NUMERIC(5,2) DEFAULT 0,
  institution_share_percent NUMERIC(5,2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_batches_course ON course_batches(course_id);
CREATE INDEX IF NOT EXISTS idx_course_batches_class ON course_batches(class_id);
CREATE INDEX IF NOT EXISTS idx_course_batches_section ON course_batches(section_id);

-- ============================================
-- 4. BATCH_TEACHERS TABLE (Junction)
-- ============================================
CREATE TABLE IF NOT EXISTS batch_teachers (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES course_batches(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
  share_amount NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(batch_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_teachers_batch ON batch_teachers(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_teachers_teacher ON batch_teachers(teacher_id);

-- ============================================
-- 5. BATCH_STUDENTS TABLE (Junction)
-- ============================================
CREATE TABLE IF NOT EXISTS batch_students (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES course_batches(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(batch_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_students_batch ON batch_students(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_student ON batch_students(student_id);

-- ============================================
-- 6. LECTURES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS lectures (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES course_batches(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
  date_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  topic TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lectures_batch ON lectures(batch_id);
CREATE INDEX IF NOT EXISTS idx_lectures_teacher ON lectures(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lectures_subject ON lectures(subject_id);
CREATE INDEX IF NOT EXISTS idx_lectures_date ON lectures(date_time);

-- ============================================
-- 7. ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  lecture_id INTEGER NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(lecture_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_lecture ON attendance(lecture_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- ============================================
-- Triggers for auto-updating timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_coaching_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_courses_timestamp') THEN
    CREATE TRIGGER update_courses_timestamp
      BEFORE UPDATE ON courses
      FOR EACH ROW EXECUTE FUNCTION update_coaching_timestamp();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_course_batches_timestamp') THEN
    CREATE TRIGGER update_course_batches_timestamp
      BEFORE UPDATE ON course_batches
      FOR EACH ROW EXECUTE FUNCTION update_coaching_timestamp();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_lectures_timestamp') THEN
    CREATE TRIGGER update_lectures_timestamp
      BEFORE UPDATE ON lectures
      FOR EACH ROW EXECUTE FUNCTION update_coaching_timestamp();
  END IF;
END;
$$;

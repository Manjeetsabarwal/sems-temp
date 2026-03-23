-- ============================================
-- School Exam Management System
-- Normalized Schema Migration
-- ============================================
-- This script migrates from the old schema (with dependencies)
-- to a normalized schema with independent entities and association tables

-- ============================================
-- STEP 1: CREATE NEW ASSOCIATION TABLES
-- ============================================

-- 1a. CLASS-SECTION COMBINATION TABLE
CREATE TABLE IF NOT EXISTS class_sections (
  id SERIAL PRIMARY KEY,
  class_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_class_sections_class ON class_sections(class_id);
CREATE INDEX IF NOT EXISTS idx_class_sections_section ON class_sections(section_id);

-- 1b. SUBJECT-TEACHER ASSOCIATION TABLE (Many-to-Many)
CREATE TABLE IF NOT EXISTS subject_teachers (
  subject_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (subject_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_subject_teachers_subject ON subject_teachers(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_teachers_teacher ON subject_teachers(teacher_id);

-- 1c. TEACHER ASSIGNMENTS TABLE (Teacher-Class-Section-Subject)
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id SERIAL PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  is_default BOOLEAN DEFAULT true,
  academic_year TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Completed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(teacher_id, class_id, section_id, subject_id, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_section ON teacher_assignments(class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_subject ON teacher_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_academic_year ON teacher_assignments(academic_year);

-- ============================================
-- STEP 2: MIGRATE EXISTING DATA TO NEW TABLES
-- ============================================

-- 2a. Migrate class-section relationships from sections table
INSERT INTO class_sections (class_id, section_id, status)
SELECT DISTINCT class_id, section_id, status
FROM sections
WHERE class_id IS NOT NULL
ON CONFLICT (class_id, section_id) DO NOTHING;

-- 2b. Migrate subject-teacher relationships from subjects table
INSERT INTO subject_teachers (subject_id, teacher_id, is_primary)
SELECT subject_id, teacher_id, true
FROM subjects
WHERE teacher_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 2c. Create teacher assignments from existing data
-- Combine subject's class_id with sections that belong to that class
INSERT INTO teacher_assignments (teacher_id, class_id, section_id, subject_id, is_default, academic_year)
SELECT DISTINCT 
  s.teacher_id,
  s.class_id,
  sec.section_id,
  s.subject_id,
  true,
  '2024-2025'
FROM subjects s
JOIN sections sec ON sec.class_id = s.class_id
WHERE s.teacher_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 3: ADD FOREIGN KEY CONSTRAINTS TO NEW TABLES
-- ============================================

-- Add foreign keys after data migration to avoid issues
ALTER TABLE class_sections 
  DROP CONSTRAINT IF EXISTS fk_class_sections_class,
  DROP CONSTRAINT IF EXISTS fk_class_sections_section;

ALTER TABLE class_sections 
  ADD CONSTRAINT fk_class_sections_class FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_class_sections_section FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE;

ALTER TABLE subject_teachers
  DROP CONSTRAINT IF EXISTS fk_subject_teachers_subject,
  DROP CONSTRAINT IF EXISTS fk_subject_teachers_teacher;

ALTER TABLE subject_teachers
  ADD CONSTRAINT fk_subject_teachers_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_subject_teachers_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE;

ALTER TABLE teacher_assignments
  DROP CONSTRAINT IF EXISTS fk_teacher_assignments_teacher,
  DROP CONSTRAINT IF EXISTS fk_teacher_assignments_class,
  DROP CONSTRAINT IF EXISTS fk_teacher_assignments_section,
  DROP CONSTRAINT IF EXISTS fk_teacher_assignments_subject;

ALTER TABLE teacher_assignments
  ADD CONSTRAINT fk_teacher_assignments_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_teacher_assignments_class FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_teacher_assignments_section FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_teacher_assignments_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE;

-- ============================================
-- STEP 4: UPDATE TRIGGERS FOR NEW TABLES
-- ============================================

CREATE TRIGGER update_class_sections_updated_at 
  BEFORE UPDATE ON class_sections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_assignments_updated_at 
  BEFORE UPDATE ON teacher_assignments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- NOTE: The following columns will be KEPT for backward compatibility
-- but should be considered DEPRECATED. The association tables are
-- the source of truth.
-- - subjects.class_id (kept but nullable)
-- - subjects.teacher_id (kept but nullable)
-- - sections.class_id (kept but nullable)
-- - teachers.subjects array (kept but deprecated)
-- - teachers.classes array (kept but deprecated)
-- ============================================

-- Make class_id nullable in subjects (backward compatibility)
ALTER TABLE subjects ALTER COLUMN class_id DROP NOT NULL;

-- Make class_id nullable in sections (backward compatibility)
ALTER TABLE sections ALTER COLUMN class_id DROP NOT NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- SELECT COUNT(*) as class_section_count FROM class_sections;
-- SELECT COUNT(*) as subject_teacher_count FROM subject_teachers;
-- SELECT COUNT(*) as teacher_assignment_count FROM teacher_assignments;

-- ============================================
-- SUCCESS! The normalized schema is now in place.
-- ============================================

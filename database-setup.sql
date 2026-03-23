-- =========================================
-- School Exam Management System (SEMS)
-- Database Setup Script
-- =========================================
-- 
-- INSTRUCTIONS:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Click "New query"
-- 5. Copy and paste this ENTIRE file
-- 6. Click "Run" button
-- 7. You should see "Success" message
--
-- =========================================

-- Drop existing tables if they exist (fresh start)
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS classes CASCADE;

-- =========================================
-- CREATE TABLES
-- =========================================

-- Create Classes table
CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Sections table  
CREATE TABLE sections (
  id TEXT PRIMARY KEY,
  class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Students table
CREATE TABLE students (
  student_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class_id TEXT REFERENCES classes(id),
  section_id TEXT REFERENCES sections(id),
  roll_no INTEGER NOT NULL,
  parent_contact TEXT,
  parent_email TEXT,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, section_id, roll_no)
);

-- =========================================
-- INSERT SAMPLE DATA
-- =========================================

-- Insert sample classes
INSERT INTO classes (id, name) VALUES
  ('9', 'Class 9'),
  ('10', 'Class 10'),
  ('11', 'Class 11'),
  ('12', 'Class 12');

-- Insert sample sections
INSERT INTO sections (id, class_id, name) VALUES
  ('9-A', '9', 'A'),
  ('9-B', '9', 'B'),
  ('10-A', '10', 'A'),
  ('10-B', '10', 'B'),
  ('10-C', '10', 'C'),
  ('11-A', '11', 'A'),
  ('11-B', '11', 'B'),
  ('12-A', '12', 'A');

-- Insert sample students
INSERT INTO students (student_id, name, class_id, section_id, roll_no, parent_contact, parent_email) VALUES
  ('STU001', 'Rahul Sharma', '10', '10-A', 1, '9876543210', 'parent.sharma@email.com'),
  ('STU002', 'Priya Patel', '10', '10-A', 2, '9876543211', 'parent.patel@email.com'),
  ('STU003', 'Amit Kumar', '10', '10-A', 3, '9876543212', 'parent.kumar@email.com'),
  ('STU004', 'Sneha Reddy', '10', '10-A', 4, '9876543213', 'parent.reddy@email.com'),
  ('STU005', 'Arjun Singh', '10', '10-A', 5, '9876543214', 'parent.singh@email.com'),
  ('STU006', 'Anjali Verma', '10', '10-B', 1, '9876543215', 'parent.verma@email.com'),
  ('STU007', 'Rohan Gupta', '10', '10-B', 2, '9876543216', 'parent.gupta@email.com'),
  ('STU008', 'Kavya Nair', '11', '11-A', 1, '9876543217', 'parent.nair@email.com'),
  ('STU009', 'Vikram Rao', '11', '11-A', 2, '9876543218', 'parent.rao@email.com'),
  ('STU010', 'Divya Shah', '12', '12-A', 1, '9876543219', 'parent.shah@email.com');

-- =========================================
-- VERIFICATION QUERIES
-- =========================================
-- Run these to verify the setup:

-- Check classes
SELECT COUNT(*) as total_classes FROM classes;

-- Check sections
SELECT COUNT(*) as total_sections FROM sections;

-- Check students
SELECT COUNT(*) as total_students FROM students;

-- View all students
SELECT 
  student_id,
  name,
  class_id,
  section_id,
  roll_no,
  parent_contact,
  parent_email
FROM students
ORDER BY student_id;

-- =========================================
-- SUCCESS!
-- =========================================
-- If you see the data above, setup is complete!
-- Now go to your app and click "Students" in the sidebar.
-- You should see all 10 students loaded from the database.
-- =========================================

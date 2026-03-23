-- Teachers Table Setup Script for SEMS
-- Run this in Supabase SQL Editor to create the teachers table

-- Drop existing table if exists
DROP TABLE IF EXISTS teachers_2fbe5237 CASCADE;

-- Create Teachers Table
CREATE TABLE teachers_2fbe5237 (
  teacherid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  classes TEXT[] NOT NULL DEFAULT '{}',
  qualification TEXT,
  experience INTEGER DEFAULT 0,
  joiningdate TEXT,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Inactive')) DEFAULT 'Active',
  createdat TIMESTAMP DEFAULT NOW(),
  updatedat TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_teachers_name ON teachers_2fbe5237(name);
CREATE INDEX idx_teachers_email ON teachers_2fbe5237(email);
CREATE INDEX idx_teachers_status ON teachers_2fbe5237(status);

-- Insert sample data
INSERT INTO teachers_2fbe5237 (teacherid, name, email, phone, subjects, classes, qualification, experience) VALUES
('TCH001', 'Alice Johnson', 'alice.johnson@example.com', '+1234567895', '{SUB001,SUB002}', '{10,11}', 'M.Sc Mathematics', 10),
('TCH002', 'Bob Smith', 'bob.smith@example.com', '+1234567896', '{SUB003}', '{10,11,12}', 'M.A. English', 8),
('TCH003', 'Charlie Brown', 'charlie.brown@example.com', '+1234567897', '{SUB004,SUB005}', '{10,11}', 'M.A. History', 12),
('TCH004', 'Diana Prince', 'diana.prince@example.com', '+1234567898', '{SUB001}', '{10}', 'B.Ed Mathematics', 5),
('TCH005', 'Ethan Hunt', 'ethan.hunt@example.com', '+1234567899', '{SUB002}', '{11,12}', 'M.Sc Physics', 15);

-- Verify the setup
SELECT COUNT(*) as total_teachers FROM teachers_2fbe5237;
SELECT * FROM teachers_2fbe5237 ORDER BY teacherid;

-- Migration: Add room_number column to sections table
-- Run this if your database already exists and doesn't have room_number column

ALTER TABLE sections 
ADD COLUMN IF NOT EXISTS room_number TEXT;

-- Update existing sections if needed (optional)
-- UPDATE sections SET room_number = NULL WHERE room_number IS NULL;

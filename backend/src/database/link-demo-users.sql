-- Link Demo Users to Students/Teachers
-- This script links the demo users to actual student/teacher records for portal testing

-- Link student user to first available student
UPDATE users 
SET student_id = (
  SELECT student_id FROM students 
  WHERE status = 'Active'
  ORDER BY student_id
  LIMIT 1
)
WHERE user_id = 'USR-STUDENT-001' 
AND student_id IS NULL;

-- Link parent user to first available student (as child)
UPDATE users 
SET student_id = (
  SELECT student_id FROM students 
  WHERE status = 'Active'
  ORDER BY student_id
  LIMIT 1
)
WHERE user_id = 'USR-PARENT-001' 
AND student_id IS NULL;

-- Link teacher user to first available teacher
UPDATE users 
SET teacher_id = (
  SELECT teacher_id FROM teachers 
  WHERE status = 'Active'
  ORDER BY teacher_id
  LIMIT 1
)
WHERE user_id = 'USR-TEACHER-001' 
AND teacher_id IS NULL;

-- Verify the links
SELECT 
  u.user_id,
  u.email,
  u.role,
  u.name as user_name,
  u.student_id,
  u.teacher_id,
  s.name as student_name,
  t.name as teacher_name
FROM users u
LEFT JOIN students s ON u.student_id = s.student_id
LEFT JOIN teachers t ON u.teacher_id = t.teacher_id
WHERE u.user_id IN ('USR-STUDENT-001', 'USR-PARENT-001', 'USR-TEACHER-001', 'USR-ADMIN-001')
ORDER BY u.role;

-- Success message
SELECT 'Demo users linked successfully!' AS message;

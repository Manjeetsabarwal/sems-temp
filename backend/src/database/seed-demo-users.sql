-- Seed Demo Users for Testing
-- This script creates demo users with different roles for testing authentication and RBAC
-- Password for all demo users: "demo123" (hashed with bcrypt)

-- Note: These are bcrypt hashes for password "demo123"
-- You can generate new hashes using: bcrypt.hash('demo123', 10)

-- Admin User
INSERT INTO users (user_id, email, password_hash, role, name, phone, is_active, created_at, updated_at)
VALUES (
  'USR-ADMIN-001',
  'admin@school.edu',
  '$2b$10$xhhjgMOqmEmaadevMOUMveD8pJTz1lempbpHgz4shuSXYqBT5Pzcm', -- demo123
  'admin',
  'System Administrator',
  '+1234567890',
  TRUE,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Teacher User
INSERT INTO users (user_id, email, password_hash, role, name, phone, teacher_id, is_active, created_at, updated_at)
VALUES (
  'USR-TEACHER-001',
  'teacher@school.edu',
  '$2b$10$yR.5aAqRdeYBsECYCQQ62Oy4e1CIuQbKDO5hwcg.UbJyVi84cYuD2', -- demo123
  'teacher',
  'Dr. Sample Teacher',
  '+1234567891',
  NULL, -- Will be linked when teacher is created
  TRUE,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Student User
INSERT INTO users (user_id, email, password_hash, role, name, phone, student_id, is_active, created_at, updated_at)
VALUES (
  'USR-STUDENT-001',
  'student@school.edu',
  '$2b$10$gezCHMLiKwrmCg.94E6YDem2GOYedZZjTcTTz6yNKZe/jT2Hcb052', -- demo123
  'student',
  'Sample Student',
  '+1234567892',
  NULL, -- Will be linked when student is created
  TRUE,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Parent User
INSERT INTO users (user_id, email, password_hash, role, name, phone, student_id, is_active, created_at, updated_at)
VALUES (
  'USR-PARENT-001',
  'parent@school.edu',
  '$2b$10$KKg2m81KrAIpK.PfbwSym.whnaOkjY78v6t8J5h68vJJ1rLmdIjhS', -- demo123
  'parent',
  'Sample Parent',
  '+1234567893',
  NULL, -- Will be linked when student is created
  TRUE,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Success message
SELECT 'Demo users seeded successfully!' AS message;
SELECT 'Demo Credentials:' AS info;
SELECT 'Admin: admin@school.edu / demo123' AS admin_cred;
SELECT 'Teacher: teacher@school.edu / demo123' AS teacher_cred;
SELECT 'Student: student@school.edu / demo123' AS student_cred;
SELECT 'Parent: parent@school.edu / demo123' AS parent_cred;

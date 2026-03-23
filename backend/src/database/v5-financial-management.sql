-- ============================================
-- School Exam Management System
-- V5: Financial Management (Enrollments, Fees, Payouts)
-- ============================================

-- ============================================
-- 1. STUDENT_ENROLLMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS student_enrollments (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  batch_id INTEGER NOT NULL REFERENCES course_batches(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  course_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  registration_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  enrollment_status VARCHAR(50) NOT NULL DEFAULT 'Active',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, batch_id)
);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_batch ON student_enrollments(batch_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_course ON student_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_payment ON student_enrollments(payment_status);

-- ============================================
-- 2. PAID_STUDENT_FEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS paid_student_fees (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  pay_type VARCHAR(50) NOT NULL,
  pay_mode VARCHAR(50) NOT NULL,
  upi_id TEXT,
  ac_number TEXT,
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paid_student_fees_enrollment ON paid_student_fees(enrollment_id);

-- ============================================
-- 3. TEACHER_PAYOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS teacher_payouts (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES course_batches(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
  payout_amount NUMERIC(12,2) NOT NULL,
  payout_cycle VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  payout_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_payouts_batch ON teacher_payouts(batch_id);
CREATE INDEX IF NOT EXISTS idx_teacher_payouts_teacher ON teacher_payouts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_payouts_status ON teacher_payouts(status);

-- Trigger for enrollment updated_at
CREATE OR REPLACE FUNCTION update_enrollment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_student_enrollments_timestamp ON student_enrollments;
CREATE TRIGGER update_student_enrollments_timestamp
  BEFORE UPDATE ON student_enrollments
  FOR EACH ROW EXECUTE PROCEDURE update_enrollment_timestamp();

DROP TRIGGER IF EXISTS update_teacher_payouts_timestamp ON teacher_payouts;
CREATE TRIGGER update_teacher_payouts_timestamp
  BEFORE UPDATE ON teacher_payouts
  FOR EACH ROW EXECUTE PROCEDURE update_enrollment_timestamp();

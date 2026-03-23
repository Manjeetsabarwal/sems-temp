-- Create payment_reminders table for tracking fee payment reminders sent via WhatsApp
CREATE TABLE IF NOT EXISTS payment_reminders (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER NOT NULL,
  student_id VARCHAR(255) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  due_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_link_id VARCHAR(255),
  payment_link_url TEXT,
  reminder_type VARCHAR(50) NOT NULL DEFAULT 'first_reminder',
  channel VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  whatsapp_message_id VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_reminders_enrollment ON payment_reminders(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_student ON payment_reminders(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_status ON payment_reminders(status);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_payment_link ON payment_reminders(payment_link_id);

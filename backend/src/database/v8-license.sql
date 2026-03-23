-- ============================================
-- School Exam Management System
-- V8: License (Razorpay + PayU payments)
-- ============================================

CREATE TABLE IF NOT EXISTS licenses (
  id SERIAL PRIMARY KEY,
  plan VARCHAR(100) NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(255),
  payment_gateway VARCHAR(50),
  payu_txnid VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_valid_to ON licenses(valid_to);

-- Add PayU columns if table already existed (e.g. from earlier v8 run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licenses' AND column_name = 'payment_gateway') THEN
    ALTER TABLE licenses ADD COLUMN payment_gateway VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'licenses' AND column_name = 'payu_txnid') THEN
    ALTER TABLE licenses ADD COLUMN payu_txnid VARCHAR(255);
  END IF;
END $$;

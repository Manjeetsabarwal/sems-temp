-- ============================================
-- School Exam Management System
-- V7: Report Card Templates (new template config only)
-- ============================================

-- ============================================
-- 1. REPORT_CARD_TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS report_card_templates (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config_json JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_card_templates_code ON report_card_templates(code);
CREATE INDEX IF NOT EXISTS idx_report_card_templates_active ON report_card_templates(is_active);

-- ============================================
-- 2. BATCH_REPORT_CARD_TEMPLATE_CONFIG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS batch_report_card_template_config (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES course_batches(id) ON DELETE CASCADE,
  academic_session TEXT NOT NULL,
  template_id INTEGER NOT NULL REFERENCES report_card_templates(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(batch_id, academic_session)
);

CREATE INDEX IF NOT EXISTS idx_batch_report_card_config_batch ON batch_report_card_template_config(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_report_card_config_template ON batch_report_card_template_config(template_id);

-- Seed default templates: existing 3 + new Template 4 (Offline)
INSERT INTO report_card_templates (code, display_name, description, is_active) VALUES
  ('TEMPLATE_1', 'Template 1', 'Basic report card', true),
  ('TEMPLATE_2', 'Template 2', 'Internal/External breakdown', true),
  ('TEMPLATE_3', 'Template 3', 'Assessment style', true),
  ('TEMPLATE_4', 'Template 4 (Offline)', 'Offline exam report card', true)
ON CONFLICT (code) DO NOTHING;

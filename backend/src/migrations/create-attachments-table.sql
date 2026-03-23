-- Create attachments table for file/document storage
CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  stored_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(200) NOT NULL,
  size BIGINT NOT NULL,
  storage_type VARCHAR(20) NOT NULL DEFAULT 'local',
  storage_path VARCHAR(1000) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  uploaded_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookup by entity
CREATE INDEX IF NOT EXISTS idx_attachments_entity
  ON attachments (entity_type, entity_id);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_attachments_category
  ON attachments (category);

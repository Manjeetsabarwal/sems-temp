-- ============================================
-- AI Copilot Learning System Database Schema
-- ============================================

-- 1. AI Interactions Table - Track all user interactions
CREATE TABLE IF NOT EXISTS ai_interactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_role TEXT NOT NULL,
  session_id TEXT,
  question TEXT NOT NULL,
  sql_query TEXT,
  response TEXT,
  response_time_ms INTEGER,
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. AI Feedback Table - Track user feedback
CREATE TABLE IF NOT EXISTS ai_feedback (
  id SERIAL PRIMARY KEY,
  interaction_id INTEGER REFERENCES ai_interactions(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'star_rating', 'detailed')),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  accuracy_rating INTEGER CHECK (accuracy_rating BETWEEN 1 AND 5),
  usefulness_rating INTEGER CHECK (usefulness_rating BETWEEN 1 AND 5),
  clarity_rating INTEGER CHECK (clarity_rating BETWEEN 1 AND 5),
  feedback_comment TEXT,
  what_was_good TEXT,
  what_could_be_better TEXT,
  additional_context TEXT,
  did_user_follow_up BOOLEAN DEFAULT false,
  did_user_modify_query BOOLEAN DEFAULT false,
  time_spent_on_response INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. AI Patterns Table - Store learned patterns
CREATE TABLE IF NOT EXISTS ai_patterns (
  id SERIAL PRIMARY KEY,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('query_pattern', 'intent', 'entity', 'template')),
  pattern TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  keywords TEXT[],
  frequency INTEGER DEFAULT 1,
  success_rate DECIMAL(3,2) DEFAULT 0.0,
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  last_used TIMESTAMP,
  last_success TIMESTAMP,
  auto_generated BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  template_example TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. AI Prompt Templates Table - Dynamic prompt templates
CREATE TABLE IF NOT EXISTS ai_prompt_templates (
  id SERIAL PRIMARY KEY,
  template_name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  template_pattern TEXT NOT NULL,
  variables TEXT[],
  description TEXT,
  success_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2) DEFAULT 0.0,
  average_response_time INTEGER,
  last_used TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  auto_generated BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. AI Query Vectors Table - For semantic search
CREATE TABLE IF NOT EXISTS ai_query_vectors (
  id SERIAL PRIMARY KEY,
  interaction_id INTEGER REFERENCES ai_interactions(id) ON DELETE CASCADE,
  query_vector vector(1536), -- For OpenAI embeddings
  category TEXT,
  intent TEXT,
  similarity_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. AI Learning Metrics Table - Track learning progress
CREATE TABLE IF NOT EXISTS ai_learning_metrics (
  id SERIAL PRIMARY KEY,
  metric_date DATE NOT NULL,
  total_interactions INTEGER DEFAULT 0,
  successful_interactions INTEGER DEFAULT 0,
  average_feedback_score DECIMAL(3,2),
  new_patterns_discovered INTEGER DEFAULT 0,
  templates_generated INTEGER DEFAULT 0,
  accuracy_improvement DECIMAL(3,2),
  response_time_improvement INTEGER,
  unique_queries INTEGER DEFAULT 0,
  repeat_queries INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(metric_date)
);

-- 7. AI A/B Tests Table - For testing prompt variations
CREATE TABLE IF NOT EXISTS ai_ab_tests (
  id SERIAL PRIMARY KEY,
  test_name TEXT NOT NULL,
  description TEXT,
  template_a_id INTEGER REFERENCES ai_prompt_templates(id),
  template_b_id INTEGER REFERENCES ai_prompt_templates(id),
  traffic_split DECIMAL(3,2) DEFAULT 0.5,
  impressions_a INTEGER DEFAULT 0,
  impressions_b INTEGER DEFAULT 0,
  conversions_a INTEGER DEFAULT 0,
  conversions_b INTEGER DEFAULT 0,
  success_rate_a DECIMAL(3,2),
  success_rate_b DECIMAL(3,2),
  statistical_significance BOOLEAN DEFAULT false,
  confidence_level DECIMAL(3,2),
  winner TEXT CHECK (winner IN ('A', 'B', 'inconclusive')),
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'paused')),
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. AI Context Memory Table - Remember user context
CREATE TABLE IF NOT EXISTS ai_context_memory (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT,
  context_type TEXT NOT NULL,
  context_data JSONB,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created ON ai_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_interaction ON ai_feedback(interaction_id);
CREATE INDEX IF NOT EXISTS idx_ai_patterns_type ON ai_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_ai_patterns_category ON ai_patterns(category);
CREATE INDEX IF NOT EXISTS idx_ai_templates_category ON ai_prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_ai_vectors_similarity ON ai_query_vectors USING ivfflat (query_vector vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_date ON ai_learning_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_ai_context_user ON ai_context_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_session ON ai_context_memory(session_id);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_interactions_updated_at BEFORE UPDATE ON ai_interactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_patterns_updated_at BEFORE UPDATE ON ai_patterns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_templates_updated_at BEFORE UPDATE ON ai_prompt_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_metrics_updated_at BEFORE UPDATE ON ai_learning_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

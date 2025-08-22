-- Migration to add separate embedding provider settings
-- Run this in your Supabase SQL Editor if you have an existing Archon installation

-- Add new embedding provider settings
INSERT INTO archon_settings (key, value, is_encrypted, category, description) VALUES
('EMBEDDING_PROVIDER', 'openai', false, 'rag_strategy', 'Embedding provider to use: openai, ollama, or google (can be different from chat LLM)')
ON CONFLICT (key) DO UPDATE SET 
  description = EXCLUDED.description;

INSERT INTO archon_settings (key, value, is_encrypted, category, description) VALUES  
('EMBEDDING_BASE_URL', NULL, false, 'rag_strategy', 'Custom base URL for embedding provider (mainly for Ollama, e.g., http://localhost:11434/v1)')
ON CONFLICT (key) DO UPDATE SET 
  description = EXCLUDED.description;

-- Update existing LLM_PROVIDER description to clarify it's for chat
UPDATE archon_settings 
SET description = 'Chat LLM provider to use: openai, ollama, or google'
WHERE key = 'LLM_PROVIDER';

-- Update existing LLM_BASE_URL description to clarify it's for chat
UPDATE archon_settings 
SET description = 'Custom base URL for chat LLM provider (mainly for Ollama, e.g., http://localhost:11434/v1)'
WHERE key = 'LLM_BASE_URL';
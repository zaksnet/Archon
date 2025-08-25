-- =====================================================
-- Simplified Provider Schema for PydanticAI Integration
-- =====================================================
-- Direct integration with PydanticAI's native model handling
-- No custom provider clients, just configuration management
-- =====================================================

-- Clean up old complex provider tables
DROP TABLE IF EXISTS public.provider_active_config CASCADE;
DROP TABLE IF EXISTS public.provider_incidents CASCADE;
DROP TABLE IF EXISTS public.provider_health_checks CASCADE;
DROP TABLE IF EXISTS public.provider_quotas CASCADE;
DROP TABLE IF EXISTS public.provider_usage CASCADE;
DROP TABLE IF EXISTS public.provider_models CASCADE;
DROP TABLE IF EXISTS public.provider_credentials CASCADE;
DROP TABLE IF EXISTS public.providers CASCADE;
DROP TABLE IF EXISTS public.embedding_providers CASCADE;
DROP TABLE IF EXISTS public.llm_providers CASCADE;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Single table for model configuration
CREATE TABLE IF NOT EXISTS public.model_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Service identification
    service_name TEXT NOT NULL UNIQUE, -- 'rag_agent', 'document_agent', 'embeddings'
    
    -- PydanticAI model string
    model_string TEXT NOT NULL, -- 'openai:gpt-4o', 'anthropic:claude-3-opus'
    
    -- Optional overrides
    temperature FLOAT DEFAULT 0.7,
    max_tokens INTEGER,
    
    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT,
    
    CONSTRAINT valid_model_string CHECK (model_string LIKE '%:%')
);

-- Create index for fast lookups
CREATE INDEX idx_model_config_service ON public.model_config(service_name);

-- Single table for API keys (encrypted)
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    provider TEXT NOT NULL UNIQUE, -- 'openai', 'anthropic', 'google'
    encrypted_key TEXT NOT NULL,
    
    -- Optional provider config
    base_url TEXT, -- For Ollama or custom endpoints
    headers JSONB, -- Additional headers if needed
    
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_provider CHECK (
        provider IN ('openai', 'anthropic', 'google', 'gemini', 'groq', 'mistral', 'ollama', 'cohere')
    )
);

-- Create index for active providers
CREATE INDEX idx_api_keys_active ON public.api_keys(provider) WHERE is_active = true;

-- Simple usage tracking
CREATE TABLE IF NOT EXISTS public.model_usage (
    id UUID DEFAULT gen_random_uuid(),
    
    service_name TEXT NOT NULL,
    model_string TEXT NOT NULL,
    
    -- Usage metrics
    request_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10, 6) DEFAULT 0,
    
    -- Time window
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Composite primary key for efficient upserts
    PRIMARY KEY (service_name, model_string, period_start)
);

-- Create indexes for efficient queries
CREATE INDEX idx_model_usage_period ON public.model_usage(period_start, period_end);
CREATE INDEX idx_model_usage_service ON public.model_usage(service_name, period_start DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Atomic usage increment function
CREATE OR REPLACE FUNCTION increment_usage(
    p_service TEXT,
    p_model TEXT,
    p_tokens INTEGER,
    p_cost NUMERIC,
    p_period_start TIMESTAMPTZ
) RETURNS void AS $$
BEGIN
    INSERT INTO model_usage (
        service_name, 
        model_string, 
        request_count, 
        total_tokens, 
        estimated_cost, 
        period_start, 
        period_end
    ) VALUES (
        p_service, 
        p_model, 
        1, 
        p_tokens, 
        p_cost, 
        p_period_start, 
        p_period_start + INTERVAL '1 day'
    )
    ON CONFLICT (service_name, model_string, period_start)
    DO UPDATE SET
        request_count = model_usage.request_count + 1,
        total_tokens = model_usage.total_tokens + p_tokens,
        estimated_cost = model_usage.estimated_cost + p_cost;
END;
$$ LANGUAGE plpgsql;

-- Function to get current model for a service
CREATE OR REPLACE FUNCTION get_current_model(p_service TEXT)
RETURNS TEXT AS $$
DECLARE
    v_model TEXT;
BEGIN
    SELECT model_string INTO v_model
    FROM model_config
    WHERE service_name = p_service;
    
    RETURN v_model;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default model configurations
INSERT INTO public.model_config (service_name, model_string, temperature) VALUES
    ('rag_agent', 'openai:gpt-4o-mini', 0.7),
    ('document_agent', 'openai:gpt-4o', 0.7),
    ('embeddings', 'openai:text-embedding-3-small', 0.0)
ON CONFLICT (service_name) DO NOTHING;

-- =====================================================
-- VIEWS
-- =====================================================

-- View for daily usage summary
CREATE OR REPLACE VIEW daily_usage_summary AS
SELECT 
    service_name,
    model_string,
    DATE(period_start) as date,
    SUM(request_count) as total_requests,
    SUM(total_tokens) as total_tokens,
    SUM(estimated_cost) as total_cost
FROM model_usage
GROUP BY service_name, model_string, DATE(period_start)
ORDER BY date DESC, service_name;

-- View for active configurations
CREATE OR REPLACE VIEW active_model_config AS
SELECT 
    mc.service_name,
    mc.model_string,
    mc.temperature,
    mc.max_tokens,
    SPLIT_PART(mc.model_string, ':', 1) as provider,
    SPLIT_PART(mc.model_string, ':', 2) as model,
    ak.is_active as api_key_configured
FROM model_config mc
LEFT JOIN api_keys ak ON SPLIT_PART(mc.model_string, ':', 1) = ak.provider AND ak.is_active = true;

-- =====================================================
-- PERMISSIONS (if using RLS)
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (full access)
CREATE POLICY "Service role has full access to api_keys" ON public.api_keys
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.model_config IS 'Configuration for PydanticAI models used by each service';
COMMENT ON TABLE public.api_keys IS 'Encrypted API keys for AI providers';
COMMENT ON TABLE public.model_usage IS 'Usage tracking for cost monitoring';
COMMENT ON FUNCTION increment_usage IS 'Atomically increment usage metrics';
COMMENT ON VIEW daily_usage_summary IS 'Daily aggregated usage statistics';
COMMENT ON VIEW active_model_config IS 'Current model configuration with provider status';
-- =====================================================
-- Enhanced Provider Management System for Archon
-- =====================================================
-- Unified provider architecture with advanced features:
-- - Multi-model support with active provider selection
-- - Cost tracking and budget management
-- - Performance monitoring and health checks
-- - Credential rotation and security
-- - Usage quotas and rate limiting
-- =====================================================

-- Drop old tables if they exist (since this feature hasn't been merged)
DROP TABLE IF EXISTS public.embedding_providers CASCADE;
DROP TABLE IF EXISTS public.llm_providers CASCADE;
-- Drop current unified tables to allow re-create with fixes
DROP TABLE IF EXISTS public.provider_active_config CASCADE;
DROP TABLE IF EXISTS public.provider_incidents CASCADE;
DROP TABLE IF EXISTS public.provider_health_checks CASCADE;
DROP TABLE IF EXISTS public.provider_quotas CASCADE;
DROP TABLE IF EXISTS public.provider_usage CASCADE;
DROP TABLE IF EXISTS public.provider_models CASCADE;
DROP TABLE IF EXISTS public.provider_credentials CASCADE;
DROP TABLE IF EXISTS public.providers CASCADE;

-- =====================================================
-- SECTION 1: CORE PROVIDER TABLES
-- =====================================================

-- Unified provider registry for all AI services
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    provider_type TEXT NOT NULL, -- 'openai', 'anthropic', 'cohere', 'ollama', 'huggingface', 'google', 'custom'
    service_types TEXT[] NOT NULL, -- ['llm', 'embedding', 'reranking', 'speech', 'vision']
    
    -- Connection Configuration
    base_url TEXT, -- For custom/self-hosted instances
    api_version TEXT, -- API version to use
    timeout_ms INTEGER DEFAULT 30000,
    max_retries INTEGER DEFAULT 3,
    retry_delay_ms INTEGER DEFAULT 1000,
    
    -- Provider Status
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false, -- Primary provider for each service type
    health_status TEXT DEFAULT 'unknown', -- 'healthy', 'degraded', 'unhealthy', 'unknown'
    last_health_check TIMESTAMPTZ,
    
    -- Configuration
    config JSONB DEFAULT '{}', -- Provider-specific configuration
    headers JSONB DEFAULT '{}', -- Additional headers for requests
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    notes TEXT,
    
    -- Constraints
    CONSTRAINT valid_provider_type CHECK (
        provider_type IN ('openai', 'anthropic', 'cohere', 'ollama', 'huggingface', 'google', 'gemini', 'mistral', 'custom')
    ),
    CONSTRAINT valid_health_status CHECK (
        health_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')
    )
);
 
 
-- Provider credentials with rotation support
CREATE TABLE IF NOT EXISTS public.provider_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    
    -- Credential Information
    credential_type TEXT NOT NULL, -- 'api_key', 'oauth2', 'service_account'
    credential_name TEXT NOT NULL, -- e.g., 'primary_key', 'secondary_key'
    encrypted_value TEXT NOT NULL, -- Encrypted credential value
    
    -- API Key Configuration
    api_key_prefix TEXT, -- e.g., 'Bearer ', 'sk-'
    api_key_header TEXT DEFAULT 'Authorization', -- Header name for the API key
    
    -- Rotation Management
    is_active BOOLEAN DEFAULT true,
    rotation_status TEXT DEFAULT 'current', -- 'current', 'rotating', 'expired', 'revoked'
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    last_rotated TIMESTAMPTZ,
    rotation_reminder_days INTEGER DEFAULT 30,
    
    -- Usage Tracking
    last_used TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure only one active credential per type per provider
    CONSTRAINT unique_active_credential UNIQUE (provider_id, credential_type, credential_name, is_active),
    CONSTRAINT valid_credential_type CHECK (
        credential_type IN ('api_key', 'oauth2', 'service_account', 'basic_auth', 'custom')
    ),
    CONSTRAINT valid_rotation_status CHECK (
        rotation_status IN ('current', 'rotating', 'expired', 'revoked')
    )
);

-- Model catalog with capabilities and pricing
CREATE TABLE IF NOT EXISTS public.provider_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    
    -- Model Information
    model_id TEXT NOT NULL, -- e.g., 'gpt-4', 'claude-3-opus'
    model_name TEXT NOT NULL, -- Display name
    model_type TEXT NOT NULL, -- 'llm', 'embedding', 'reranking', 'speech', 'vision'
    model_family TEXT, -- e.g., 'gpt', 'claude', 'llama'
    
    -- Capabilities
    max_tokens INTEGER,
    max_input_tokens INTEGER,
    max_output_tokens INTEGER,
    supports_streaming BOOLEAN DEFAULT false,
    supports_functions BOOLEAN DEFAULT false,
    supports_vision BOOLEAN DEFAULT false,
    supports_json_mode BOOLEAN DEFAULT false,
    context_window INTEGER,
    embedding_dimensions INTEGER, -- For embedding models
    
    -- Performance Characteristics
    latency_category TEXT, -- 'realtime', 'fast', 'standard', 'slow'
    throughput_rpm INTEGER, -- Requests per minute limit
    
    -- Pricing (per 1K tokens or per request)
    input_price_per_1k DECIMAL(10, 6),
    output_price_per_1k DECIMAL(10, 6),
    request_price DECIMAL(10, 6), -- For non-token based pricing
    
    -- Model Status
    is_available BOOLEAN DEFAULT true,
    is_deprecated BOOLEAN DEFAULT false,
    deprecation_date DATE,
    replacement_model TEXT, -- Suggested replacement if deprecated
    
    -- Configuration
    default_params JSONB DEFAULT '{}', -- Default parameters for this model
    supported_params JSONB DEFAULT '[]', -- List of supported parameters
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_provider_model UNIQUE (provider_id, model_id),
    CONSTRAINT valid_model_type CHECK (
        model_type IN ('llm', 'embedding', 'reranking', 'speech', 'vision', 'multimodal')
    ),
    CONSTRAINT valid_latency_category CHECK (
        latency_category IN ('realtime', 'fast', 'standard', 'slow')
    )
);

-- =====================================================
-- SECTION 2: ACTIVE PROVIDER CONFIGURATION
-- =====================================================

-- Active provider configuration for each service type
CREATE TABLE IF NOT EXISTS public.provider_active_config (
    service_type TEXT PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    
    -- Metadata
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT,
    
    -- Constraints
    CONSTRAINT valid_service_type CHECK (
        service_type IN ('llm', 'embedding', 'vision', 'reranking', 'speech')
    )
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_provider_active_config_provider_id 
    ON public.provider_active_config(provider_id);

-- =====================================================
-- SECTION 3: USAGE TRACKING AND COST MANAGEMENT
-- =====================================================

-- Provider usage tracking with granular metrics
CREATE TABLE IF NOT EXISTS public.provider_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    model_id UUID REFERENCES public.provider_models(id) ON DELETE SET NULL,
    
    -- Time Window
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Usage Metrics
    request_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    -- Token Usage (for LLMs)
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    
    -- Performance Metrics
    avg_latency_ms INTEGER,
    p50_latency_ms INTEGER,
    p95_latency_ms INTEGER,
    p99_latency_ms INTEGER,
    
    -- Cost Tracking
    estimated_cost DECIMAL(10, 4) DEFAULT 0,
    actual_cost DECIMAL(10, 4),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate entries for the same period
    CONSTRAINT unique_usage_period UNIQUE (provider_id, model_id, period_start, period_end)
);

-- Usage quotas and limits
CREATE TABLE IF NOT EXISTS public.provider_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    
    -- Quota Definition
    quota_type TEXT NOT NULL, -- 'requests', 'tokens', 'cost'
    quota_period TEXT NOT NULL, -- 'minute', 'hour', 'day', 'month'
    quota_limit DECIMAL(15, 2) NOT NULL,
    
    -- Current Usage
    current_usage DECIMAL(15, 2) DEFAULT 0,
    period_start TIMESTAMPTZ NOT NULL,
    reset_at TIMESTAMPTZ NOT NULL,
    
    -- Alert Thresholds
    warning_threshold_percent INTEGER DEFAULT 80,
    critical_threshold_percent INTEGER DEFAULT 95,
    
    -- Actions
    action_on_limit TEXT DEFAULT 'block', -- 'block', 'allow_with_alert', 'switch_provider'
    fallback_provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_alert_sent TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_provider_quota UNIQUE (provider_id, quota_type, quota_period),
    CONSTRAINT valid_quota_type CHECK (
        quota_type IN ('requests', 'tokens', 'cost', 'errors')
    ),
    CONSTRAINT valid_quota_period CHECK (
        quota_period IN ('minute', 'hour', 'day', 'week', 'month')
    ),
    CONSTRAINT valid_action CHECK (
        action_on_limit IN ('block', 'allow_with_alert', 'switch_provider')
    )
);

-- =====================================================
-- SECTION 4: MONITORING AND HEALTH
-- =====================================================

-- Provider health monitoring
CREATE TABLE IF NOT EXISTS public.provider_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    
    -- Check Details
    check_type TEXT NOT NULL, -- 'ping', 'auth', 'model_list', 'inference'
    check_status TEXT NOT NULL, -- 'success', 'failure', 'timeout', 'partial'
    
    -- Performance
    response_time_ms INTEGER,
    status_code INTEGER,
    
    -- Error Information
    error_message TEXT,
    error_details JSONB DEFAULT '{}',
    
    -- Metadata
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_check_type CHECK (
        check_type IN ('ping', 'auth', 'model_list', 'inference', 'custom')
    ),
    CONSTRAINT valid_check_status CHECK (
        check_status IN ('success', 'failure', 'timeout', 'partial')
    )
);

-- Provider incidents and outages
CREATE TABLE IF NOT EXISTS public.provider_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    
    -- Incident Details
    incident_type TEXT NOT NULL, -- 'outage', 'degraded', 'maintenance'
    severity TEXT NOT NULL, -- 'critical', 'major', 'minor', 'maintenance'
    
    -- Timeline
    started_at TIMESTAMPTZ NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    -- Impact
    affected_services TEXT[],
    affected_models TEXT[],
    error_rate_percent DECIMAL(5, 2),
    
    -- Resolution
    auto_resolved BOOLEAN DEFAULT false,
    resolution_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_incident_type CHECK (
        incident_type IN ('outage', 'degraded', 'maintenance', 'rate_limit')
    ),
    CONSTRAINT valid_severity CHECK (
        severity IN ('critical', 'major', 'minor', 'maintenance')
    )
);

-- =====================================================
-- SECTION 5: INDEXES AND PERFORMANCE
-- =====================================================

-- Core indexes
CREATE INDEX idx_providers_name ON public.providers (name);
CREATE INDEX idx_providers_type ON public.providers (provider_type);
CREATE INDEX idx_providers_active ON public.providers (is_active);
CREATE INDEX idx_providers_health ON public.providers (health_status);
CREATE INDEX idx_providers_service_types ON public.providers USING GIN (service_types);

-- Credential indexes
CREATE INDEX idx_credentials_provider ON public.provider_credentials (provider_id);
CREATE INDEX idx_credentials_active ON public.provider_credentials (is_active);
CREATE INDEX idx_credentials_rotation ON public.provider_credentials (rotation_status);

-- Model indexes
CREATE INDEX idx_models_provider ON public.provider_models (provider_id);
CREATE INDEX idx_models_type ON public.provider_models (model_type);
CREATE INDEX idx_models_available ON public.provider_models (is_available);
CREATE INDEX idx_models_family ON public.provider_models (model_family);

-- Usage indexes
CREATE INDEX idx_usage_provider ON public.provider_usage (provider_id);
CREATE INDEX idx_usage_period ON public.provider_usage (period_start, period_end);
CREATE INDEX idx_usage_model ON public.provider_usage (model_id);

-- Health check indexes
CREATE INDEX idx_health_provider ON public.provider_health_checks (provider_id);
CREATE INDEX idx_health_checked_at ON public.provider_health_checks (checked_at DESC);
CREATE INDEX idx_health_status ON public.provider_health_checks (check_status);

-- =====================================================
-- SECTION 6: TRIGGERS AND FUNCTIONS
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_providers_updated_at
    BEFORE UPDATE ON public.providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at
    BEFORE UPDATE ON public.provider_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_models_updated_at
    BEFORE UPDATE ON public.provider_models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_active_config_updated_at
    BEFORE UPDATE ON public.provider_active_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotas_updated_at
    BEFORE UPDATE ON public.provider_quotas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get the best available provider for a service
CREATE OR REPLACE FUNCTION get_best_provider(
    p_service_type TEXT,
    p_model_requirements JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_provider_id UUID;
BEGIN
    -- Select provider based on health and primary status
    SELECT p.id INTO v_provider_id
    FROM public.providers p
    LEFT JOIN public.provider_models m ON m.provider_id = p.id
    WHERE 
        p.is_active = true
        AND p.health_status IN ('healthy', 'degraded')
        AND p_service_type = ANY(p.service_types)
        AND (
            p_model_requirements IS NULL 
            OR m.default_params @> p_model_requirements
        )
    ORDER BY
        p.is_primary DESC,
        p.health_status = 'healthy' DESC,
        RANDOM() -- Basic load balancing
    LIMIT 1;
    
    RETURN v_provider_id;
END;
$$ LANGUAGE plpgsql;

-- Function to rotate credentials
CREATE OR REPLACE FUNCTION rotate_provider_credentials(
    p_provider_id UUID,
    p_new_encrypted_value TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Mark current credentials as rotating
    UPDATE public.provider_credentials
    SET 
        rotation_status = 'rotating',
        is_active = false
    WHERE 
        provider_id = p_provider_id
        AND is_active = true
        AND rotation_status = 'current';
    
    -- Insert new credentials
    INSERT INTO public.provider_credentials (
        provider_id,
        credential_type,
        credential_name,
        encrypted_value,
        rotation_status,
        is_active
    )
    SELECT 
        provider_id,
        credential_type,
        credential_name || '_rotated_' || TO_CHAR(NOW(), 'YYYYMMDD'),
        p_new_encrypted_value,
        'current',
        true
    FROM public.provider_credentials
    WHERE 
        provider_id = p_provider_id
        AND rotation_status = 'rotating'
    LIMIT 1;
    
    -- Mark old credentials as expired
    UPDATE public.provider_credentials
    SET 
        rotation_status = 'expired',
        valid_until = NOW()
    WHERE 
        provider_id = p_provider_id
        AND rotation_status = 'rotating';
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate provider cost
CREATE OR REPLACE FUNCTION calculate_provider_cost(
    p_provider_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
) RETURNS TABLE (
    total_cost DECIMAL(10, 4),
    request_count BIGINT,
    token_count BIGINT,
    breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(estimated_cost) as total_cost,
        SUM(request_count) as request_count,
        SUM(total_tokens) as token_count,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'period', period_start,
                'requests', request_count,
                'tokens', total_tokens,
                'cost', estimated_cost
            )
        ) as breakdown
    FROM public.provider_usage
    WHERE 
        provider_id = p_provider_id
        AND period_start >= p_start_date
        AND period_end <= p_end_date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 7: RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_active_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_incidents ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access" ON public.providers
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON public.provider_credentials
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON public.provider_models
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON public.provider_active_config
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON public.provider_usage
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON public.provider_quotas
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON public.provider_health_checks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON public.provider_incidents
    FOR ALL USING (auth.role() = 'service_role');


-- Authenticated users can read non-sensitive data
CREATE POLICY "Authenticated read providers" ON public.providers
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Authenticated read models" ON public.provider_models
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Authenticated read usage" ON public.provider_usage
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Authenticated read health" ON public.provider_health_checks
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Authenticated read active config" ON public.provider_active_config
    FOR SELECT TO authenticated
    USING (true);

-- =====================================================
-- SECTION 8: INITIAL DATA
-- =====================================================

-- Insert default providers
INSERT INTO public.providers (
    name, display_name, provider_type, service_types, 
    is_active, is_primary, config
) VALUES 
    ('openai-primary', 'OpenAI (Primary)', 'openai', ARRAY['llm', 'embedding', 'vision'], 
     true, true, '{"api_version": "v1"}'),
     
    ('google-primary', 'Google Gemini', 'google', ARRAY['llm', 'embedding', 'vision'], 
     true, false, '{"api_version": "v1"}')
ON CONFLICT (name) DO NOTHING;

-- Insert common models for OpenAI
INSERT INTO public.provider_models (
    provider_id, model_id, model_name, model_type, model_family,
    max_tokens, context_window, supports_streaming, supports_functions,
    input_price_per_1k, output_price_per_1k, latency_category
)
SELECT 
    p.id,
    m.model_id,
    m.model_name,
    m.model_type,
    m.model_family,
    m.max_tokens,
    m.context_window,
    m.supports_streaming,
    m.supports_functions,
    m.input_price,
    m.output_price,
    m.latency_category
FROM public.providers p
CROSS JOIN (VALUES
    ('gpt-4-turbo-preview', 'GPT-4 Turbo', 'llm', 'gpt', 128000, 128000, true, true, 0.01, 0.03, 'fast'),
    ('gpt-4', 'GPT-4', 'llm', 'gpt', 8192, 8192, true, true, 0.03, 0.06, 'standard'),
    ('gpt-3.5-turbo', 'GPT-3.5 Turbo', 'llm', 'gpt', 16385, 16385, true, true, 0.0005, 0.0015, 'fast'),
    ('text-embedding-3-small', 'Text Embedding 3 Small', 'embedding', 'embedding', NULL, NULL, false, false, 0.00002, NULL, 'realtime'),
    ('text-embedding-3-large', 'Text Embedding 3 Large', 'embedding', 'embedding', NULL, NULL, false, false, 0.00013, NULL, 'realtime')
) AS m(model_id, model_name, model_type, model_family, max_tokens, context_window, supports_streaming, supports_functions, input_price, output_price, latency_category)
WHERE p.name = 'openai-primary'
ON CONFLICT (provider_id, model_id) DO NOTHING;

-- Insert common models for Google Gemini
INSERT INTO public.provider_models (
    provider_id, model_id, model_name, model_type, model_family,
    max_tokens, context_window, supports_streaming, supports_functions,
    input_price_per_1k, output_price_per_1k, latency_category
)
SELECT 
    p.id,
    m.model_id,
    m.model_name,
    m.model_type,
    m.model_family,
    m.max_tokens,
    m.context_window,
    m.supports_streaming,
    m.supports_functions,
    m.input_price,
    m.output_price,
    m.latency_category
FROM public.providers p
CROSS JOIN (VALUES
    ('gemini-pro', 'Gemini Pro', 'llm', 'gemini', 32768, 32768, true, true, 0.00025, 0.0005, 'fast'),
    ('gemini-pro-vision', 'Gemini Pro Vision', 'llm', 'gemini', 32768, 32768, true, true, 0.00025, 0.0005, 'fast'),
    ('gemini-1.5-pro', 'Gemini 1.5 Pro', 'llm', 'gemini', 1048576, 1048576, true, true, 0.0035, 0.0105, 'standard'),
    ('embedding-001', 'Text Embedding', 'embedding', 'embedding', NULL, NULL, false, false, 0.0001, NULL, 'realtime')
) AS m(model_id, model_name, model_type, model_family, max_tokens, context_window, supports_streaming, supports_functions, input_price, output_price, latency_category)
WHERE p.name = 'google-primary'
ON CONFLICT (provider_id, model_id) DO NOTHING;

-- Set default active providers (OpenAI for both LLM and embedding)
INSERT INTO public.provider_active_config (service_type, provider_id)
SELECT 'llm', id
FROM public.providers
WHERE name = 'openai-primary' AND is_active = true
ON CONFLICT (service_type) DO NOTHING;

INSERT INTO public.provider_active_config (service_type, provider_id)
SELECT 'embedding', id
FROM public.providers
WHERE name = 'openai-primary' AND is_active = true
ON CONFLICT (service_type) DO NOTHING;

-- =====================================================
-- SECTION 9: COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.providers IS 'Unified provider registry for all AI services with health monitoring and active provider selection';
COMMENT ON TABLE public.provider_credentials IS 'Secure credential storage with rotation support for provider API keys';
COMMENT ON TABLE public.provider_models IS 'Catalog of available models with capabilities, pricing, and configuration';
COMMENT ON TABLE public.provider_active_config IS 'Stores which provider is currently active for each service type';
COMMENT ON TABLE public.provider_usage IS 'Granular usage tracking for cost management and optimization';
COMMENT ON TABLE public.provider_quotas IS 'Usage quotas and rate limiting configuration per provider';
COMMENT ON TABLE public.provider_health_checks IS 'Health check history for monitoring provider availability';
COMMENT ON TABLE public.provider_incidents IS 'Incident tracking for provider outages and degradations';

-- Grant necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
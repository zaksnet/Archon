/**
 * Provider System Types
 * 
 * TypeScript types matching the backend provider schemas
 */

// Enums
export enum ServiceType {
  LLM = 'llm',
  EMBEDDING = 'embedding',
  RERANKING = 'reranking',
  SPEECH = 'speech',
  VISION = 'vision'
}

export enum ProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  COHERE = 'cohere',
  HUGGINGFACE = 'huggingface',
  OLLAMA = 'ollama',
  CUSTOM = 'custom'
}

export enum ModelType {
  LLM = 'llm',
  EMBEDDING = 'embedding',
  RERANKING = 'reranking',
  SPEECH_TO_TEXT = 'speech_to_text',
  TEXT_TO_SPEECH = 'text_to_speech',
  IMAGE_GENERATION = 'image_generation'
}

export enum LatencyCategory {
  REALTIME = 'realtime',
  FAST = 'fast',
  STANDARD = 'standard',
  SLOW = 'slow'
}

export enum QuotaType {
  MONTHLY_COST = 'monthly_cost',
  DAILY_COST = 'daily_cost',
  MONTHLY_REQUESTS = 'monthly_requests',
  DAILY_REQUESTS = 'daily_requests',
  MONTHLY_TOKENS = 'monthly_tokens',
  DAILY_TOKENS = 'daily_tokens'
}

export enum IncidentSeverity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor'
}

// Provider Interfaces
export interface Provider {
  id: string;
  name: string;
  display_name: string;
  provider_type: ProviderType;
  service_types: ServiceType[];
  base_url?: string;
  is_active: boolean;
  is_primary: boolean;
  config?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProviderCreate {
  name: string;
  display_name: string;
  provider_type: ProviderType;
  service_types: ServiceType[];
  base_url?: string;
  is_active?: boolean;
  is_primary?: boolean;
  config?: Record<string, any>;
}

export interface ProviderUpdate {
  display_name?: string;
  base_url?: string;
  is_active?: boolean;
  is_primary?: boolean;
  config?: Record<string, any>;
}

// Credential Interfaces
export interface Credential {
  id: string;
  provider_id: string;
  credential_type: string;
  credential_name: string;
  encrypted_value: string;
  api_key_header?: string;
  api_key_prefix?: string;
  is_active: boolean;
  last_rotated?: string;
  created_at: string;
  updated_at: string;
}

export interface CredentialCreate {
  provider_id?: string;
  credential_type: string;
  credential_name: string;
  credential_value: string;
  api_key_header?: string;
  api_key_prefix?: string;
  is_active?: boolean;
}

export interface CredentialUpdate {
  credential_name?: string;
  is_active?: boolean;
}

// Model Interfaces
export interface Model {
  id: string;
  provider_id: string;
  model_id: string;
  model_name: string;
  model_type: ModelType;
  model_family?: string;
  context_window?: number;
  max_output_tokens?: number;
  embedding_dimensions?: number;
  input_price_per_1k?: number;
  output_price_per_1k?: number;
  latency_category?: LatencyCategory;
  supports_streaming?: boolean;
  supports_functions?: boolean;
  supports_vision?: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModelCreate {
  provider_id?: string;
  model_id: string;
  model_name: string;
  model_type: ModelType;
  model_family?: string;
  context_window?: number;
  max_output_tokens?: number;
  embedding_dimensions?: number;
  input_price_per_1k?: number;
  output_price_per_1k?: number;
  latency_category?: LatencyCategory;
  supports_streaming?: boolean;
  supports_functions?: boolean;
  supports_vision?: boolean;
  is_available?: boolean;
}

export interface ModelUpdate {
  model_name?: string;
  context_window?: number;
  max_output_tokens?: number;
  input_price_per_1k?: number;
  output_price_per_1k?: number;
  latency_category?: LatencyCategory;
  is_available?: boolean;
}

// Active Provider Interfaces
export interface ActiveProviders {
  llm_provider_id: string | null;
  embedding_provider_id: string | null;
}

export interface SetActiveProviderRequest {
  service_type: ServiceType;
  provider_id: string;
}


// Usage Tracking Interfaces
export interface UsageMetrics {
  id: string;
  provider_id: string;
  model_id?: string;
  operation_type: string;
  date: string;
  hour?: number;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost: number;
  avg_response_time_ms: number;
  min_response_time_ms: number;
  max_response_time_ms: number;
}

export interface UsageSummary {
  total_cost: number;
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  providers: Array<{
    provider_id: string;
    provider_name: string;
    cost: number;
    requests: number;
  }>;
  models: Array<{
    model_id: string;
    model_name: string;
    cost: number;
    requests: number;
  }>;
}

// Quota Interfaces
export interface Quota {
  id: string;
  provider_id: string;
  quota_type: QuotaType;
  limit_value: number;
  current_usage: number;
  warning_threshold?: number;
  action_on_exceed?: string;
  period_start: string;
  period_end: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuotaCreate {
  provider_id?: string;
  quota_type: QuotaType;
  limit_value: number;
  warning_threshold?: number;
  action_on_exceed?: string;
  is_active?: boolean;
}

export interface QuotaUpdate {
  limit_value?: number;
  warning_threshold?: number;
  action_on_exceed?: string;
  is_active?: boolean;
}

// Health Check Interfaces
export interface HealthCheckResult {
  id?: string;
  provider_id: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms: number;
  error_message?: string;
  services_tested: ServiceType[];
  metadata?: Record<string, any>;
  checked_at: string;
}

// Incident Interfaces
export interface Incident {
  id: string;
  provider_id: string;
  incident_type: string;
  severity: IncidentSeverity;
  status: 'open' | 'investigating' | 'resolved';
  description: string;
  affected_services?: ServiceType[];
  started_at: string;
  resolved_at?: string;
  resolution?: string;
  metadata?: Record<string, any>;
}

export interface IncidentCreate {
  provider_id?: string;
  incident_type: string;
  severity: IncidentSeverity;
  description: string;
  affected_services?: ServiceType[];
}

export interface IncidentUpdate {
  status?: 'open' | 'investigating' | 'resolved';
  resolution?: string;
  metadata?: Record<string, any>;
}

// AI Operation Interfaces
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  provider_id?: string;
  routing_strategy?: string;
}

export interface ChatResponse {
  id: string;
  choices: Array<{
    message: ChatMessage;
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  provider_used: string;
  model_used: string;
  response_time_ms: number;
}

export interface EmbeddingRequest {
  texts: string[];
  model?: string;
  provider_id?: string;
  routing_strategy?: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model_used: string;
  provider_used: string;
  usage?: {
    total_tokens: number;
  };
  response_time_ms: number;
}
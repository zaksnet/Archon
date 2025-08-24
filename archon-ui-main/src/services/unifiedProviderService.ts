/**
 * Unified Provider Service
 * 
 * API client for the unified provider system
 */

import { apiRequest } from './api';
import { API_ROUTES } from '../routes';
import type {
  Provider,
  ProviderCreate,
  ProviderUpdate,
  Credential,
  CredentialCreate,
  CredentialUpdate,
  Model,
  ModelCreate,
  ModelUpdate,
  ActiveProviders,
  SetActiveProviderRequest,
  UsageMetrics,
  UsageSummary,
  Quota,
  QuotaCreate,
  QuotaUpdate,
  HealthCheckResult,
  Incident,
  IncidentCreate,
  IncidentUpdate,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ServiceType,
  ModelType
} from '../types/provider';

// ==================== Provider Management ====================

export const providerApi = {
  /**
   * Create a new provider
   */
  create: async (data: ProviderCreate): Promise<Provider> => {
    return apiRequest<Provider>(API_ROUTES.providers.create(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  /**
   * Get a provider by ID
   */
  get: async (providerId: string): Promise<Provider> => {
    return apiRequest<Provider>(API_ROUTES.providers.detail(providerId));
  },

  /**
   * List all providers with optional filters
   */
  list: async (params?: {
    service_type?: ServiceType;
    is_active?: boolean;
  }): Promise<Provider[]> => {
    const queryParams = new URLSearchParams();
    if (params?.service_type) queryParams.append('service_type', params.service_type);
    if (params?.is_active !== undefined) queryParams.append('is_active', String(params.is_active));
    
    const route = API_ROUTES.providers.list();
    const url = queryParams.toString() ? `${route}?${queryParams}` : route;
    return apiRequest<Provider[]>(url);
  },

  /**
   * Update a provider
   */
  update: async (providerId: string, data: ProviderUpdate): Promise<Provider> => {
    return apiRequest<Provider>(API_ROUTES.providers.update(providerId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  /**
   * Delete (deactivate) a provider
   */
  delete: async (providerId: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(API_ROUTES.providers.delete(providerId), {
      method: 'DELETE'
    });
  },

  /**
   * Get active providers for all service types
   */
  getActive: async (): Promise<ActiveProviders> => {
    return apiRequest<ActiveProviders>(API_ROUTES.providers.get_active());
  },

  /**
   * Set a provider as active for a service type
   */
  setActive: async (data: SetActiveProviderRequest): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(API_ROUTES.providers.set_active(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
};

// ==================== Credential Management ====================

export const credentialApi = {
  /**
   * Add credentials to a provider
   */
  add: async (providerId: string, data: CredentialCreate): Promise<Credential> => {
    return apiRequest<Credential>(API_ROUTES.providers.add_credential(providerId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  /**
   * Rotate a credential
   */
  rotate: async (credentialId: string, newValue: string): Promise<Credential> => {
    return apiRequest<Credential>(API_ROUTES.providers.rotate_credential(credentialId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_value: newValue })
    });
  }
};

// ==================== Model Management ====================

export const modelApi = {
  /**
   * Add a model to a provider
   */
  add: async (providerId: string, data: ModelCreate): Promise<Model> => {
    return apiRequest<Model>(API_ROUTES.providers.add_model(providerId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  /**
   * List all models with optional filters
   */
  list: async (params?: {
    provider_id?: string;
    model_type?: ModelType;
    is_available?: boolean;
  }): Promise<Model[]> => {
    const queryParams = new URLSearchParams();
    if (params?.provider_id) queryParams.append('provider_id', params.provider_id);
    if (params?.model_type) queryParams.append('model_type', params.model_type);
    if (params?.is_available !== undefined) queryParams.append('is_available', String(params.is_available));
    
    const route = API_ROUTES.providers.list_models();
    const url = queryParams.toString() ? `${route}?${queryParams}` : route;
    return apiRequest<Model[]>(url);
  }
};


// ==================== Health Monitoring ====================

export const healthApi = {
  /**
   * Perform a health check on a provider
   */
  check: async (providerId: string): Promise<HealthCheckResult> => {
    return apiRequest<HealthCheckResult>(API_ROUTES.providers.health_check(providerId), {
      method: 'POST'
    });
  },

  /**
   * Get health check history for a provider
   */
  history: async (providerId: string, limit: number = 10): Promise<HealthCheckResult[]> => {
    const route = API_ROUTES.providers.health_history(providerId);
    return apiRequest<HealthCheckResult[]>(`${route}?limit=${limit}`);
  }
};

// ==================== Usage & Cost Tracking ====================

export const usageApi = {
  /**
   * Get usage metrics for a provider
   */
  getProviderUsage: async (
    providerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<UsageMetrics[]> => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    const route = API_ROUTES.providers.get_usage(providerId);
    const url = queryParams.toString() ? `${route}?${queryParams}` : route;
    return apiRequest<UsageMetrics[]>(url);
  },

  /**
   * Get usage summary across all providers
   */
  getSummary: async (startDate?: string, endDate?: string): Promise<UsageSummary> => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    const route = API_ROUTES.providers.usage_summary();
    const url = queryParams.toString() ? `${route}?${queryParams}` : route;
    return apiRequest<UsageSummary>(url);
  }
};

// ==================== Quota Management ====================

export const quotaApi = {
  /**
   * Create a quota for a provider
   */
  create: async (providerId: string, data: QuotaCreate): Promise<Quota> => {
    return apiRequest<Quota>(API_ROUTES.providers.create_quota(providerId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  /**
   * List quotas for a provider
   */
  list: async (providerId: string): Promise<Quota[]> => {
    return apiRequest<Quota[]>(API_ROUTES.providers.list_quotas(providerId));
  }
};

// ==================== AI Operations ====================

export const aiApi = {
  /**
   * Generate embeddings using the best available provider
   */
  embeddings: async (data: EmbeddingRequest): Promise<EmbeddingResponse> => {
    return apiRequest<EmbeddingResponse>(API_ROUTES.providers.embeddings(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  /**
   * Generate chat completion using the best available provider
   */
  chat: async (data: ChatRequest): Promise<ChatResponse> => {
    return apiRequest<ChatResponse>(API_ROUTES.providers.chat(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
};

// ==================== Incident Management ====================

export const incidentApi = {
  /**
   * Create an incident for a provider
   */
  create: async (providerId: string, data: IncidentCreate): Promise<Incident> => {
    return apiRequest<Incident>(API_ROUTES.providers.create_incident(providerId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  /**
   * Update an incident
   */
  update: async (incidentId: string, data: IncidentUpdate): Promise<Incident> => {
    return apiRequest<Incident>(API_ROUTES.providers.update_incident(incidentId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  /**
   * List incidents for a provider
   */
  list: async (providerId: string, includeResolved: boolean = false): Promise<Incident[]> => {
    const route = API_ROUTES.providers.list_incidents(providerId);
    return apiRequest<Incident[]>(`${route}?include_resolved=${includeResolved}`);
  
  }
};

// Export everything as a unified API
export const unifiedProviderApi = {
  providers: providerApi,
  credentials: credentialApi,
  models: modelApi,
  health: healthApi,
  usage: usageApi,
  quotas: quotaApi,
  ai: aiApi,
  incidents: incidentApi
};
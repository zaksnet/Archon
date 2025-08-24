import { apiRequest } from './api';

// Types
export interface Provider {
  id: string;
  name: string;
  provider_type: string;
  is_active: boolean;
  config: {
    api_key?: string;
    base_url?: string;
    model?: string;
    [key: string]: any;
  };
}

export interface CreateProviderData {
  name: string;
  provider_type: string;
  config: {
    api_key?: string;
    base_url?: string;
    model?: string;
    [key: string]: any;
  };
  is_active?: boolean;
}

export interface UpdateProviderData extends Partial<CreateProviderData> {
  id: string;
}

// API endpoints
const PROVIDERS_BASE = '/api/providers';

/**
 * Get all providers
 */
export const getProviders = async (): Promise<Provider[]> => {
  return apiRequest<Provider[]>(`${PROVIDERS_BASE}/llm`);
};

/**
 * Get a single provider by ID
 */
export const getProvider = async (id: string): Promise<Provider> => {
  return apiRequest<Provider>(`${PROVIDERS_BASE}/llm/${id}`);
};

/**
 * Create a new provider
 */
export const createProvider = async (data: CreateProviderData): Promise<Provider> => {
  return apiRequest<Provider>(`${PROVIDERS_BASE}/llm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

/**
 * Update an existing provider
 */
export const updateProvider = async (data: UpdateProviderData): Promise<Provider> => {
  const { id, ...updateData } = data;
  return apiRequest<Provider>(`${PROVIDERS_BASE}/llm/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });
};

/**
 * Delete a provider
 */
export const deleteProvider = async (id: string): Promise<void> => {
  return apiRequest<void>(`${PROVIDERS_BASE}/llm/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Get all embedding providers
 */
export const getEmbeddingProviders = async (): Promise<Provider[]> => {
  return apiRequest<Provider[]>(`${PROVIDERS_BASE}/embedding`);
};

/**
 * Get a single embedding provider by ID
 */
export const getEmbeddingProvider = async (id: string): Promise<Provider> => {
  return apiRequest<Provider>(`${PROVIDERS_BASE}/embedding/${id}`);
};

/**
 * Create a new embedding provider
 */
export const createEmbeddingProvider = async (data: CreateProviderData): Promise<Provider> => {
  return apiRequest<Provider>(`${PROVIDERS_BASE}/embedding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

/**
 * Update an existing embedding provider
 */
export const updateEmbeddingProvider = async (data: UpdateProviderData): Promise<Provider> => {
  const { id, ...updateData } = data;
  return apiRequest<Provider>(`${PROVIDERS_BASE}/embedding/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });
};

/**
 * Delete an embedding provider
 */
export const deleteEmbeddingProvider = async (id: string): Promise<void> => {
  return apiRequest<void>(`${PROVIDERS_BASE}/embedding/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Get the active provider
 */
export const getActiveProvider = async (): Promise<Provider> => {
  return apiRequest<Provider>(`${PROVIDERS_BASE}/active`);
};

/**
 * Set the active provider
 */
export const setActiveProvider = async (id: string): Promise<void> => {
  return apiRequest<void>(`${PROVIDERS_BASE}/active`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ provider_id: id }),
  });
};

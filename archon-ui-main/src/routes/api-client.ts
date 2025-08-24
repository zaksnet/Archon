/**
 * Type-safe API client utilities
 * 
 * Provides type-safe wrappers around fetch for API calls
 */

import { API_ROUTES } from './routes.generated';

/**
 * Base configuration for API requests
 */
export interface ApiConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

/**
 * API error with additional context
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Default API configuration
 */
const defaultConfig: ApiConfig = {
  baseUrl: '', // Use relative URLs for Vite proxy
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'same-origin',
};

/**
 * Type-safe API request function
 * 
 * @param routeBuilder - Function that returns the route path
 * @param options - Fetch options
 * @param config - API configuration
 * @returns Promise with the response data
 */
export async function apiRequest<T>(
  routeBuilder: (...args: any[]) => string,
  routeParams: any[] = [],
  options: RequestInit = {},
  config: ApiConfig = defaultConfig
): Promise<T> {
  const route = routeBuilder(...routeParams);
  const url = `${config.baseUrl || ''}${route}`;
  
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      ...config.headers,
      ...options.headers,
    },
    credentials: config.credentials,
  };
  
  try {
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      
      throw new ApiError(
        errorData?.detail || errorData?.message || `Request failed: ${response.statusText}`,
        response.status,
        response.statusText,
        errorData
      );
    }
    
    // Handle empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : 'An unknown error occurred'
    );
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  /**
   * GET request
   */
  get<T>(
    routeBuilder: (...args: any[]) => string,
    routeParams: any[] = [],
    config?: ApiConfig
  ): Promise<T> {
    return apiRequest<T>(routeBuilder, routeParams, { method: 'GET' }, config);
  },
  
  /**
   * POST request
   */
  post<T>(
    routeBuilder: (...args: any[]) => string,
    routeParams: any[] = [],
    body?: any,
    config?: ApiConfig
  ): Promise<T> {
    return apiRequest<T>(
      routeBuilder,
      routeParams,
      {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      config
    );
  },
  
  /**
   * PUT request
   */
  put<T>(
    routeBuilder: (...args: any[]) => string,
    routeParams: any[] = [],
    body?: any,
    config?: ApiConfig
  ): Promise<T> {
    return apiRequest<T>(
      routeBuilder,
      routeParams,
      {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      },
      config
    );
  },
  
  /**
   * PATCH request
   */
  patch<T>(
    routeBuilder: (...args: any[]) => string,
    routeParams: any[] = [],
    body?: any,
    config?: ApiConfig
  ): Promise<T> {
    return apiRequest<T>(
      routeBuilder,
      routeParams,
      {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      },
      config
    );
  },
  
  /**
   * DELETE request
   */
  delete<T>(
    routeBuilder: (...args: any[]) => string,
    routeParams: any[] = [],
    config?: ApiConfig
  ): Promise<T> {
    return apiRequest<T>(
      routeBuilder,
      routeParams,
      { method: 'DELETE' },
      config
    );
  },
};

/**
 * Create a typed API client for a specific service
 */
export function createApiClient<TRoutes extends Record<string, (...args: any[]) => string>>(
  routes: TRoutes,
  config?: ApiConfig
) {
  return {
    get<T>(
      route: keyof TRoutes,
      params: Parameters<TRoutes[keyof TRoutes]> = [] as any
    ): Promise<T> {
      return api.get<T>(routes[route] as any, params, config);
    },
    
    post<T>(
      route: keyof TRoutes,
      params: Parameters<TRoutes[keyof TRoutes]> = [] as any,
      body?: any
    ): Promise<T> {
      return api.post<T>(routes[route] as any, params, body, config);
    },
    
    put<T>(
      route: keyof TRoutes,
      params: Parameters<TRoutes[keyof TRoutes]> = [] as any,
      body?: any
    ): Promise<T> {
      return api.put<T>(routes[route] as any, params, body, config);
    },
    
    patch<T>(
      route: keyof TRoutes,
      params: Parameters<TRoutes[keyof TRoutes]> = [] as any,
      body?: any
    ): Promise<T> {
      return api.patch<T>(routes[route] as any, params, body, config);
    },
    
    delete<T>(
      route: keyof TRoutes,
      params: Parameters<TRoutes[keyof TRoutes]> = [] as any
    ): Promise<T> {
      return api.delete<T>(routes[route] as any, params, config);
    },
  };
}
/**
 * Error handling utilities for consistent error formatting across the frontend.
 */

export interface SupabaseErrorDetail {
  error: string;
  error_type: string;
  full_error: string;
  supabase_message?: string;
  supabase_details?: string;
  supabase_hint?: string;
  supabase_code?: string;
}

/**
 * Extract detailed error information from API responses.
 */
export function extractErrorDetails(errorData: any): string {
  if (errorData.detail) {
    if (typeof errorData.detail === 'object') {
      // Enhanced error format with full Supabase details
      const detail = errorData.detail as SupabaseErrorDetail;
      let fullErrorDetails = `Error: ${detail.error || 'Unknown error'}\n`;
      fullErrorDetails += `Type: ${detail.error_type || 'Unknown'}\n`;
      
      if (detail.supabase_message) {
        fullErrorDetails += `Supabase Message: ${detail.supabase_message}\n`;
      }
      if (detail.supabase_details) {
        fullErrorDetails += `Supabase Details: ${detail.supabase_details}\n`;
      }
      if (detail.supabase_hint) {
        fullErrorDetails += `Supabase Hint: ${detail.supabase_hint}\n`;
      }
      if (detail.supabase_code) {
        fullErrorDetails += `Supabase Code: ${detail.supabase_code}\n`;
      }
      if (detail.full_error) {
        fullErrorDetails += `Full Error: ${detail.full_error}\n`;
      }
      
      return fullErrorDetails;
    } else {
      return errorData.detail;
    }
  } else if (errorData.message) {
    return errorData.message;
  } else if (errorData.error) {
    return errorData.error;
  } else if (typeof errorData === 'string') {
    return errorData;
  } else {
    // If it's an object, stringify it to see the full structure
    return JSON.stringify(errorData, null, 2);
  }
}

/**
 * Create a detailed error object with enhanced information.
 */
export function createDetailedError(
  errorMessage: string, 
  response: Response, 
  errorDetails: string
): Error & { 
  status: number; 
  statusText: string; 
  details: string; 
  response: Response; 
} {
  const detailedError = new Error(errorMessage) as any;
  detailedError.status = response.status;
  detailedError.statusText = response.statusText;
  detailedError.details = errorDetails;
  detailedError.response = response;
  
  return detailedError;
}

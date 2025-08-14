export interface DetailedError extends Error {
  status?: number;
  statusText?: string;
  details?: string;
  response?: Response;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  suggestion: string;
  severity: 'error' | 'warning' | 'info';
}

export class OnboardingErrorHandler {
  /**
   * Converts technical errors into user-friendly error messages
   */
  static getUserFriendlyError(error: unknown, context: string): UserFriendlyError {
    const detailedError = error as DetailedError;
    
    // Handle network/connection errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        suggestion: 'Try refreshing the page or check if the backend server is running.',
        severity: 'error'
      };
    }

    // Handle HTTP status errors
    if (detailedError.status) {
      return this.handleHttpError(detailedError, context);
    }

    // Handle specific error messages
    if (error instanceof Error) {
      return this.handleSpecificErrors(error, context);
    }

    // Default fallback
    return {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred while saving your configuration.',
      suggestion: 'Please try again or contact support if the problem persists.',
      severity: 'error'
    };
  }

  /**
   * Handles HTTP status code errors
   */
  private static handleHttpError(error: DetailedError, context: string): UserFriendlyError {
    const { status, details } = error;
    
    switch (status) {
      case 400:
        return {
          title: 'Invalid Configuration',
          message: 'The configuration data is invalid or incomplete.',
          suggestion: 'Please check your input and try again.',
          severity: 'error'
        };

      case 401:
        return {
          title: 'Authentication Required',
          message: 'You need to be authenticated to perform this action.',
          suggestion: 'Please log in and try again.',
          severity: 'error'
        };

      case 403:
        return {
          title: 'Access Denied',
          message: 'You don\'t have permission to perform this action.',
          suggestion: 'Please check your account permissions or contact an administrator.',
          severity: 'error'
        };

      case 404:
        return {
          title: 'Service Not Found',
          message: 'The requested service or endpoint was not found.',
          suggestion: 'Please check if the backend server is running correctly.',
          severity: 'error'
        };

      case 409:
        return {
          title: 'Configuration Already Exists',
          message: 'This configuration already exists in the system.',
          suggestion: 'You can update the existing configuration in Settings instead.',
          severity: 'warning'
        };

      case 422:
        return {
          title: 'Validation Error',
          message: 'The provided data failed validation.',
          suggestion: 'Please check your input and ensure all required fields are correct.',
          severity: 'error'
        };

      case 500:
        return this.handleServerError(details as string, context);

      case 502:
      case 503:
      case 504:
        return {
          title: 'Service Unavailable',
          message: 'The server is temporarily unavailable.',
          suggestion: 'Please try again in a few moments.',
          severity: 'error'
        };

      default:
        return {
          title: 'Server Error',
          message: `Server returned an error (${status}): ${details || error.statusText || 'Unknown error'}`,
          suggestion: 'Please try again or contact support if the problem persists.',
          severity: 'error'
        };
    }
  }

  /**
   * Handles server errors (500 status) with specific details
   */
  private static handleServerError(details: string | object, context: string): UserFriendlyError {
    console.log('handleServerError called with details:', details, 'type:', typeof details);
    
    // Simply convert details to a readable string
    let errorMessage = '';
    if (typeof details === 'object' && details !== null) {
      errorMessage = JSON.stringify(details, null, 2);
    } else if (typeof details === 'string') {
      errorMessage = details;
    } else {
      errorMessage = String(details);
    }
    
    // Return the raw error details
    return {
      title: 'Server Error',
      message: `Server returned: ${errorMessage}`,
      suggestion: 'Please check the technical details below for more information.',
      severity: 'error'
    };
  }

  /**
   * Handles specific error messages
   */
  private static handleSpecificErrors(error: Error, context: string): UserFriendlyError {
    const message = error.message.toLowerCase();
    
    if (message.includes('duplicate') || message.includes('already exists')) {
      return {
        title: 'Configuration Already Exists',
        message: 'This configuration already exists in the system.',
        suggestion: 'You can update the existing configuration in Settings instead.',
        severity: 'warning'
      };
    }

    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Network Error',
        message: 'Unable to connect to the server.',
        suggestion: 'Please check your internet connection and try again.',
        severity: 'error'
      };
    }

    if (message.includes('timeout')) {
      return {
        title: 'Request Timeout',
        message: 'The request took too long to complete.',
        suggestion: 'Please try again or check your internet connection.',
        severity: 'error'
      };
    }

    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
        suggestion: 'Please check your account permissions or contact an administrator.',
        severity: 'error'
      };
    }

    // Default for specific errors
    return {
      title: 'Configuration Error',
      message: error.message,
      suggestion: 'Please check your input and try again.',
      severity: 'error'
    };
  }

  /**
   * Logs detailed error information for debugging
   */
  static logError(error: unknown, context: string): void {
    const detailedError = error as DetailedError;
    
    console.error(`ONBOARDING_ERROR [${context}]:`, {
      message: detailedError.message,
      status: detailedError.status,
      statusText: detailedError.statusText,
      details: detailedError.details,
      stack: detailedError.stack,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Gets a user-friendly error message for display
   */
  static getDisplayMessage(error: UserFriendlyError): string {
    return `${error.message} ${error.suggestion}`;
  }
}

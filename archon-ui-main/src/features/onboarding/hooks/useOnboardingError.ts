import { useState, useCallback, useRef } from 'react';
import { useToast } from '../../../contexts/ToastContext';

export interface OnboardingError {
  id: string;
  type: 'validation' | 'network' | 'permission' | 'unknown';
  message: string;
  details?: any;
  timestamp: Date;
  retryCount: number;
  recoverable: boolean;
}

export interface ErrorHandlingOptions {
  maxRetries?: number;
  retryDelay?: number;
  showToast?: boolean;
  logToConsole?: boolean;
}

export const useOnboardingError = (options: ErrorHandlingOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    showToast: shouldShowToast = true,
    logToConsole: shouldLogToConsole = true
  } = options;

  const [errors, setErrors] = useState<OnboardingError[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const { showToast } = useToast();

  const generateErrorId = useCallback(() => {
    return `onboarding-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addError = useCallback((
    type: OnboardingError['type'],
    message: string,
    details?: any,
    recoverable: boolean = true
  ) => {
    const error: OnboardingError = {
      id: generateErrorId(),
      type,
      message,
      details,
      timestamp: new Date(),
      retryCount: 0,
      recoverable
    };

    setErrors(prev => [...prev, error]);

    if (shouldLogToConsole) {
      console.error('ONBOARDING_ERROR:', {
        id: error.id,
        type: error.type,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp.toISOString(),
        recoverable: error.recoverable
      });
    }

    if (shouldShowToast) {
      const toastType = type === 'validation' ? 'warning' : 'error';
      showToast(message, toastType);
    }

    return error.id;
  }, [generateErrorId, shouldLogToConsole, shouldShowToast, showToast]);

  const removeError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
    
    // Clear any pending retry timeout
    const timeout = retryTimeouts.current.get(errorId);
    if (timeout) {
      clearTimeout(timeout);
      retryTimeouts.current.delete(errorId);
    }
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
    
    // Clear all pending retry timeouts
    retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
    retryTimeouts.current.clear();
  }, []);

  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    errorId: string,
    operationName: string
  ): Promise<T | null> => {
    const error = errors.find(e => e.id === errorId);
    if (!error) {
      throw new Error(`Error with ID ${errorId} not found`);
    }

    if (error.retryCount >= maxRetries) {
      addError('unknown', `Failed to ${operationName} after ${maxRetries} attempts`, {
        originalError: error,
        operationName
      }, false);
      return null;
    }

    setIsRecovering(true);
    
    try {
      // Wait before retrying
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, retryDelay * (error.retryCount + 1));
        retryTimeouts.current.set(errorId, timeout);
      });

      // Update retry count
      setErrors(prev => prev.map(e => 
        e.id === errorId 
          ? { ...e, retryCount: e.retryCount + 1 }
          : e
      ));

      // Attempt the operation
      const result = await operation();
      
      // Success - remove the error
      removeError(errorId);
      setIsRecovering(false);
      
      if (shouldShowToast) {
        showToast(`${operationName} completed successfully`, 'success');
      }
      
      return result;
    } catch (retryError) {
      setIsRecovering(false);
      
      const retryErrorMessage = retryError instanceof Error ? retryError.message : 'Unknown error';
      
      if (shouldLogToConsole) {
        console.error(`RETRY_FAILED for ${operationName}:`, {
          errorId,
          retryCount: error.retryCount + 1,
          error: retryErrorMessage
        });
      }
      
      // Schedule next retry if we haven't exceeded max retries
      if (error.retryCount + 1 < maxRetries) {
        setTimeout(() => {
          retryOperation(operation, errorId, operationName);
        }, retryDelay * (error.retryCount + 2));
      } else {
        addError('unknown', `Failed to ${operationName} after ${maxRetries} attempts`, {
          originalError: error,
          retryError: retryErrorMessage,
          operationName
        }, false);
      }
      
      return null;
    }
  }, [errors, maxRetries, retryDelay, addError, removeError, shouldShowToast, shouldLogToConsole, showToast]);

  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    errorType: OnboardingError['type'] = 'unknown'
  ): Promise<T | null> => {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorId = addError(errorType, `${operationName} failed: ${errorMessage}`, {
        operationName,
        originalError: error
      });
      
      // If the error is recoverable, attempt retry
      const currentError = errors.find(e => e.id === errorId);
      if (currentError?.recoverable) {
        return retryOperation(operation, errorId, operationName);
      }
      
      return null;
    }
  }, [addError, errors, retryOperation]);

  const getErrorsByType = useCallback((type: OnboardingError['type']) => {
    return errors.filter(error => error.type === type);
  }, [errors]);

  const hasErrors = useCallback(() => {
    return errors.length > 0;
  }, [errors]);

  const hasUnrecoverableErrors = useCallback(() => {
    return errors.some(error => !error.recoverable);
  }, [errors]);

  return {
    errors,
    isRecovering,
    addError,
    removeError,
    clearErrors,
    retryOperation,
    handleAsyncOperation,
    getErrorsByType,
    hasErrors,
    hasUnrecoverableErrors
  };
};

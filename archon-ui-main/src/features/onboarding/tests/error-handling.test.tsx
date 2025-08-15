import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { OnboardingValidator, type ValidationResult } from '../utils/validation';
import { OnboardingErrorBoundary } from '../components/error-handling/OnboardingErrorBoundary';
import { useOnboardingError } from '../hooks/useOnboardingError';

// Mock the toast context
vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}));

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for error boundary');
  }
  return <div>No error</div>;
};

// Test component for the error hook
const TestErrorHook = () => {
  const { addError, errors, clearErrors, hasErrors } = useOnboardingError();
  
  return (
    <div>
      <button onClick={() => addError('validation', 'Test validation error')}>
        Add Validation Error
      </button>
      <button onClick={() => addError('network', 'Test network error')}>
        Add Network Error
      </button>
      <button onClick={clearErrors}>Clear Errors</button>
      <div data-testid="error-count">{errors.length}</div>
      <div data-testid="has-errors">{hasErrors().toString()}</div>
    </div>
  );
};

describe('OnboardingValidator', () => {
  describe('validateApiKey', () => {
    test('validates OpenAI API key correctly', () => {
      const validKey = 'sk-12345678901234567890123456789012';
      const result = OnboardingValidator.validateApiKey(validKey, 'openai');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('detects invalid OpenAI API key format', () => {
      const invalidKey = 'invalid-key';
      const result = OnboardingValidator.validateApiKey(invalidKey, 'openai');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_PREFIX');
    });

    test('detects missing API key', () => {
      const result = OnboardingValidator.validateApiKey('', 'openai');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_API_KEY');
    });

    test('detects API key with spaces', () => {
      const keyWithSpaces = 'sk-12345678901234567890123456789012 ';
      const result = OnboardingValidator.validateApiKey(keyWithSpaces, 'openai');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('CONTAINS_SPACES');
    });

    test('validates Anthropic API key correctly', () => {
      const validKey = 'sk-ant-12345678901234567890123456789012';
      const result = OnboardingValidator.validateApiKey(validKey, 'anthropic');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('validates Google API key correctly', () => {
      const validKey = 'AIza123456789012345678901234567890123456789';
      const result = OnboardingValidator.validateApiKey(validKey, 'google');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('returns valid for Ollama (no API key required)', () => {
      const result = OnboardingValidator.validateApiKey('', 'ollama');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('detects unknown provider', () => {
      const result = OnboardingValidator.validateApiKey('test-key', 'unknown-provider');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('UNKNOWN_PROVIDER');
    });

    test('provides warnings for unusually long keys', () => {
      const longKey = 'sk-' + 'a'.repeat(200);
      const result = OnboardingValidator.validateApiKey(longKey, 'openai');
      
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('UNUSUALLY_LONG');
    });
  });

  describe('validateProviderConfig', () => {
    test('validates valid provider config', () => {
      const validConfig = {
        id: 'test-provider',
        name: 'Test Provider',
        description: 'A test provider',
        requiresApiKey: true,
        apiKeyField: 'TEST_API_KEY',
        accentColor: 'purple' as const
      };
      
      const result = OnboardingValidator.validateProviderConfig(validConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('detects missing required fields', () => {
      const invalidConfig = {
        id: '',
        name: '',
        description: '',
        requiresApiKey: true
      };
      
      const result = OnboardingValidator.validateProviderConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors.some(e => e.code === 'MISSING_PROVIDER_ID')).toBe(true);
      expect(result.errors.some(e => e.code === 'MISSING_PROVIDER_NAME')).toBe(true);
      expect(result.errors.some(e => e.code === 'MISSING_PROVIDER_DESCRIPTION')).toBe(true);
    });

    test('detects missing API key field when required', () => {
      const invalidConfig = {
        id: 'test-provider',
        name: 'Test Provider',
        description: 'A test provider',
        requiresApiKey: true
        // Missing apiKeyField
      };
      
      const result = OnboardingValidator.validateProviderConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_API_KEY_FIELD');
    });

    test('detects invalid accent color', () => {
      const invalidConfig = {
        id: 'test-provider',
        name: 'Test Provider',
        description: 'A test provider',
        requiresApiKey: false,
        accentColor: 'invalid-color' as any
      };
      
      const result = OnboardingValidator.validateProviderConfig(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_ACCENT_COLOR');
    });
  });

  describe('validateOnboardingState', () => {
    test('validates valid onboarding state', () => {
      const validState = {
        currentStep: 2,
        provider: 'openai',
        apiKey: 'sk-12345678901234567890123456789012'
      };
      
      const result = OnboardingValidator.validateOnboardingState(validState);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('detects invalid step', () => {
      const invalidState = {
        currentStep: 5,
        provider: 'openai'
      };
      
      const result = OnboardingValidator.validateOnboardingState(invalidState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_STEP');
    });

    test('detects missing provider', () => {
      const invalidState = {
        currentStep: 2,
        provider: ''
      };
      
      const result = OnboardingValidator.validateOnboardingState(invalidState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_PROVIDER');
    });
  });

  describe('sanitizeApiKey', () => {
    test('removes whitespace and special characters', () => {
      const dirtyKey = ' sk-12345678901234567890123456789012 \n\t';
      const sanitized = OnboardingValidator.sanitizeApiKey(dirtyKey);
      
      expect(sanitized).toBe('sk-12345678901234567890123456789012');
    });

    test('preserves valid characters', () => {
      const key = 'sk-12345678901234567890123456789012_abc-def';
      const sanitized = OnboardingValidator.sanitizeApiKey(key);
      
      expect(sanitized).toBe('sk-12345678901234567890123456789012_abc-def');
    });
  });

  describe('getErrorMessage', () => {
    test('returns user-friendly error messages', () => {
      const error = {
        field: 'apiKey',
        message: 'API key is required',
        code: 'MISSING_API_KEY',
        severity: 'error' as const
      };
      
      const message = OnboardingValidator.getErrorMessage(error);
      
      expect(message).toBe('Please enter your API key');
    });

    test('returns original message for unknown error codes', () => {
      const error = {
        field: 'unknown',
        message: 'Custom error message',
        code: 'UNKNOWN_CODE',
        severity: 'error' as const
      };
      
      const message = OnboardingValidator.getErrorMessage(error);
      
      expect(message).toBe('Custom error message');
    });
  });
});

describe('OnboardingErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('renders children when no error occurs', () => {
    render(
      <OnboardingErrorBoundary>
        <div>Test content</div>
      </OnboardingErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('renders error UI when error occurs', () => {
    render(
      <OnboardingErrorBoundary>
        <ThrowError shouldThrow={true} />
      </OnboardingErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Go to Home')).toBeInTheDocument();
  });

  test('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(
      <OnboardingErrorBoundary>
        <ThrowError shouldThrow={true} />
      </OnboardingErrorBoundary>
    );
    
    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  test('handles retry functionality', async () => {
    render(
      <OnboardingErrorBoundary>
        <ThrowError shouldThrow={true} />
      </OnboardingErrorBoundary>
    );
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    
    // Should show the error content again since the component still throws
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  test('handles go home functionality', () => {
    const mockLocation = { href: '' };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    });
    
    render(
      <OnboardingErrorBoundary>
        <ThrowError shouldThrow={true} />
      </OnboardingErrorBoundary>
    );
    
    const homeButton = screen.getByText('Go to Home');
    fireEvent.click(homeButton);
    
    expect(mockLocation.href).toBe('/');
  });
});

describe('useOnboardingError', () => {
  test('manages errors correctly', () => {
    render(<TestErrorHook />);
    
    // Initially no errors
    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
    expect(screen.getByTestId('has-errors')).toHaveTextContent('false');
    
    // Add validation error
    fireEvent.click(screen.getByText('Add Validation Error'));
    expect(screen.getByTestId('error-count')).toHaveTextContent('1');
    expect(screen.getByTestId('has-errors')).toHaveTextContent('true');
    
    // Add network error
    fireEvent.click(screen.getByText('Add Network Error'));
    expect(screen.getByTestId('error-count')).toHaveTextContent('2');
    
    // Clear errors
    fireEvent.click(screen.getByText('Clear Errors'));
    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
    expect(screen.getByTestId('has-errors')).toHaveTextContent('false');
  });
});

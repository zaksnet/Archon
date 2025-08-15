import { describe, test, expect } from 'vitest';
import { OnboardingValidator, type ValidationError } from '../utils/validation';

describe('OnboardingValidator', () => {
  describe('validateApiKey', () => {
    describe('OpenAI Provider', () => {
      test('validates correct OpenAI API key', () => {
        const result = OnboardingValidator.validateApiKey(
          'sk-proj-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGH',
          'openai'
        );
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('rejects OpenAI key without correct prefix', () => {
        const result = OnboardingValidator.validateApiKey(
          'pk-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGH',
          'openai'
        );
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: 'INVALID_PREFIX',
            field: 'apiKey'
          })
        );
      });

      test('rejects OpenAI key that is too short', () => {
        const result = OnboardingValidator.validateApiKey(
          'sk-short',
          'openai'
        );
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: 'INVALID_LENGTH',
            field: 'apiKey'
          })
        );
      });

      test('rejects empty OpenAI key', () => {
        const result = OnboardingValidator.validateApiKey('', 'openai');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: 'MISSING_API_KEY',
            field: 'apiKey'
          })
        );
      });

      test('rejects OpenAI key with spaces', () => {
        const result = OnboardingValidator.validateApiKey(
          'sk-proj abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGH',
          'openai'
        );
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: 'CONTAINS_SPACES',
            field: 'apiKey'
          })
        );
      });

      test('rejects OpenAI key with newlines', () => {
        const result = OnboardingValidator.validateApiKey(
          'sk-proj-abcdefghijklmnopqrstuvwxyz\n0123456789ABCDEFGH',
          'openai'
        );
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: 'CONTAINS_WHITESPACE',
            field: 'apiKey'
          })
        );
      });

      test('warns about unusually long OpenAI key', () => {
        const longKey = 'sk-' + 'a'.repeat(250);
        const result = OnboardingValidator.validateApiKey(longKey, 'openai');
        expect(result.warnings).toContainEqual(
          expect.objectContaining({
            code: 'UNUSUALLY_LONG',
            field: 'apiKey'
          })
        );
      });
    });

    describe('Anthropic Provider', () => {
      test('validates correct Anthropic API key', () => {
        const result = OnboardingValidator.validateApiKey(
          'sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789ABCDEF',
          'anthropic'
        );
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('rejects Anthropic key without correct prefix', () => {
        const result = OnboardingValidator.validateApiKey(
          'sk-api03-abcdefghijklmnopqrstuvwxyz0123456789ABCDEF',
          'anthropic'
        );
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: 'INVALID_PREFIX',
            field: 'apiKey'
          })
        );
      });

      test('rejects Anthropic key that is too short', () => {
        const result = OnboardingValidator.validateApiKey(
          'sk-ant-short',
          'anthropic'
        );
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.code === 'INVALID_LENGTH')).toBe(true);
      });
    });

    describe('Google Provider', () => {
      test('validates correct Google API key', () => {
        const result = OnboardingValidator.validateApiKey(
          'AIzaSyD-abcdefghijklmnopqrstuvwxyz12345',
          'google'
        );
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('rejects Google key without correct prefix', () => {
        const result = OnboardingValidator.validateApiKey(
          'BIzaSyD-abcdefghijklmnopqrstuvwxyz123456',
          'google'
        );
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: 'INVALID_PREFIX',
            field: 'apiKey'
          })
        );
      });

      test('rejects Google key with incorrect length', () => {
        const result = OnboardingValidator.validateApiKey(
          'AIzaSyD-short',
          'google'
        );
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.code === 'INVALID_LENGTH')).toBe(true);
      });
    });

    describe('Ollama Provider', () => {
      test('always validates Ollama (no API key required)', () => {
        const result = OnboardingValidator.validateApiKey('', 'ollama');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('validates Ollama even with arbitrary input', () => {
        const result = OnboardingValidator.validateApiKey('anything', 'ollama');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Unknown Provider', () => {
      test('rejects unknown provider', () => {
        const result = OnboardingValidator.validateApiKey(
          'some-key',
          'unknown-provider'
        );
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: 'UNKNOWN_PROVIDER',
            field: 'provider'
          })
        );
      });
    });

    describe('Edge Cases', () => {
      test('handles null input gracefully', () => {
        const result = OnboardingValidator.validateApiKey(
          null as any,
          'openai'
        );
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: 'MISSING_API_KEY'
          })
        );
      });

      test('handles undefined input gracefully', () => {
        const result = OnboardingValidator.validateApiKey(
          undefined as any,
          'openai'
        );
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            code: 'MISSING_API_KEY'
          })
        );
      });

      test('trims whitespace from API keys', () => {
        const result = OnboardingValidator.validateApiKey(
          '  sk-proj-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGH  ',
          'openai'
        );
        // The validation should work on trimmed value
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateProviderConfig', () => {
    test('validates complete provider config', () => {
      const config = {
        id: 'openai',
        name: 'OpenAI',
        description: 'OpenAI GPT models',
        requiresApiKey: true,
        apiKeyField: 'OPENAI_API_KEY',
        apiKeyUrl: 'https://platform.openai.com/api-keys',
        accentColor: 'green' as const
      };
      
      const result = OnboardingValidator.validateProviderConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects config without ID', () => {
      const config = {
        id: '',
        name: 'OpenAI',
        description: 'OpenAI GPT models',
        requiresApiKey: true,
        apiKeyField: 'OPENAI_API_KEY'
      } as any;
      
      const result = OnboardingValidator.validateProviderConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_PROVIDER_ID'
        })
      );
    });

    test('rejects config without name', () => {
      const config = {
        id: 'openai',
        name: '',
        description: 'OpenAI GPT models',
        requiresApiKey: true,
        apiKeyField: 'OPENAI_API_KEY'
      } as any;
      
      const result = OnboardingValidator.validateProviderConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_PROVIDER_NAME'
        })
      );
    });

    test('rejects config without description', () => {
      const config = {
        id: 'openai',
        name: 'OpenAI',
        description: '',
        requiresApiKey: true,
        apiKeyField: 'OPENAI_API_KEY'
      } as any;
      
      const result = OnboardingValidator.validateProviderConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_PROVIDER_DESCRIPTION'
        })
      );
    });

    test('rejects config with requiresApiKey but no apiKeyField', () => {
      const config = {
        id: 'openai',
        name: 'OpenAI',
        description: 'OpenAI GPT models',
        requiresApiKey: true,
        apiKeyField: undefined
      } as any;
      
      const result = OnboardingValidator.validateProviderConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_API_KEY_FIELD'
        })
      );
    });

    test('rejects config with invalid URL', () => {
      const config = {
        id: 'openai',
        name: 'OpenAI',
        description: 'OpenAI GPT models',
        requiresApiKey: true,
        apiKeyField: 'OPENAI_API_KEY',
        apiKeyUrl: 'not-a-valid-url'
      } as any;
      
      const result = OnboardingValidator.validateProviderConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_URL'
        })
      );
    });

    test('rejects config with invalid accent color', () => {
      const config = {
        id: 'openai',
        name: 'OpenAI',
        description: 'OpenAI GPT models',
        requiresApiKey: true,
        apiKeyField: 'OPENAI_API_KEY',
        accentColor: 'red' as any
      };
      
      const result = OnboardingValidator.validateProviderConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_ACCENT_COLOR'
        })
      );
    });

    test('validates config without optional fields', () => {
      const config = {
        id: 'ollama',
        name: 'Ollama',
        description: 'Local Ollama models',
        requiresApiKey: false
      } as any;
      
      const result = OnboardingValidator.validateProviderConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateOnboardingState', () => {
    test('validates valid onboarding state', () => {
      const state = {
        currentStep: 2,
        provider: 'openai',
        apiKey: 'sk-proj-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGH'
      };
      
      const result = OnboardingValidator.validateOnboardingState(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects invalid step number', () => {
      const state = {
        currentStep: 0,
        provider: 'openai',
        apiKey: 'sk-test'
      };
      
      const result = OnboardingValidator.validateOnboardingState(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_STEP'
        })
      );
    });

    test('rejects step number above 3', () => {
      const state = {
        currentStep: 4,
        provider: 'openai',
        apiKey: 'sk-test'
      };
      
      const result = OnboardingValidator.validateOnboardingState(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_STEP'
        })
      );
    });

    test('rejects missing provider', () => {
      const state = {
        currentStep: 2,
        provider: '',
        apiKey: 'sk-test'
      };
      
      const result = OnboardingValidator.validateOnboardingState(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_PROVIDER'
        })
      );
    });

    test('validates state without API key', () => {
      const state = {
        currentStep: 1,
        provider: 'ollama'
      };
      
      const result = OnboardingValidator.validateOnboardingState(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('validates and includes API key errors if provided', () => {
      const state = {
        currentStep: 2,
        provider: 'openai',
        apiKey: 'invalid-key'
      };
      
      const result = OnboardingValidator.validateOnboardingState(state);
      expect(result.isValid).toBe(false);
      // Should have errors from API key validation
      expect(result.errors.some(e => e.field === 'apiKey')).toBe(true);
    });
  });

  describe('sanitizeApiKey', () => {
    test('removes leading and trailing whitespace', () => {
      const result = OnboardingValidator.sanitizeApiKey('  sk-test123  ');
      expect(result).toBe('sk-test123');
    });

    test('removes all internal spaces', () => {
      const result = OnboardingValidator.sanitizeApiKey('sk-test 123 456');
      expect(result).toBe('sk-test123456');
    });

    test('removes newlines and tabs', () => {
      const result = OnboardingValidator.sanitizeApiKey('sk-test\n123\t456');
      expect(result).toBe('sk-test123456');
    });

    test('preserves all characters except whitespace', () => {
      const result = OnboardingValidator.sanitizeApiKey('sk-test_123-456@789!');
      expect(result).toBe('sk-test_123-456@789!');
    });

    test('handles empty string', () => {
      const result = OnboardingValidator.sanitizeApiKey('');
      expect(result).toBe('');
    });

    test('preserves valid characters', () => {
      const validKey = 'sk-proj_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGH';
      const result = OnboardingValidator.sanitizeApiKey(validKey);
      expect(result).toBe(validKey);
    });
  });

  describe('isApiKeyFormatValid', () => {
    test('returns true for valid OpenAI key', () => {
      const result = OnboardingValidator.isApiKeyFormatValid(
        'sk-proj-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGH',
        'openai'
      );
      expect(result).toBe(true);
    });

    test('returns false for invalid OpenAI key', () => {
      const result = OnboardingValidator.isApiKeyFormatValid(
        'invalid-key',
        'openai'
      );
      expect(result).toBe(false);
    });

    test('sanitizes key before validation', () => {
      const result = OnboardingValidator.isApiKeyFormatValid(
        '  sk-proj-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGH  ',
        'openai'
      );
      expect(result).toBe(true);
    });

    test('returns false for empty key', () => {
      const result = OnboardingValidator.isApiKeyFormatValid('', 'openai');
      expect(result).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    test('returns user-friendly message for known error codes', () => {
      const error: ValidationError = {
        field: 'apiKey',
        message: 'Technical message',
        code: 'MISSING_API_KEY',
        severity: 'error'
      };
      
      const message = OnboardingValidator.getErrorMessage(error);
      expect(message).toBe('Please enter your API key');
    });

    test('returns original message for unknown error codes', () => {
      const error: ValidationError = {
        field: 'apiKey',
        message: 'Custom error message',
        code: 'UNKNOWN_ERROR_CODE',
        severity: 'error'
      };
      
      const message = OnboardingValidator.getErrorMessage(error);
      expect(message).toBe('Custom error message');
    });

    test('handles all defined error codes', () => {
      const errorCodes = [
        'MISSING_API_KEY',
        'INVALID_LENGTH',
        'INVALID_PREFIX',
        'INVALID_FORMAT',
        'CONTAINS_SPACES',
        'CONTAINS_WHITESPACE',
        'UNKNOWN_PROVIDER',
        'MISSING_PROVIDER',
        'INVALID_STEP'
      ];
      
      errorCodes.forEach(code => {
        const error: ValidationError = {
          field: 'test',
          message: 'Test message',
          code: code,
          severity: 'error'
        };
        
        const message = OnboardingValidator.getErrorMessage(error);
        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });
});
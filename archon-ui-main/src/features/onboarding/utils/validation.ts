import { ProviderConfig } from '../config/providers';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// API Key validation patterns
const API_KEY_PATTERNS = {
  openai: /^sk-[a-zA-Z0-9]{32,}$/,
  anthropic: /^sk-ant-[a-zA-Z0-9]{32,}$/,
  google: /^AIza[a-zA-Z0-9_-]{35}$/,
  cohere: /^cohere-[a-zA-Z0-9]{32,}$/,
  huggingface: /^hf_[a-zA-Z0-9]{32,}$/,
  azure: /^[a-zA-Z0-9]{32,}$/,
  aws: /^AKIA[a-zA-Z0-9]{16}$/,
  generic: /^[a-zA-Z0-9_-]{20,}$/
};

// Provider-specific validation rules
const PROVIDER_VALIDATION_RULES = {
  openai: {
    minLength: 32,
    prefix: 'sk-',
    description: 'OpenAI API keys start with "sk-" and are at least 32 characters long'
  },
  anthropic: {
    minLength: 32,
    prefix: 'sk-ant-',
    description: 'Anthropic API keys start with "sk-ant-" and are at least 32 characters long'
  },
  google: {
    minLength: 39,
    prefix: 'AIza',
    description: 'Google API keys start with "AIza" and are exactly 39 characters long'
  },
  ollama: {
    requiresApiKey: false,
    description: 'Ollama runs locally and does not require an API key'
  }
};

export class OnboardingValidator {
  /**
   * Validates an API key for a specific provider
   */
  static validateApiKey(apiKey: string, providerId: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check if API key is required for this provider
    const provider = PROVIDER_VALIDATION_RULES[providerId as keyof typeof PROVIDER_VALIDATION_RULES];
    
    if (!provider) {
      errors.push({
        field: 'provider',
        message: `Unknown provider: ${providerId}`,
        code: 'UNKNOWN_PROVIDER',
        severity: 'error'
      });
      return { isValid: false, errors, warnings };
    }

    // Check if this provider requires an API key
    if ('requiresApiKey' in provider && !provider.requiresApiKey) {
      return { isValid: true, errors, warnings };
    }

    // Basic validation
    if (!apiKey || apiKey.trim().length === 0) {
      errors.push({
        field: 'apiKey',
        message: 'API key is required',
        code: 'MISSING_API_KEY',
        severity: 'error'
      });
      return { isValid: false, errors, warnings };
    }

    const trimmedKey = apiKey.trim();

    // Length validation - be more strict about minimum length
    if ('minLength' in provider && provider.minLength && trimmedKey.length < provider.minLength) {
      errors.push({
        field: 'apiKey',
        message: `API key must be at least ${provider.minLength} characters long`,
        code: 'INVALID_LENGTH',
        severity: 'error'
      });
    }

    // Prefix validation
    if ('prefix' in provider && provider.prefix && !trimmedKey.startsWith(provider.prefix)) {
      errors.push({
        field: 'apiKey',
        message: `API key should start with "${provider.prefix}"`,
        code: 'INVALID_PREFIX',
        severity: 'error'
      });
    }

    // Pattern validation - only use specific patterns, not generic fallback
    const pattern = API_KEY_PATTERNS[providerId as keyof typeof API_KEY_PATTERNS];
    if (pattern && !pattern.test(trimmedKey)) {
      errors.push({
        field: 'apiKey',
        message: `API key format appears invalid. ${provider.description}`,
        code: 'INVALID_FORMAT',
        severity: 'error'
      });
    }

    // Security warnings and additional validation
    if (trimmedKey.length > 200) {
      warnings.push({
        field: 'apiKey',
        message: 'API key seems unusually long. Please verify it is correct.',
        code: 'UNUSUALLY_LONG',
        severity: 'warning'
      });
    }

    // Additional validation for specific providers
    if (providerId === 'openai' && trimmedKey.length < 51) {
      errors.push({
        field: 'apiKey',
        message: 'OpenAI API keys are typically 51 characters long',
        code: 'INVALID_LENGTH',
        severity: 'error'
      });
    }

    if (providerId === 'anthropic' && trimmedKey.length < 48) {
      errors.push({
        field: 'apiKey',
        message: 'Anthropic API keys are typically 48 characters long',
        code: 'INVALID_LENGTH',
        severity: 'error'
      });
    }

    // Check for common mistakes
    if (trimmedKey.includes(' ')) {
      errors.push({
        field: 'apiKey',
        message: 'API key should not contain spaces',
        code: 'CONTAINS_SPACES',
        severity: 'error'
      });
    }

    if (trimmedKey.includes('\n') || trimmedKey.includes('\t')) {
      errors.push({
        field: 'apiKey',
        message: 'API key should not contain line breaks or tabs',
        code: 'CONTAINS_WHITESPACE',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates provider configuration
   */
  static validateProviderConfig(providerConfig: ProviderConfig): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Required fields validation
    if (!providerConfig.id || providerConfig.id.trim().length === 0) {
      errors.push({
        field: 'id',
        message: 'Provider ID is required',
        code: 'MISSING_PROVIDER_ID',
        severity: 'error'
      });
    }

    if (!providerConfig.name || providerConfig.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Provider name is required',
        code: 'MISSING_PROVIDER_NAME',
        severity: 'error'
      });
    }

    if (!providerConfig.description || providerConfig.description.trim().length === 0) {
      errors.push({
        field: 'description',
        message: 'Provider description is required',
        code: 'MISSING_PROVIDER_DESCRIPTION',
        severity: 'error'
      });
    }

    // API key field validation
    if (providerConfig.requiresApiKey && !providerConfig.apiKeyField) {
      errors.push({
        field: 'apiKeyField',
        message: 'API key field is required when requiresApiKey is true',
        code: 'MISSING_API_KEY_FIELD',
        severity: 'error'
      });
    }

    // URL validation
    if (providerConfig.apiKeyUrl) {
      try {
        new URL(providerConfig.apiKeyUrl);
      } catch {
        errors.push({
          field: 'apiKeyUrl',
          message: 'Invalid API key URL format',
          code: 'INVALID_URL',
          severity: 'error'
        });
      }
    }

    // Accent color validation
    const validColors = ['purple', 'green', 'pink', 'blue'];
    if (providerConfig.accentColor && !validColors.includes(providerConfig.accentColor)) {
      errors.push({
        field: 'accentColor',
        message: `Invalid accent color. Must be one of: ${validColors.join(', ')}`,
        code: 'INVALID_ACCENT_COLOR',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates the overall onboarding state
   */
  static validateOnboardingState(state: {
    currentStep: number;
    provider: string;
    apiKey?: string;
  }): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Step validation
    if (state.currentStep < 1 || state.currentStep > 3) {
      errors.push({
        field: 'currentStep',
        message: 'Invalid onboarding step',
        code: 'INVALID_STEP',
        severity: 'error'
      });
    }

    // Provider validation
    if (!state.provider || state.provider.trim().length === 0) {
      errors.push({
        field: 'provider',
        message: 'Provider must be selected',
        code: 'MISSING_PROVIDER',
        severity: 'error'
      });
    }

    // API key validation if provided
    if (state.apiKey) {
      const apiKeyValidation = this.validateApiKey(state.apiKey, state.provider);
      errors.push(...apiKeyValidation.errors);
      warnings.push(...apiKeyValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Sanitizes API key input
   */
  static sanitizeApiKey(apiKey: string): string {
    return apiKey
      .trim()
      .replace(/\s+/g, '') // Remove all whitespace
      .replace(/[^\w\-_]/g, ''); // Remove special characters except underscore and dash
  }

  /**
   * Checks if an API key looks like it might be valid (basic format check)
   */
  static isApiKeyFormatValid(apiKey: string, providerId: string): boolean {
    const sanitized = this.sanitizeApiKey(apiKey);
    const validation = this.validateApiKey(sanitized, providerId);
    return validation.isValid;
  }

  /**
   * Gets user-friendly error messages
   */
  static getErrorMessage(error: ValidationError): string {
    const errorMessages: Record<string, string> = {
      MISSING_API_KEY: 'Please enter your API key',
      INVALID_LENGTH: 'API key is too short',
      INVALID_PREFIX: 'API key has incorrect format',
      INVALID_FORMAT: 'API key format is invalid',
      CONTAINS_SPACES: 'Remove spaces from API key',
      CONTAINS_WHITESPACE: 'Remove line breaks from API key',
      UNKNOWN_PROVIDER: 'Selected provider is not supported',
      MISSING_PROVIDER: 'Please select a provider',
      INVALID_STEP: 'Invalid onboarding step',
      MISSING_PROVIDER_ID: 'Provider configuration error',
      MISSING_PROVIDER_NAME: 'Provider configuration error',
      MISSING_PROVIDER_DESCRIPTION: 'Provider configuration error',
      MISSING_API_KEY_FIELD: 'Provider configuration error',
      INVALID_URL: 'Invalid URL in provider configuration',
      INVALID_ACCENT_COLOR: 'Invalid color in provider configuration'
    };

    return errorMessages[error.code] || error.message;
  }
}

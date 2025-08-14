// Main onboarding page
export { OnboardingPage } from './OnboardingPage';

// Step components
export { WelcomeStep, ProviderStep, CompletionStep } from './components/steps';

// Provider step sub-components
export { ProviderSelector, ApiKeyInput, ProviderActions, ProviderInfo as ProviderInfoComponent } from './components/provider';

// Error handling components
export { OnboardingErrorBoundary } from './components/error-handling';

// UI components
export { ErrorDisplay } from './components/ui';

// Error handling utilities
export { OnboardingErrorHandler, type UserFriendlyError, type DetailedError } from './utils/errorHandling';

// Provider configuration
export { 
  PROVIDERS, 
  getProviderConfig, 
  getProviderOptions,
  type ProviderConfig 
} from './config/providers';

// Utilities
export { 
  isLmConfigured,
  type NormalizedCredential,
  type ProviderInfo 
} from './utils/onboarding';

// Validation utilities
export {
  OnboardingValidator,
  type ValidationResult,
  type ValidationError
} from './utils/validation';

// Error handling hooks
export {
  useOnboardingError,
  type OnboardingError,
  type ErrorHandlingOptions
} from './hooks/useOnboardingError';

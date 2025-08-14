# Onboarding Feature

This directory contains all onboarding-related components and functionality for the Archon application.

## Structure

```
onboarding/
├── components/
│   ├── WelcomeStep.tsx      # Welcome screen component
│   ├── ProviderStep.tsx     # Provider configuration component
│   └── CompletionStep.tsx   # Completion screen component
├── config/
│   └── providers.ts         # Provider configuration system
├── utils/
│   ├── onboarding.ts        # Onboarding utility functions
│   └── validation.ts        # Validation utilities and error handling
├── hooks/
│   └── useOnboardingError.ts # Error handling hook with retry logic
├── tests/
│   ├── onboarding.test.tsx  # Onboarding tests
│   └── error-handling.test.tsx # Error handling tests
├── OnboardingPage.tsx       # Main onboarding page
├── index.ts                 # Exports all components and utilities
└── README.md               # This file
```

## Adding New AI Providers

To add a new AI provider, simply update the `PROVIDERS` array in `config/providers.ts`:

```typescript
{
  id: 'your-provider-id',
  name: 'Your Provider Name',
  description: 'Description of what this provider offers.',
  requiresApiKey: true, // or false if no API key needed
  apiKeyField: 'YOUR_PROVIDER_API_KEY', // optional
  apiKeyPlaceholder: 'your-key-prefix...', // optional
  apiKeyUrl: 'https://your-provider.com/api-keys', // optional
  apiKeyLabel: 'Your Provider API Key', // optional
  accentColor: 'purple', // 'purple' | 'green' | 'pink' | 'blue'
  icon: <YourIcon className="w-4 h-4" />, // optional
  settingsMessage: 'Custom message for settings configuration.' // optional
}
```

### Provider Configuration Options

- **id**: Unique identifier for the provider
- **name**: Display name shown to users
- **description**: Explains what the provider offers
- **requiresApiKey**: Whether the provider needs an API key
- **apiKeyField**: The credential key name (e.g., 'OPENAI_API_KEY')
- **apiKeyPlaceholder**: Placeholder text for the API key input
- **apiKeyUrl**: URL where users can get their API key
- **apiKeyLabel**: Label for the API key input field
- **accentColor**: UI accent color (purple, green, pink, or blue)
- **icon**: React component for the provider icon
- **settingsMessage**: Custom message for providers that need settings configuration

### Example: Adding a New Provider

```typescript
// In config/providers.ts
import { Brain } from 'lucide-react';

export const PROVIDERS: ProviderConfig[] = [
  // ... existing providers
  {
    id: 'cohere',
    name: 'Cohere',
    description: 'Cohere provides powerful language models for text generation and analysis.',
    requiresApiKey: true,
    apiKeyField: 'COHERE_API_KEY',
    apiKeyPlaceholder: 'cohere-...',
    apiKeyUrl: 'https://dashboard.cohere.ai/api-keys',
    apiKeyLabel: 'Cohere API Key',
    accentColor: 'pink',
    icon: <Brain className="w-4 h-4" />
  }
];
```

## Components

### WelcomeStep
The first step of onboarding that welcomes users and explains the process.

### ProviderStep
Configures AI providers with API keys and settings. Automatically adapts to different provider requirements.

### CompletionStep
Final step that confirms successful setup and guides users to start using the application.

## Utilities

### isLmConfigured()
Checks if a language model is properly configured based on credentials.

### Provider Configuration
- `getProviderConfig(providerId)`: Get configuration for a specific provider
- `getProviderOptions()`: Get list of all available providers for dropdown

## Error Handling

The onboarding feature includes comprehensive error handling with multiple layers of protection:

### Error Boundary
- **OnboardingErrorBoundary**: Catches and handles React component errors gracefully
- Provides user-friendly error messages with retry functionality
- Shows detailed error information in development mode
- Includes error ID tracking for debugging

### Validation System
- **OnboardingValidator**: Comprehensive validation for API keys, provider configs, and onboarding state
- Real-time API key validation with debounced input
- Provider-specific validation rules (OpenAI, Anthropic, Google, etc.)
- Sanitization of user inputs to prevent common mistakes
- User-friendly error messages with actionable guidance

### Error Management Hook
- **useOnboardingError**: Custom hook for managing errors with retry logic
- Automatic retry with exponential backoff
- Error categorization (validation, network, permission, unknown)
- Detailed error logging with context information
- Toast notifications for user feedback

### Error Recovery Features
- **Automatic Retry**: Network operations automatically retry on failure
- **Graceful Degradation**: Components continue to function even with partial errors
- **User Guidance**: Clear error messages with specific resolution steps
- **Error Tracking**: Unique error IDs for debugging and support

## Testing

The onboarding feature includes comprehensive tests in the `tests/` directory:

- **onboarding.test.tsx**: Tests for all onboarding components and utilities
  - Component rendering tests
  - Provider configuration logic tests
  - `isLmConfigured` function tests for various scenarios

- **error-handling.test.tsx**: Tests for error handling functionality
  - Validation logic tests for all provider types
  - Error boundary behavior tests
  - Error hook functionality tests
  - API key validation and sanitization tests

To run the onboarding tests specifically:

```bash
# Run all onboarding tests
npm test -- src/features/onboarding/tests/

# Run specific test files
npm test -- src/features/onboarding/tests/onboarding.test.tsx
npm test -- src/features/onboarding/tests/error-handling.test.tsx
```

## Usage

```typescript
import { OnboardingPage, getProviderConfig } from './features/onboarding';

// Use the main onboarding page
<OnboardingPage />

// Get provider configuration
const config = getProviderConfig('openai');
```

# Onboarding Components

This directory contains all the React components for the onboarding feature, organized into logical folders for better maintainability and clarity.

## Folder Structure

### 📁 `steps/`
Main step components that represent the different stages of the onboarding process.

- **`WelcomeStep.tsx`** - Initial welcome screen
- **`ProviderStep.tsx`** - AI provider configuration step
- **`CompletionStep.tsx`** - Final completion step

### 📁 `provider/`
Components specifically related to provider configuration and management.

- **`ProviderSelector.tsx`** - Dropdown for selecting AI providers
- **`ApiKeyInput.tsx`** - Input field for API keys with validation
- **`ProviderActions.tsx`** - Save/Skip action buttons
- **`ProviderInfo.tsx`** - Information displays for providers (error states, settings info)

### 📁 `error-handling/`
Components for handling errors and providing fallback UI.

- **`OnboardingErrorBoundary.tsx`** - React error boundary for catching JavaScript errors

### 📁 `ui/`
Reusable UI components specific to the onboarding feature.

- **`ErrorDisplay.tsx`** - Comprehensive error display component with technical details and help links

## Usage

### Importing Components

```typescript
// Import step components
import { WelcomeStep, ProviderStep, CompletionStep } from './components/steps';

// Import provider components
import { ProviderSelector, ApiKeyInput, ProviderActions } from './components/provider';

// Import error handling components
import { OnboardingErrorBoundary } from './components/error-handling';

// Import UI components
import { ErrorDisplay } from './components/ui';
```

### Component Relationships

```
OnboardingPage
├── OnboardingErrorBoundary (error-handling)
└── Step Components (steps/)
    ├── WelcomeStep
    ├── ProviderStep
    │   ├── ProviderSelector (provider/)
    │   ├── ApiKeyInput (provider/)
    │   ├── ProviderActions (provider/)
    │   └── ProviderInfo (provider/)
    └── CompletionStep
```

## Benefits of This Structure

1. **Clear Separation of Concerns** - Each folder has a specific purpose
2. **Easy Navigation** - Developers can quickly find related components
3. **Scalable** - Easy to add new components to appropriate folders
4. **Maintainable** - Related components are grouped together
5. **Clean Imports** - Index files provide clean import paths

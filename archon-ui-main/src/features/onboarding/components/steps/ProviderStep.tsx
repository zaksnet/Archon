import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../../contexts/ToastContext';
import { credentialsService } from '../../../../services/credentialsService';
import { getProviderConfig, getProviderOptions } from '../../config/providers';
import { OnboardingValidator, type ValidationResult } from '../../utils/validation';
import { OnboardingErrorHandler, type UserFriendlyError } from '../../utils/errorHandling';
import { ProviderSelector, ApiKeyInput, ProviderActions, ProviderInfo as ProviderInfoComponent } from '../provider';
import { ErrorDisplay } from '../ui/ErrorDisplay';

interface ProviderStepProps {
  onSaved: () => void;
  onSkip: () => void;
}

export const ProviderStep = ({ onSaved, onSkip }: ProviderStepProps) => {
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [], warnings: [] });
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<UserFriendlyError | null>(null);
  const [technicalDetails, setTechnicalDetails] = useState<string>('');
  const { showToast } = useToast();



  const providerConfig = getProviderConfig(provider);

  // Debounced validation function
  const debouncedValidation = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (key: string, providerId: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setIsValidating(true);
          
          try {
            const result = OnboardingValidator.validateApiKey(key, providerId);
            setValidation(result);
          } catch (error) {
            console.error('Validation error:', error);
            setValidation({
              isValid: false,
              errors: [{
                field: 'apiKey',
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                severity: 'error'
              }],
              warnings: []
            });
          } finally {
            setIsValidating(false);
          }
        }, 500);
      };
    })(),
    []
  );

  // Validate API key when it changes
  useEffect(() => {
    if (apiKey && providerConfig?.requiresApiKey) {
      debouncedValidation(apiKey, provider);
    } else if (!apiKey && providerConfig?.requiresApiKey) {
      setValidation({ 
        isValid: false, 
        errors: [{
          field: 'apiKey',
          message: 'API key is required',
          code: 'MISSING_API_KEY',
          severity: 'error'
        }], 
        warnings: [] 
      });
    } else {
      setValidation({ isValid: true, errors: [], warnings: [] });
    }
  }, [apiKey, provider, providerConfig?.requiresApiKey, debouncedValidation]);

  const handleSave = async () => {
    if (!providerConfig) {
      showToast('Invalid provider selected', 'error');
      return;
    }

    if (providerConfig.requiresApiKey) {
      if (!apiKey.trim()) {
        showToast('Please enter an API key', 'error');
        return;
      }

      const finalValidation = OnboardingValidator.validateApiKey(apiKey, provider);
      if (!finalValidation.isValid) {
        const firstError = finalValidation.errors[0];
        showToast(OnboardingValidator.getErrorMessage(firstError), 'error');
        return;
      }

      if (finalValidation.warnings.length > 0) {
        const warning = finalValidation.warnings[0];
        showToast(warning.message, 'warning');
      }
    }

    setSaving(true);
    try {
      const sanitizedApiKey = OnboardingValidator.sanitizeApiKey(apiKey);

      if (providerConfig.requiresApiKey && providerConfig.apiKeyField) {
        await credentialsService.createCredential({
          key: providerConfig.apiKeyField,
          value: sanitizedApiKey,
          is_encrypted: true,
          category: 'api_keys'
        });
      }

      await credentialsService.updateCredential({
        key: 'LLM_PROVIDER',
        value: provider,
        is_encrypted: false,
        category: 'rag_strategy'
      });

      showToast('Provider configured successfully!', 'success');
      onSaved();
    } catch (error) {
      // Log detailed error for debugging
      OnboardingErrorHandler.logError(error, 'PROVIDER_CONFIG_SAVE');
      
      // Get user-friendly error message
      const userFriendlyError = OnboardingErrorHandler.getUserFriendlyError(error, 'provider_configuration');
      
      // Store error details for display
      setError(userFriendlyError);
      setTechnicalDetails(JSON.stringify(error, null, 2));
      
      // Show toast for immediate feedback
      showToast(
        OnboardingErrorHandler.getDisplayMessage(userFriendlyError),
        userFriendlyError.severity
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    showToast('You can configure your provider in Settings', 'info');
    onSkip();
  };

  if (!providerConfig) {
    return <ProviderInfoComponent type="error" />;
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <ErrorDisplay
          error={error}
        />
      )}

      <ProviderSelector 
        provider={provider}
        onProviderChange={setProvider}
        providerConfig={providerConfig}
      />

      {providerConfig.requiresApiKey && providerConfig.apiKeyField ? (
        <>
          <ApiKeyInput
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            providerConfig={providerConfig}
            validation={validation}
            isValidating={isValidating}
          />

          <ProviderActions
            onSave={handleSave}
            onSkip={handleSkip}
            saving={saving}
            apiKey={apiKey}
            validation={validation}
            providerConfig={providerConfig}
          />
        </>
      ) : (
        <ProviderInfoComponent 
          type="settings" 
          providerConfig={providerConfig}
          onContinue={handleSkip}
        />
      )}
    </div>
  );
};

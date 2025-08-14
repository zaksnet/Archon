import { ExternalLink, Loader, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { OnboardingValidator, type ValidationResult } from '../../utils/validation';
import { type ProviderConfig } from '../../config/providers';

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
  providerConfig: ProviderConfig;
  validation: ValidationResult;
  isValidating: boolean;
}

export const ApiKeyInput = ({
  apiKey,
  onApiKeyChange,
  providerConfig,
  validation,
  isValidating
}: ApiKeyInputProps) => {
  return (
    <>
      <div>
        <Input
          label={providerConfig.apiKeyLabel || 'API Key'}
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder={providerConfig.apiKeyPlaceholder || 'Enter API key...'}
          accentColor={providerConfig.accentColor || "green"}
          icon={providerConfig.icon}
        />
        <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">
          Your API key will be encrypted and stored securely.
        </p>

        {/* Validation Status */}
        {apiKey && (
          <div className="mt-3">
            {isValidating && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Loader className="w-4 h-4 animate-spin" />
                Validating API key...
              </div>
            )}
            
            {!isValidating && validation.errors.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  {validation.errors.map((error, index) => (
                    <div key={index}>
                      {OnboardingValidator.getErrorMessage(error)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!isValidating && validation.warnings.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  {validation.warnings.map((warning, index) => (
                    <div key={index}>{warning.message}</div>
                  ))}
                </div>
              </div>
            )}
            
            {!isValidating && validation.isValid && validation.errors.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                API key format looks valid
              </div>
            )}
          </div>
        )}
      </div>

      {providerConfig.apiKeyUrl && (
        <div className="flex items-center gap-2 text-sm">
          <a
            href={providerConfig.apiKeyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
          >
            Get an API key from {providerConfig.name}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </>
  );
};

import { AlertTriangle } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { type ProviderConfig } from '../../config/providers';

interface ProviderInfoProps {
  type: 'error' | 'settings';
  providerConfig?: ProviderConfig;
  onContinue?: () => void;
}

export const ProviderInfo = ({ 
  type, 
  providerConfig, 
  onContinue 
}: ProviderInfoProps) => {
  if (type === 'error') {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-200 font-medium">
            Invalid provider selected
          </span>
        </div>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">
          The selected provider configuration is invalid. Please try refreshing the page or contact support.
        </p>
      </div>
    );
  }

  if (type === 'settings' && providerConfig) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {providerConfig.settingsMessage || `${providerConfig.name} configuration will be available in Settings after setup.`}
          </p>
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={onContinue}
            className="flex-1"
          >
            Continue to Settings
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

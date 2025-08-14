import { Select } from '../../../../components/ui/Select';
import { getProviderOptions } from '../../config/providers';
import { type ProviderConfig } from '../../config/providers';

interface ProviderSelectorProps {
  provider: string;
  onProviderChange: (provider: string) => void;
  providerConfig: ProviderConfig;
}

export const ProviderSelector = ({ 
  provider, 
  onProviderChange, 
  providerConfig 
}: ProviderSelectorProps) => {
  const providerOptions = getProviderOptions();

  return (
    <div>
      <Select
        label="Select AI Provider"
        value={provider}
        onChange={(e) => onProviderChange(e.target.value)}
        options={providerOptions}
        accentColor={providerConfig.accentColor || "green"}
      />
      <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">
        {providerConfig.description}
      </p>
    </div>
  );
};

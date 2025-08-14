import { Save, Loader } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { type ValidationResult } from '../../utils/validation';
import { type ProviderConfig } from '../../config/providers';

interface ProviderActionsProps {
  onSave: () => void;
  onSkip: () => void;
  saving: boolean;
  apiKey: string;
  validation: ValidationResult;
  providerConfig: ProviderConfig;
}

export const ProviderActions = ({
  onSave,
  onSkip,
  saving,
  apiKey,
  validation,
  providerConfig
}: ProviderActionsProps) => {
  return (
    <div className="flex gap-3 pt-4">
      <Button
        variant="primary"
        size="lg"
        onClick={onSave}
        disabled={saving || !apiKey.trim() || !validation.isValid}
        icon={saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        className="flex-1"
      >
        {saving ? 'Saving...' : 'Save & Continue'}
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={onSkip}
        disabled={saving}
        className="flex-1"
      >
        Skip for Now
      </Button>
    </div>
  );
};

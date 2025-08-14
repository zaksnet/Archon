import { AlertTriangle } from 'lucide-react';
import { type UserFriendlyError } from '../../utils/errorHandling';

interface ErrorDisplayProps {
  error: UserFriendlyError;
}

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  return (
    <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1 text-red-600 dark:text-red-400">
            {error.title}
          </h3>
          
          <p className="text-sm text-red-600 dark:text-red-400">
            {error.message}
          </p>
        </div>
      </div>
    </div>
  );
};

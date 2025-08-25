import React, { useEffect, useState } from 'react';
import { Cpu, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { cleanProviderService } from '../services/cleanProviderService';

interface ActiveModel {
  model_string: string;
  provider: string;
  model: string;
  api_key_configured: boolean;
  is_default?: boolean;
}

interface ModelStatus {
  active_models: Record<string, ActiveModel>;
  api_key_status: Record<string, boolean>;
  timestamp: string;
}

const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  'rag_agent': 'RAG Agent',
  'document_agent': 'Doc Agent',
  'embeddings': 'Embeddings',
  'contextual_embedding': 'Context Embed',
  'source_summary': 'Summaries',
  'code_analysis': 'Code Analysis'
};

const PROVIDER_COLORS: Record<string, string> = {
  'openai': 'bg-green-500',
  'anthropic': 'bg-orange-500',
  'google': 'bg-blue-500',
  'mistral': 'bg-purple-500',
  'groq': 'bg-pink-500',
  'deepseek': 'bg-indigo-500',
  'ollama': 'bg-gray-500',
  'openrouter': 'bg-teal-500',
  'unknown': 'bg-gray-400'
};

export const ModelStatusBar: React.FC = () => {
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchModelStatus = async () => {
    try {
      setError(null);
      console.log('ModelStatusBar: Fetching model status...');
      const status = await cleanProviderService.getActiveModels();
      console.log('ModelStatusBar: Status received:', status);
      setModelStatus(status);
    } catch (err) {
      console.error('ModelStatusBar: Failed to fetch model status:', err);
      setError('Failed to fetch model status');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    console.log('ModelStatusBar: Component mounted');
    fetchModelStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchModelStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchModelStatus();
  };

  // Always show a bar, even while loading
  if (loading) {
    return (
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-gray-400">
          <Cpu className="w-4 h-4 animate-pulse" />
          <span className="text-sm">Loading model status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border-b border-red-800 px-4 py-2">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!modelStatus) {
    return null;
  }

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 px-4 py-2 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-gray-300">Active Models:</span>
          </div>
          
          {Object.entries(modelStatus.active_models).map(([service, model]) => (
            <div
              key={service}
              className="flex items-center gap-1.5 bg-gray-800 rounded px-2 py-1"
              title={`${SERVICE_DISPLAY_NAMES[service] || service}: ${model.model_string}`}
            >
              <span className="text-xs text-gray-400">
                {SERVICE_DISPLAY_NAMES[service] || service}:
              </span>
              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    PROVIDER_COLORS[model.provider] || PROVIDER_COLORS.unknown
                  }`}
                />
                <span className="text-xs font-mono text-gray-200">
                  {model.model.length > 20 
                    ? `${model.model.substring(0, 20)}...` 
                    : model.model}
                </span>
                {model.api_key_configured ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-yellow-400" />
                )}
                {model.is_default && (
                  <span className="text-[10px] text-gray-500 ml-1">(default)</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded hover:bg-gray-800 transition-colors"
          title="Refresh model status"
        >
          <RefreshCw 
            className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} 
          />
        </button>
      </div>

      {/* Provider Legend */}
      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
        <span>Providers:</span>
        {Object.entries(PROVIDER_COLORS).filter(([key]) => key !== 'unknown').map(([provider, color]) => (
          <div key={provider} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span>{provider}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
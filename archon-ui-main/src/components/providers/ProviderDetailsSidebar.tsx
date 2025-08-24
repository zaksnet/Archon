import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProviderLogo } from './ProviderLogo';
import type { Provider, Model } from '../../types/provider';
import { 
  X,
  Activity,
  Key,
  Database,
  BarChart3,
  Settings,
  Calendar,
  Globe,
  Hash,
  Shield,
  Zap,
  DollarSign,
  Clock
} from 'lucide-react';

interface ProviderDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  provider: Provider | null;
  models: Model[];
  usageData?: {
    totalRequests: number;
    totalCost: number;
    avgResponseTime: number;
    lastUsed: string;
  };
  onEdit: (provider: Provider) => void;
  onManageCredentials: (provider: Provider) => void;
  onManageModels: (provider: Provider) => void;
  onCheckHealth: (provider: Provider) => void;
  onViewUsage: (provider: Provider) => void;
}

export const ProviderDetailsSidebar: React.FC<ProviderDetailsSidebarProps> = ({
  isOpen,
  onClose,
  provider,
  models,
  usageData,
  onEdit,
  onManageCredentials,
  onManageModels,
  onCheckHealth,
  onViewUsage
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'usage' | 'settings'>('overview');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!provider) return null;

  const providerModels = models.filter(m => m.provider_id === provider.id);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl transition-transform duration-300 z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <ProviderLogo providerType={provider.provider_type} size="lg" />
                <div>
                  <h2 className="text-xl font-bold">{provider.display_name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{provider.name}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                className="p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Status Bar */}
            <div className="flex items-center gap-3">
              {provider.is_active ? (
                <Badge variant="success" size="sm">
                  <Activity className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="error" size="sm">
                  <X className="w-3 h-3 mr-1" />
                  Inactive
                </Badge>
              )}
              {provider.is_primary && (
                <Badge variant="warning" size="sm">
                  <Zap className="w-3 h-3 mr-1" />
                  Primary
                </Badge>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-zinc-800">
            {(['overview', 'models', 'usage', 'settings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Provider Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Provider Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Provider ID</p>
                        <p className="text-sm font-mono">{provider.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="text-sm capitalize">{provider.provider_type}</p>
                      </div>
                    </div>
                    {provider.base_url && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Base URL</p>
                          <p className="text-sm font-mono break-all">{provider.base_url}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="text-sm">{new Date(provider.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Supported Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {provider.service_types.map(service => (
                      <Badge key={service} variant="outline" size="sm">
                        {service.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                {usageData && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-xs text-gray-500">Total Requests</p>
                        <p className="text-lg font-semibold">{usageData.totalRequests.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-xs text-gray-500">Total Cost</p>
                        <p className="text-lg font-semibold">${usageData.totalCost.toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-xs text-gray-500">Avg Response</p>
                        <p className="text-lg font-semibold">{usageData.avgResponseTime}ms</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-xs text-gray-500">Last Used</p>
                        <p className="text-sm font-medium">{usageData.lastUsed}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <Button onClick={() => onCheckHealth(provider)} variant="outline" className="w-full">
                    <Activity className="w-4 h-4 mr-2" />
                    Check Health Status
                  </Button>
                  <Button onClick={() => onManageCredentials(provider)} variant="outline" className="w-full">
                    <Key className="w-4 h-4 mr-2" />
                    Manage Credentials
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'models' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Available Models ({providerModels.length})
                </h3>
                {providerModels.length > 0 ? (
                  <div className="space-y-3">
                    {providerModels.map(model => (
                      <div key={model.id} className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{model.model_name}</h4>
                          {model.is_available ? (
                            <Badge variant="success" size="sm">Available</Badge>
                          ) : (
                            <Badge variant="error" size="sm">Unavailable</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Type:</span> {model.model_type}
                          </div>
                          <div>
                            <span className="text-gray-500">Context:</span> {model.context_window ? `${(model.context_window / 1000).toFixed(0)}K` : 'N/A'}
                          </div>
                          {model.input_price_per_1k && (
                            <>
                              <div>
                                <span className="text-gray-500">Input:</span> ${model.input_price_per_1k}/1K
                              </div>
                              <div>
                                <span className="text-gray-500">Output:</span> ${model.output_price_per_1k || '0'}/1K
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No models configured for this provider
                  </div>
                )}
                <Button onClick={() => onManageModels(provider)} variant="outline" className="w-full">
                  <Database className="w-4 h-4 mr-2" />
                  Manage Models
                </Button>
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Usage Analytics</h3>
                {usageData ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Total Cost</span>
                        <span className="text-2xl font-bold">${usageData.totalCost.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Across {usageData.totalRequests.toLocaleString()} requests
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                        <Clock className="w-4 h-4 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500">Avg Response Time</p>
                        <p className="text-lg font-semibold">{usageData.avgResponseTime}ms</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                        <DollarSign className="w-4 h-4 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500">Cost per Request</p>
                        <p className="text-lg font-semibold">
                          ${(usageData.totalCost / usageData.totalRequests).toFixed(4)}
                        </p>
                      </div>
                    </div>

                    <Button onClick={() => onViewUsage(provider)} variant="outline" className="w-full">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Detailed Analytics
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No usage data available yet
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Provider Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                    <div>
                      <p className="font-medium">Active Status</p>
                      <p className="text-xs text-gray-500">Provider is currently {provider.is_active ? 'active' : 'inactive'}</p>
                    </div>
                    <Badge variant={provider.is_active ? 'success' : 'error'} size="sm">
                      {provider.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                    <div>
                      <p className="font-medium">Primary Provider</p>
                      <p className="text-xs text-gray-500">Use as default for new operations</p>
                    </div>
                    <Badge variant={provider.is_primary ? 'warning' : 'outline'} size="sm">
                      {provider.is_primary ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                <Button onClick={() => onEdit(provider)} className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Provider Settings
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
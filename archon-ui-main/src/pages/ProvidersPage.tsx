import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import { unifiedProviderApi } from '../services/unifiedProviderService';
import { CredentialModal } from '../components/providers/CredentialModal';
import { EnhancedProviderCard } from '../components/providers/EnhancedProviderCard';
import { ActiveProviderSection } from '../components/providers/ActiveProviderSection';
import { ProviderDetailsSidebar } from '../components/providers/ProviderDetailsSidebar';
import type {
  Provider,
  ProviderCreate,
  Credential,
  Model,
  ActiveProviders,
  ServiceType,
  ProviderType
} from '../types/provider';
import { 
  Plus, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const ProvidersPage: React.FC = () => {
  const { showToast } = useToast();

  // State
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [activeProviders, setActiveProviders] = useState<ActiveProviders>({ llm_provider_id: null, embedding_provider_id: null });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modals
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);
  const [providerCredentials, setProviderCredentials] = useState<Credential[]>([]);
  
  // Create form
  const [newProvider, setNewProvider] = useState<ProviderCreate>({
    name: '',
    display_name: '',
    provider_type: 'openai' as ProviderType,
    service_types: ['llm'] as ServiceType[],
    base_url: '',
    is_active: true,
    is_primary: false,
    config: {}
  });

  const providerTypeOptions = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'cohere', label: 'Cohere' },
    { value: 'huggingface', label: 'HuggingFace' },
    { value: 'ollama', label: 'Ollama' },
    { value: 'custom', label: 'Custom' },
  ];

  const serviceTypeOptions = [
    { value: 'llm', label: 'LLM' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'reranking', label: 'Reranking' },
    { value: 'speech', label: 'Speech' },
    { value: 'vision', label: 'Vision' },
  ];

  // Load data
  const loadProviders = useCallback(async () => {
    setLoading(true);
    try {
      const [providerList, modelList, active] = await Promise.all([
        unifiedProviderApi.providers.list(),
        unifiedProviderApi.models.list(),
        unifiedProviderApi.providers.getActive()
      ]);
      
      setProviders(providerList);
      setModels(modelList);
      setActiveProviders(active);
    } catch (err) {
      console.error('Failed to load provider data', err);
      const message = err instanceof Error ? err.message : 'Failed to load provider data';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  // Use all providers without filtering
  const filteredProviders = providers;

  const activeProviderCount = [activeProviders.llm_provider_id, activeProviders.embedding_provider_id].filter(Boolean).length;

  const getActiveServicesForProvider = (provider: Provider): string[] => {
    const services: string[] = [];
    if (provider.id === activeProviders.llm_provider_id) services.push('llm');
    if (provider.id === activeProviders.embedding_provider_id) services.push('embedding');
    return services;
  };

  // Provider operations
  const handleCreateProvider = async () => {
    try {
      const createdProvider = await unifiedProviderApi.providers.create(newProvider);
      showToast('Provider created successfully', 'success');
      setShowCreateModal(false);
      
      // Optimistic update - add new provider to local state
      if (createdProvider) {
        setProviders(prev => [...prev, createdProvider]);
      } else {
        // Only reload if we didn't get the created provider back
        await loadProviders();
      }
      
      setNewProvider({
        name: '',
        display_name: '',
        provider_type: 'openai' as ProviderType,
        service_types: ['llm'] as ServiceType[],
        base_url: '',
        is_active: true,
        is_primary: false,
        config: {}
      });
    } catch (err) {
      console.error('Failed to create provider', err);
      const message = err instanceof Error ? err.message : 'Failed to create provider';
      showToast(message, 'error');
    }
  };

  // (reserved) Update provider handler — can be added back when edit modal is implemented

  const handleDeleteProvider = async (provider: Provider) => {
    if (confirm(`Are you sure you want to delete ${provider.display_name}?`)) {
      try {
        // Optimistic update - remove from local state immediately
        setProviders(prev => prev.filter(p => p.id !== provider.id));
        
        // Clear from active providers if it was active
        setActiveProviders(prev => ({
          llm_provider_id: prev.llm_provider_id === provider.id ? null : prev.llm_provider_id,
          embedding_provider_id: prev.embedding_provider_id === provider.id ? null : prev.embedding_provider_id
        }));
        
        await unifiedProviderApi.providers.delete(provider.id);
        showToast('Provider deleted successfully', 'success');
      } catch (err) {
        console.error('Failed to delete provider', err);
        const message = err instanceof Error ? err.message : 'Failed to delete provider';
        showToast(message, 'error');
        // Revert on error
        await loadProviders();
      }
    }
  };

  // Credential operations
  const handleManageCredentials = async (provider: Provider) => {
    setSelectedProvider(provider);
    setShowCredentialModal(true);
    // Load credentials for this provider
    // Note: We'd need to add a list endpoint for credentials
    setProviderCredentials([]);
  };

  const handleAddCredential = async (data: any) => {
    if (!selectedProvider) return;
    try {
      await unifiedProviderApi.credentials.add(selectedProvider.id, data);
      showToast('Credential added successfully', 'success');
      // Reload credentials
    } catch (err) {
      console.error('Failed to add credential', err);
      const message = err instanceof Error ? err.message : 'Failed to add credential';
      showToast(message, 'error');
    }
  };

  const handleRotateCredential = async (credentialId: string, newValue: string) => {
    try {
      await unifiedProviderApi.credentials.rotate(credentialId, newValue);
      showToast('Credential rotated successfully', 'success');
      // Reload credentials
    } catch (err) {
      console.error('Failed to rotate credential', err);
      const message = err instanceof Error ? err.message : 'Failed to rotate credential';
      showToast(message, 'error');
    }
  };

  // Health check
  const handleCheckHealth = useCallback(async (provider: Provider) => {
    try {
      const result = await unifiedProviderApi.health.check(provider.id);
      const status = result.status === 'healthy' ? 'success' : 'warning';
      showToast(`Health check: ${result.status} (${result.response_time_ms}ms)`, status);
    } catch (err) {
      console.error('Health check failed', err);
      const message = err instanceof Error ? err.message : 'Health check failed';
      showToast(message, 'error');
    }
  }, [showToast]);

  // Other operations
  const handleManageModels = useCallback((_provider: Provider) => {
    // TODO: Open models modal
    showToast('Models management coming soon', 'info');
  }, [showToast]);

  const handleViewUsage = useCallback((_provider: Provider) => {
    // TODO: Open usage modal
    showToast('Usage analytics coming soon', 'info');
  }, [showToast]);

  const handleEditProvider = useCallback((provider: Provider) => {
    setSelectedProvider(provider);
    showToast('Edit functionality coming soon', 'info');
  }, [showToast]);

  const handleToggleActive = useCallback(async (provider: Provider) => {
    try {
      const updatedProvider = { ...provider, is_active: !provider.is_active };
      
      // Optimistic update - update local state immediately
      setProviders(prev => prev.map(p => 
        p.id === provider.id ? updatedProvider : p
      ));
      
      // If provider is being deactivated and was active, clear it from active providers
      if (!updatedProvider.is_active) {
        setActiveProviders(prev => ({
          llm_provider_id: prev.llm_provider_id === provider.id ? null : prev.llm_provider_id,
          embedding_provider_id: prev.embedding_provider_id === provider.id ? null : prev.embedding_provider_id
        }));
      }
      
      await unifiedProviderApi.providers.update(provider.id, updatedProvider);
      showToast(`Provider ${provider.is_active ? 'deactivated' : 'activated'} successfully`, 'success');
    } catch (err) {
      console.error('Failed to toggle provider status', err);
      const message = err instanceof Error ? err.message : 'Failed to toggle provider status';
      showToast(message, 'error');
      // Revert on error
      await loadProviders();
    }
  }, [showToast, loadProviders]);

  const handleSetActiveProvider = useCallback(async (serviceType: ServiceType, providerId: string) => {
    try {
      // Optimistic update - update local state immediately
      setActiveProviders(prev => {
        if (serviceType === 'llm') {
          return { ...prev, llm_provider_id: providerId };
        } else if (serviceType === 'embedding') {
          return { ...prev, embedding_provider_id: providerId };
        }
        return prev;
      });
      
      await unifiedProviderApi.providers.setActive({ service_type: serviceType, provider_id: providerId });
      showToast(`Active ${serviceType} provider updated`, 'success');
    } catch (err) {
      console.error('Failed to set active provider', err);
      const message = err instanceof Error ? err.message : 'Failed to set active provider';
      showToast(message, 'error');
      // Revert on error
      await loadProviders();
    }
  }, [showToast, loadProviders]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-normal text-white">
              Provider Management
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadProviders}
              disabled={loading}
              className="px-3 py-1.5 text-xs rounded-md border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
            >
              <RefreshCw className={`w-3 h-3 inline mr-1.5 ${loading ? 'animate-spin' : 'transition-transform duration-200 hover:rotate-180'}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 text-xs rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-600/20"
            >
              <Plus className="w-3 h-3 inline mr-1.5" />
              Add Provider
            </button>
          </div>
        </div>


        {/* Active Providers Section */}
        <ActiveProviderSection
          providers={providers}
          activeProviders={activeProviders}
          onSetActive={handleSetActiveProvider}
          loading={loading}
        />


        {/* Providers Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              All Providers
              {filteredProviders.length > 0 && (
                <span className="text-sm text-zinc-500">({filteredProviders.length})</span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-32 bg-gray-200 dark:bg-zinc-800 rounded" />
                </Card>
              ))}
            </div>
          ) : filteredProviders.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ position: 'static', overflow: 'visible' }}>
                {filteredProviders.map((provider, index) => (
                  <div key={provider.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-fadeInUp">
                    <EnhancedProviderCard
                    key={provider.id}
                    provider={provider}
                    isActiveForServices={getActiveServicesForProvider(provider)}
                    onEdit={handleEditProvider}
                    onDelete={handleDeleteProvider}
                    onManageCredentials={handleManageCredentials}
                    onManageModels={handleManageModels}
                    onCheckHealth={handleCheckHealth}
                    onViewUsage={handleViewUsage}
                    onToggleActive={handleToggleActive}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-0 overflow-hidden backdrop-blur-md bg-white/80 dark:bg-zinc-900/80">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-700">
                      <tr className="text-left">
                        <th className="px-4 py-3">Provider</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Services</th>
                        <th className="px-4 py-3">Active For</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProviders.map((p) => {
                        const activeServices = getActiveServicesForProvider(p);
                        return (
                          <tr key={p.id} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                  <span className="font-medium">{p.display_name || p.name}</span>
                                  <span className="text-xs text-gray-500">{p.name}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 capitalize">{p.provider_type}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {p.service_types.map(s => (
                                  <Badge key={s} variant="outline" size="sm">{s}</Badge>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {activeServices.length > 0 ? (
                                  activeServices.map(s => (
                                    <Badge key={s} variant="success" size="sm">{s.toUpperCase()}</Badge>
                                  ))
                                ) : (
                                  <Badge variant="outline" size="sm">—</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {p.is_active ? (
                                <Badge variant="success" size="sm">Active</Badge>
                              ) : (
                                <Badge variant="error" size="sm">Inactive</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => { 
                                    setSelectedProvider(p); 
                                    setShowDetailsSidebar(true); 
                                  }}
                                >
                                  Details
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleToggleActive(p)}
                                >
                                  {p.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center animate-fadeIn" style={{ animation: 'fadeIn 0.5s ease-out' }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-zinc-800/50 flex items-center justify-center animate-scaleIn" style={{ animation: 'scaleIn 0.6s ease-out' }}>
                <Sparkles className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {providers.length === 0 ? 'No Providers Configured' : 'No Results Found'}
              </h3>
              <p className="text-zinc-500 text-sm mb-6 max-w-md mx-auto">
                {providers.length === 0
                  ? 'Get started by adding your first AI provider'
                  : 'No providers found'}
              </p>
              {providers.length === 0 ? (
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Provider
                </Button>
              ) : null}
            </div>
          )}
        </div>

      </div>

      {/* Create Provider Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title=""
          size="lg"
        >
          <div className="space-y-6">
            {/* Custom Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-800/50">
              <div className="p-3 rounded-xl bg-black/30">
                <Plus className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-light text-white">
                  Add New Provider
                </h2>
                <p className="text-sm text-gray-500">
                  Configure a new AI service provider
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Internal Name"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., openai-primary"
                  required
                />
                <Input
                  label="Display Name"
                  value={newProvider.display_name}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="e.g., OpenAI Primary"
                  required
                />
              </div>

              <Select
                label="Provider Type"
                value={newProvider.provider_type}
                onChange={(e) => setNewProvider(prev => ({ 
                  ...prev, 
                  provider_type: e.target.value as ProviderType 
                }))}
                options={providerTypeOptions}
              />

              <div className="space-y-3">
                <label className="block text-sm font-light text-white">Service Types</label>
                <div className="rounded-xl p-4" style={{
                  background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.9) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.1)'
                }}>
                  <div className="grid grid-cols-2 gap-3">
                    {serviceTypeOptions.map(option => {
                      const isChecked = newProvider.service_types.includes(option.value as ServiceType);
                      return (
                        <label key={option.value} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-purple-600/10">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewProvider(prev => ({
                                    ...prev,
                                    service_types: [...prev.service_types, option.value as ServiceType]
                                  }));
                                } else {
                                  setNewProvider(prev => ({
                                    ...prev,
                                    service_types: prev.service_types.filter(s => s !== option.value)
                                  }));
                                }
                              }}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                              isChecked 
                                ? 'bg-purple-600 border-purple-600' 
                                : 'border-gray-600 hover:border-purple-400'
                            }`}>
                              {isChecked && (
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className={`text-sm transition-colors ${isChecked ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}>
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Input
                label="Base URL (Optional)"
                value={newProvider.base_url || ''}
                onChange={(e) => setNewProvider(prev => ({ ...prev, base_url: e.target.value }))}
                placeholder="https://api.example.com/v1"
              />

              <div className="rounded-xl p-4" style={{
                background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.9) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.1)'
              }}>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={newProvider.is_active}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                        newProvider.is_active 
                          ? 'bg-emerald-600 border-emerald-600' 
                          : 'border-gray-600 hover:border-emerald-400'
                      }`}>
                        {newProvider.is_active && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm transition-colors ${newProvider.is_active ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`}>
                      Active
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={newProvider.is_primary}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, is_primary: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                        newProvider.is_primary 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-600 hover:border-blue-400'
                      }`}>
                        {newProvider.is_primary && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm transition-colors ${newProvider.is_primary ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}>
                      Primary Provider
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleCreateProvider}
                  disabled={!newProvider.name || !newProvider.display_name || newProvider.service_types.length === 0}
                  className="px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-600/20"
                >
                  Create Provider
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Credential Management Modal */}
      {showCredentialModal && selectedProvider && (
        <CredentialModal
          isOpen={showCredentialModal}
          onClose={() => {
            setShowCredentialModal(false);
            setSelectedProvider(null);
          }}
          provider={selectedProvider}
          credentials={providerCredentials}
          onAdd={handleAddCredential}
          onRotate={handleRotateCredential}
        />
      )}

      {/* Provider Details Sidebar */}
      <ProviderDetailsSidebar
        isOpen={showDetailsSidebar}
        onClose={() => { 
          setShowDetailsSidebar(false); 
          setSelectedProvider(null); 
        }}
        provider={selectedProvider}
        models={models}
        onEdit={handleEditProvider}
        onManageCredentials={handleManageCredentials}
        onManageModels={handleManageModels}
        onCheckHealth={handleCheckHealth}
        onViewUsage={handleViewUsage}
      />
    </div>
  );
};

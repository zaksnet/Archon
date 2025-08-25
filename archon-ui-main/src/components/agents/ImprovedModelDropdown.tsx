/**
 * Improved Model Dropdown Component
 * 
 * Enhanced dropdown for selecting AI models with search, filtering, and rich information
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Search,
  X,
  Sparkles,
  Zap,
  DollarSign,
  Brain,
  Eye,
  Wrench,
  MessageSquare,
  AlertCircle,
  Check,
  TrendingUp,
  Clock,
  Star,
  Filter
} from 'lucide-react';
import type { AvailableModel } from '../../types/cleanProvider';

interface ImprovedModelDropdownProps {
  models: AvailableModel[];
  value: string;
  onChange: (modelString: string) => void;
  placeholder?: string;
  className?: string;
  showCosts?: boolean;
  showCapabilities?: boolean;
  groupByProvider?: boolean;
}

export const ImprovedModelDropdown: React.FC<ImprovedModelDropdownProps> = ({
  models,
  value,
  onChange,
  placeholder = 'Select a model',
  className = '',
  showCosts = true,
  showCapabilities = true,
  groupByProvider = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCostTier, setFilterCostTier] = useState<string>('all');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get current selected model
  const selectedModel = models.find(m => m.model_string === value);

  // Get unique providers for filtering
  const uniqueProviders = useMemo(() => {
    const providers = new Set(models.map(m => m.provider));
    return Array.from(providers).sort();
  }, [models]);

  // Get unique cost tiers
  const uniqueCostTiers = useMemo(() => {
    const tiers = new Set(models.map(m => m.cost_tier).filter(Boolean));
    return Array.from(tiers);
  }, [models]);

  // Provider display names and colors
  const getProviderInfo = (provider: string) => {
    const info: Record<string, { name: string; color: string; icon: string }> = {
      openai: { name: 'OpenAI', color: 'text-emerald-400', icon: '🤖' },
      anthropic: { name: 'Anthropic', color: 'text-blue-400', icon: '🧠' },
      google: { name: 'Google', color: 'text-yellow-400', icon: '🔍' },
      mistral: { name: 'Mistral', color: 'text-purple-400', icon: '🌊' },
      meta: { name: 'Meta', color: 'text-blue-500', icon: '🔷' },
      groq: { name: 'Groq', color: 'text-orange-400', icon: '⚡' },
      deepseek: { name: 'DeepSeek', color: 'text-cyan-400', icon: '🔬' },
      ollama: { name: 'Ollama', color: 'text-gray-400', icon: '🦙' },
      openrouter: { name: 'OpenRouter', color: 'text-pink-400', icon: '🌍' },
      cohere: { name: 'Cohere', color: 'text-indigo-400', icon: '🌐' },
      xai: { name: 'xAI', color: 'text-red-400', icon: '✖️' }
    };
    
    return info[provider.toLowerCase()] || {
      name: provider.charAt(0).toUpperCase() + provider.slice(1),
      color: 'text-gray-400',
      icon: '🤖'
    };
  };

  // Cost tier colors and labels
  const getCostTierInfo = (tier?: string | null) => {
    switch (tier) {
      case 'free':
        return { label: 'Free', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', icon: '✨' };
      case 'low':
        return { label: '$', color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: '$' };
      case 'medium':
        return { label: '$$', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', icon: '$$' };
      case 'high':
        return { label: '$$$', color: 'text-orange-400', bgColor: 'bg-orange-500/10', icon: '$$$' };
      default:
        return { label: '', color: 'text-gray-400', bgColor: '', icon: '' };
    }
  };

  // Filter and sort models
  const filteredModels = useMemo(() => {
    let filtered = [...models];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.display_name.toLowerCase().includes(query) ||
        m.model.toLowerCase().includes(query) ||
        m.provider.toLowerCase().includes(query)
      );
    }

    // Filter by provider
    if (filterProvider !== 'all') {
      filtered = filtered.filter(m => m.provider === filterProvider);
    }

    // Filter by cost tier
    if (filterCostTier !== 'all') {
      filtered = filtered.filter(m => m.cost_tier === filterCostTier);
    }

    // Sort by cost tier (free first) then by name
    filtered.sort((a, b) => {
      // Free models first
      if (a.cost_tier === 'free' && b.cost_tier !== 'free') return -1;
      if (a.cost_tier !== 'free' && b.cost_tier === 'free') return 1;
      
      // Then by cost tier
      const tierOrder = { 'low': 1, 'medium': 2, 'high': 3 };
      const aTier = tierOrder[a.cost_tier as keyof typeof tierOrder] || 4;
      const bTier = tierOrder[b.cost_tier as keyof typeof tierOrder] || 4;
      if (aTier !== bTier) return aTier - bTier;
      
      // Finally by name
      return a.display_name.localeCompare(b.display_name);
    });

    return filtered;
  }, [models, searchQuery, filterProvider, filterCostTier]);

  // Group models by provider if requested
  const groupedModels = useMemo(() => {
    if (!groupByProvider) return { '': filteredModels };
    
    const grouped: Record<string, AvailableModel[]> = {};
    filteredModels.forEach(model => {
      if (!grouped[model.provider]) {
        grouped[model.provider] = [];
      }
      grouped[model.provider].push(model);
    });
    
    return grouped;
  }, [filteredModels, groupByProvider]);

  // Handle model selection
  const handleSelectModel = (model: AvailableModel) => {
    onChange(model.model_string);
    setIsOpen(false);
    setSearchQuery('');
    setFilterCostTier('all');
    setFilterProvider('all');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Format cost for display
  const formatCost = (cost?: { input: number; output: number } | null) => {
    if (!cost) return null;
    const avgCost = (cost.input + cost.output) / 2;
    if (avgCost < 0.01) return `$${avgCost.toFixed(4)}`;
    if (avgCost < 0.1) return `$${avgCost.toFixed(3)}`;
    return `$${avgCost.toFixed(2)}`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-sm border rounded-lg bg-zinc-900/50 text-white transition-all flex items-center justify-between group ${
          isOpen 
            ? 'border-purple-500 ring-1 ring-purple-500' 
            : 'border-zinc-700/50 hover:border-zinc-600'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedModel ? (
            <>
              <span className="text-lg">
                {getProviderInfo(selectedModel.provider).icon}
              </span>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate">{selectedModel.display_name}</span>
                  {selectedModel.cost_tier && (
                    <span className={`text-xs ${getCostTierInfo(selectedModel.cost_tier).color}`}>
                      {getCostTierInfo(selectedModel.cost_tier).label}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedModel.model_string}
                </div>
              </div>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
             style={{ minWidth: '400px', maxWidth: '600px' }}>
          
          {/* Search and Filters Header */}
          <div className="p-3 border-b border-zinc-700 bg-zinc-800/50 space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models..."
                className="w-full pl-10 pr-10 py-2 text-sm bg-zinc-800 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              
              {/* Provider Filter */}
              {uniqueProviders.length > 1 && (
                <select
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value)}
                  className="px-2 py-1 text-xs bg-zinc-700 text-white rounded border border-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="all">All Providers</option>
                  {uniqueProviders.map(provider => (
                    <option key={provider} value={provider}>
                      {getProviderInfo(provider).name}
                    </option>
                  ))}
                </select>
              )}

              {/* Cost Tier Filter */}
              {uniqueCostTiers.length > 1 && (
                <select
                  value={filterCostTier}
                  onChange={(e) => setFilterCostTier(e.target.value)}
                  className="px-2 py-1 text-xs bg-zinc-700 text-white rounded border border-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="all">All Costs</option>
                  {uniqueCostTiers.map(tier => (
                    <option key={tier} value={tier}>
                      {getCostTierInfo(tier).label || tier}
                    </option>
                  ))}
                </select>
              )}

              {/* Results Count */}
              <span className="ml-auto text-xs text-gray-500">
                {filteredModels.length} models
              </span>
            </div>
          </div>

          {/* Models List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredModels.length > 0 ? (
              <div className="p-2">
                {Object.entries(groupedModels).map(([provider, providerModels]) => (
                  <div key={provider || 'ungrouped'}>
                    {groupByProvider && provider && (
                      <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                        <span className="text-lg">{getProviderInfo(provider).icon}</span>
                        <span className={`text-xs font-medium ${getProviderInfo(provider).color}`}>
                          {getProviderInfo(provider).name}
                        </span>
                        <div className="flex-1 h-px bg-zinc-800"></div>
                      </div>
                    )}
                    
                    {providerModels.map(model => (
                      <button
                        key={model.model_string}
                        onClick={() => handleSelectModel(model)}
                        className={`w-full px-3 py-2.5 mb-1 text-left rounded-lg transition-all hover:bg-zinc-800 group ${
                          model.model_string === value ? 'bg-purple-600/20 ring-1 ring-purple-600/50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Model Name and Selected Indicator */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-white group-hover:text-purple-400 transition-colors">
                                {model.display_name}
                              </span>
                              {model.model_string === value && (
                                <Check className="w-4 h-4 text-purple-400" />
                              )}
                            </div>
                            
                            {/* Model ID */}
                            <div className="text-xs text-gray-500 mb-1.5 font-mono">
                              {model.model}
                            </div>
                            
                            {/* Badges and Info */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Cost Tier */}
                              {model.cost_tier && (
                                <span className={`px-2 py-0.5 text-xs rounded ${getCostTierInfo(model.cost_tier).bgColor} ${getCostTierInfo(model.cost_tier).color}`}>
                                  {getCostTierInfo(model.cost_tier).label}
                                </span>
                              )}
                              
                              {/* Actual Cost */}
                              {showCosts && model.estimated_cost_per_1k && (
                                <span className="text-xs text-gray-400">
                                  {formatCost(model.estimated_cost_per_1k)}/1K
                                </span>
                              )}
                              
                              {/* API Key Status */}
                              {!model.has_api_key && (
                                <span className="px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-400 rounded flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  No API Key
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Brain className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-2">
                  No models found
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterCostTier('all');
                    setFilterProvider('all');
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Footer Stats */}
          {filteredModels.length > 0 && (
            <div className="px-3 py-2 border-t border-zinc-700 bg-zinc-800/50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  {uniqueCostTiers.includes('free') && (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      {filteredModels.filter(m => m.cost_tier === 'free').length} free
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    {uniqueProviders.length} providers
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-purple-400" />
                  Best match first
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
/**
 * Improved Provider Dropdown Component
 * 
 * Enhanced dropdown with categories, search, and rich provider information
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  ChevronDown,
  Search,
  X,
  Sparkles,
  Zap,
  Globe,
  Server,
  Building2,
  Coins,
  Eye,
  Brain,
  Code,
  MessageSquare,
  Image as ImageIcon,
  Wrench,
  Star,
  TrendingUp,
  Shield,
  Clock
} from 'lucide-react';
import type { ProviderType } from '../../types/cleanProvider';

interface ProviderInfo {
  name: string;
  displayName: string;
  category: 'premium' | 'mainstream' | 'open-source' | 'local' | 'specialized';
  description: string;
  features: string[];
  icon: string;
  popular?: boolean;
  new?: boolean;
  costLevel?: 'free' | 'low' | 'medium' | 'high';
}

interface ImprovedProviderDropdownProps {
  availableProviders: string[];
  metadata?: Record<string, any>;
  onAddProvider: (provider: ProviderType) => void;
  className?: string;
}

export const ImprovedProviderDropdown: React.FC<ImprovedProviderDropdownProps> = ({
  availableProviders,
  metadata = {},
  onAddProvider,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Provider information database
  const providerInfo: Record<string, ProviderInfo> = {
    openai: {
      name: 'openai',
      displayName: 'OpenAI',
      category: 'premium',
      description: 'GPT-4, GPT-3.5 Turbo, DALL-E, Whisper',
      features: ['Advanced reasoning', 'Code generation', 'Vision', 'Function calling'],
      icon: '🤖',
      popular: true,
      costLevel: 'high'
    },
    anthropic: {
      name: 'anthropic',
      displayName: 'Anthropic',
      category: 'premium',
      description: 'Claude 3 Opus, Sonnet, Haiku',
      features: ['Long context (200K)', 'Advanced reasoning', 'Code analysis'],
      icon: '🧠',
      popular: true,
      costLevel: 'high'
    },
    google: {
      name: 'google',
      displayName: 'Google AI',
      category: 'mainstream',
      description: 'Gemini Pro, Gemini Flash, PaLM',
      features: ['Multimodal', 'Fast inference', 'Large context'],
      icon: '🔍',
      popular: true,
      costLevel: 'medium'
    },
    mistral: {
      name: 'mistral',
      displayName: 'Mistral AI',
      category: 'mainstream',
      description: 'Mistral Large, Medium, Small, Mixtral',
      features: ['European', 'Efficient', 'Open weights available'],
      icon: '🌊',
      costLevel: 'medium'
    },
    meta: {
      name: 'meta',
      displayName: 'Meta',
      category: 'open-source',
      description: 'Llama 3, Code Llama',
      features: ['Open source', 'Fine-tunable', 'Commercial use'],
      icon: '🔷',
      popular: true,
      costLevel: 'low'
    },
    groq: {
      name: 'groq',
      displayName: 'Groq',
      category: 'specialized',
      description: 'Ultra-fast inference with LPU chips',
      features: ['Fastest inference', 'Low latency', 'High throughput'],
      icon: '⚡',
      popular: true,
      new: true,
      costLevel: 'low'
    },
    deepseek: {
      name: 'deepseek',
      displayName: 'DeepSeek',
      category: 'mainstream',
      description: 'DeepSeek Coder, Chat models',
      features: ['Code specialized', 'Competitive pricing', 'Good performance'],
      icon: '🔬',
      costLevel: 'low'
    },
    openrouter: {
      name: 'openrouter',
      displayName: 'OpenRouter',
      category: 'specialized',
      description: 'Unified API for 100+ models',
      features: ['All providers', 'Single API', 'Automatic fallbacks'],
      icon: '🌍',
      new: true,
      costLevel: 'medium'
    },
    ollama: {
      name: 'ollama',
      displayName: 'Ollama',
      category: 'local',
      description: 'Run models locally on your machine',
      features: ['Privacy', 'No API costs', 'Offline capable'],
      icon: '🦙',
      popular: true,
      costLevel: 'free'
    },
    cohere: {
      name: 'cohere',
      displayName: 'Cohere',
      category: 'mainstream',
      description: 'Command, Embed, Rerank models',
      features: ['Enterprise focus', 'RAG optimized', 'Multilingual'],
      icon: '🌐',
      costLevel: 'medium'
    },
    perplexity: {
      name: 'perplexity',
      displayName: 'Perplexity',
      category: 'specialized',
      description: 'Online LLMs with web search',
      features: ['Real-time web', 'Citations', 'Current events'],
      icon: '🔎',
      new: true,
      costLevel: 'medium'
    },
    xai: {
      name: 'xai',
      displayName: 'xAI',
      category: 'premium',
      description: 'Grok models from X.AI',
      features: ['Real-time knowledge', 'Uncensored', 'Twitter integration'],
      icon: '✖️',
      new: true,
      costLevel: 'high'
    },
    together: {
      name: 'together',
      displayName: 'Together AI',
      category: 'mainstream',
      description: 'Open models, custom fine-tuning',
      features: ['Open models', 'Fine-tuning', 'Inference API'],
      icon: '🤝',
      costLevel: 'low'
    },
    replicate: {
      name: 'replicate',
      displayName: 'Replicate',
      category: 'specialized',
      description: 'Run and deploy ML models',
      features: ['Model zoo', 'Custom deployments', 'Serverless'],
      icon: '🔁',
      costLevel: 'medium'
    },
    ai21: {
      name: 'ai21',
      displayName: 'AI21 Labs',
      category: 'mainstream',
      description: 'Jurassic, task-specific models',
      features: ['Specialized tasks', 'Enterprise', 'Custom models'],
      icon: '🚀',
      costLevel: 'medium'
    }
  };

  // Categories for organization
  const categories = {
    all: { label: 'All Providers', icon: <Globe className="w-4 h-4" /> },
    premium: { label: 'Premium', icon: <Star className="w-4 h-4" /> },
    mainstream: { label: 'Mainstream', icon: <Building2 className="w-4 h-4" /> },
    'open-source': { label: 'Open Source', icon: <Code className="w-4 h-4" /> },
    local: { label: 'Local', icon: <Server className="w-4 h-4" /> },
    specialized: { label: 'Specialized', icon: <Zap className="w-4 h-4" /> }
  };

  // Get provider info with fallback
  const getProviderInfo = (provider: string): ProviderInfo => {
    return providerInfo[provider.toLowerCase()] || {
      name: provider,
      displayName: provider.charAt(0).toUpperCase() + provider.slice(1),
      category: 'mainstream',
      description: 'AI model provider',
      features: [],
      icon: '🤖',
      costLevel: 'medium'
    };
  };

  // Filter providers based on search and category
  const filteredProviders = useMemo(() => {
    let filtered = availableProviders;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => {
        const info = getProviderInfo(p);
        return info.category === selectedCategory;
      });
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const info = getProviderInfo(p);
        return (
          info.displayName.toLowerCase().includes(query) ||
          info.description.toLowerCase().includes(query) ||
          info.features.some(f => f.toLowerCase().includes(query))
        );
      });
    }

    // Sort by popularity and name
    return filtered.sort((a, b) => {
      const aInfo = getProviderInfo(a);
      const bInfo = getProviderInfo(b);
      
      // Popular providers first
      if (aInfo.popular && !bInfo.popular) return -1;
      if (!aInfo.popular && bInfo.popular) return 1;
      
      // Then by name
      return aInfo.displayName.localeCompare(bInfo.displayName);
    });
  }, [availableProviders, searchQuery, selectedCategory]);

  // Get cost indicator
  const getCostIndicator = (level?: string) => {
    switch (level) {
      case 'free': return <span className="text-emerald-400">Free</span>;
      case 'low': return <span className="text-blue-400">$</span>;
      case 'medium': return <span className="text-yellow-400">$$</span>;
      case 'high': return <span className="text-orange-400">$$$</span>;
      default: return null;
    }
  };

  // Handle provider selection
  const handleSelectProvider = (provider: string) => {
    onAddProvider(provider as ProviderType);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedCategory('all');
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

  if (availableProviders.length === 0) return null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white text-sm rounded-lg transition-all shadow-lg hover:shadow-xl"
      >
        <Plus className="w-4 h-4" />
        <span>Add Provider</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[480px] max-h-[600px] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Search Header */}
          <div className="p-4 border-b border-zinc-700 bg-zinc-800/50">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search providers by name, features..."
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

            {/* Category Tabs */}
            <div className="flex gap-1 overflow-x-auto">
              {Object.entries(categories).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap ${
                    selectedCategory === key
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-700 text-gray-400 hover:bg-zinc-600 hover:text-white'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Provider List */}
          <div className="max-h-[450px] overflow-y-auto">
            {filteredProviders.length > 0 ? (
              <div className="p-2">
                {filteredProviders.map(provider => {
                  const info = getProviderInfo(provider);
                  const providerMeta = metadata[provider];
                  
                  return (
                    <button
                      key={provider}
                      onClick={() => handleSelectProvider(provider)}
                      className="w-full p-3 mb-2 text-left rounded-lg hover:bg-zinc-800 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-2xl mt-0.5">{info.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                                {info.displayName}
                              </span>
                              {info.popular && (
                                <span className="px-1.5 py-0.5 text-xs bg-purple-600/20 text-purple-400 rounded">
                                  Popular
                                </span>
                              )}
                              {info.new && (
                                <span className="px-1.5 py-0.5 text-xs bg-emerald-600/20 text-emerald-400 rounded">
                                  New
                                </span>
                              )}
                              {getCostIndicator(info.costLevel)}
                            </div>
                            
                            <p className="text-xs text-gray-400 mb-2">
                              {info.description}
                            </p>
                            
                            {/* Features */}
                            {info.features.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {info.features.slice(0, 3).map((feature, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 text-xs bg-zinc-700/50 text-gray-300 rounded"
                                  >
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {/* Metadata from API */}
                            {providerMeta && (
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                {providerMeta.model_count > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Brain className="w-3 h-3" />
                                    {providerMeta.model_count} models
                                  </span>
                                )}
                                {providerMeta.max_context_length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" />
                                    {providerMeta.max_context_length >= 1000000 
                                      ? `${Math.floor(providerMeta.max_context_length / 1000000)}M` 
                                      : `${Math.floor(providerMeta.max_context_length / 1000)}K`}
                                  </span>
                                )}
                                {providerMeta.supports_vision && (
                                  <ImageIcon className="w-3 h-3 text-blue-400" title="Vision support" />
                                )}
                                {providerMeta.supports_tools && (
                                  <Wrench className="w-3 h-3 text-purple-400" title="Tools/Functions" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Plus className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors ml-2" />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  No providers found matching your criteria
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-2 text-xs text-purple-400 hover:text-purple-300"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Footer with stats */}
          <div className="px-4 py-3 border-t border-zinc-700 bg-zinc-800/50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {filteredProviders.length} of {availableProviders.length} providers
              </span>
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3" />
                <span>All API keys encrypted</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
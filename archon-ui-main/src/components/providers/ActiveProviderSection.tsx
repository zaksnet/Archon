import React from 'react';
import { ProviderLogo } from './ProviderLogo';
import type { Provider, ActiveProviders } from '../../types/provider';
import { ServiceType } from '../../types/provider';
import { 
  Brain, 
  Database, 
  Eye, 
  Mic,
  ArrowUpDown,
} from 'lucide-react';

interface ActiveProviderSectionProps {
  providers: Provider[];
  activeProviders: ActiveProviders;
  onSetActive: (serviceType: ServiceType, providerId: string) => void;
  loading?: boolean;
}

const serviceConfigs: Record<ServiceType, { 
  icon: React.FC<{ className?: string }>;
  label: string;
  description: string;
  color: string;
}> = {
  [ServiceType.LLM]: {
    icon: Brain,
    label: 'Language Model',
    description: 'Powers conversations and text generation',
    color: 'text-blue-400'
  },
  [ServiceType.EMBEDDING]: {
    icon: Database,
    label: 'Embeddings',
    description: 'Creates vector representations for search',
    color: 'text-emerald-400'
  },
  [ServiceType.RERANKING]: {
    icon: ArrowUpDown,
    label: 'Reranking',
    description: 'Optimizes search result relevance',
    color: 'text-purple-400'
  },
  [ServiceType.VISION]: {
    icon: Eye,
    label: 'Vision',
    description: 'Processes and understands images',
    color: 'text-orange-400'
  },
  [ServiceType.SPEECH]: {
    icon: Mic,
    label: 'Speech',
    description: 'Handles voice and audio processing',
    color: 'text-yellow-400'
  }
};

const ServiceCard: React.FC<{
  serviceType: ServiceType;
  providers: Provider[];
  activeProviderId: string | null;
  onSetActive: (providerId: string) => void;
}> = ({ serviceType, providers, activeProviderId, onSetActive }) => {
  const config = serviceConfigs[serviceType];
  const Icon = config.icon;
  const isDisabled = serviceType === ServiceType.RERANKING || serviceType === ServiceType.VISION;
  const activeProvider = providers.find(p => p.id === activeProviderId);
  const availableProviders = providers.filter(p => 
    p.service_types.includes(serviceType) && p.is_active
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [dropdownPosition, setDropdownPosition] = React.useState<'bottom' | 'top'>('bottom');
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleToggleDropdown = () => {
    if (isDisabled) return; // Don't allow dropdown for disabled services
    
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = Math.min(availableProviders.length * 50, 200); // Approximate height
      
      if (spaceBelow < dropdownHeight + 20) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative rounded-xl transition-all duration-300 animate-fadeIn h-full flex flex-col ${
      isDisabled ? 'opacity-60' : 'hover:scale-[1.01]'
    }`}
         style={{ 
           animation: 'fadeInUp 0.5s ease-out',
           zIndex: isOpen ? 20 : 'auto',
           minHeight: '140px' // Ensure consistent minimum height
         }}>
      {/* Gradient border */}
      <div className="absolute inset-0 rounded-xl p-[1px] transition-opacity duration-300 hover:opacity-80" style={{
        background: isDisabled 
          ? 'linear-gradient(180deg, rgba(128, 128, 128, 0.2) 0%, rgba(64, 64, 64, 0.1) 100%)'
          : 'linear-gradient(180deg, rgba(168, 85, 247, 0.3) 0%, rgba(7, 180, 130, 0.1) 100%)'
      }}>
        <div className="w-full h-full rounded-xl" style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.9) 100%)'
        }} />
      </div>
      <div className="relative p-3 flex flex-col h-full" style={{ backdropFilter: 'blur(10px)' }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-black/30">
              <Icon className={`w-4 h-4 ${isDisabled ? 'text-gray-500' : 'text-purple-400'}`} />
            </div>
            <div>
              <h3 className={`text-sm font-light ${isDisabled ? 'text-gray-500' : 'text-white'}`}>
                {config.label}
              </h3>
              <p className="text-xs text-gray-600">{config.description}</p>
            </div>
          </div>
          {isDisabled ? (
            <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
              Coming soon...
            </span>
          ) : (
            activeProvider && (
              <span className="text-xs text-emerald-400">Active</span>
            )
          )}
        </div>

        <div className="space-y-2 flex-1 flex flex-col">
          {isDisabled ? (
            <div className="flex-1 flex flex-col justify-end">
              <div className="p-3 rounded-lg text-center border border-amber-500/20 w-full" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%)' }}>
                <p className="text-xs text-amber-400 font-medium mb-1">Feature in Development</p>
                <p className="text-xs text-gray-600">This service will be available in a future update</p>
              </div>
            </div>
          ) : (
          <>
            {activeProvider ? (
              <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-800/30" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)' }}>
                <ProviderLogo providerType={activeProvider.provider_type} size="sm" />
                <div className="flex-1">
                  <p className="text-xs font-light text-white">{activeProvider.display_name}</p>
                  <p className="text-xs text-gray-600">{activeProvider.provider_type}</p>
                </div>
              </div>
            ) : (
              <div className="p-2 rounded-lg text-center" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)' }}>
                <p className="text-xs text-gray-600">No provider selected</p>
              </div>
            )}

            {availableProviders.length > 0 && (
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={handleToggleDropdown}
                  className="w-full px-3 py-2 border border-gray-800/50 rounded-lg cursor-pointer hover:border-purple-600/30 transition-all duration-200 focus:outline-none focus:border-purple-600 text-left text-xs hover:bg-purple-600/5 flex items-center justify-between group"
                  style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)' }}
                >
                  <span className="text-gray-400 group-hover:text-purple-400 transition-colors">
                    {activeProviderId ? 'Change provider' : 'Select provider...'}
                  </span>
                  <svg className={`w-3.5 h-3.5 text-gray-500 group-hover:text-purple-400 transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
            
            {isOpen && (
              <>
                <div 
                  className="fixed inset-0" 
                  style={{ zIndex: 40 }}
                  onClick={() => setIsOpen(false)}
                />
                <div className={`absolute left-0 right-0 rounded-lg shadow-2xl border border-gray-800/50 overflow-hidden animate-slideDown ${
                  dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
                }`} style={{
                  zIndex: 41,
                  background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.98) 0%, rgba(15, 15, 25, 0.98) 100%)',
                  backdropFilter: 'blur(20px)',
                  animation: 'slideDown 0.2s ease-out'
                }}>
                  <div className="absolute inset-0 rounded-lg p-[1px] pointer-events-none" style={{
                    background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.2) 0%, rgba(7, 180, 130, 0.1) 100%)'
                  }} />
                  <div className="relative max-h-48 overflow-y-auto">
                    {availableProviders.map(provider => (
                      <button
                        key={provider.id}
                        onClick={() => {
                          onSetActive(provider.id);
                          setIsOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-purple-600/10 text-gray-400 hover:text-purple-400 flex items-center gap-2 transition-all duration-200 group ${
                          provider.id === activeProviderId ? 'bg-purple-600/10 text-purple-400' : ''
                        }`}
                      >
                        <ProviderLogo providerType={provider.provider_type} size="xs" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-300 group-hover:text-white">{provider.display_name}</div>
                          <div className="text-[10px] text-gray-600 capitalize">{provider.provider_type}</div>
                        </div>
                        {provider.id === activeProviderId && (
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

            {availableProviders.length === 0 && !activeProvider && (
              <p className="text-xs text-zinc-600 text-center">
                No providers available for this service
              </p>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export const ActiveProviderSection: React.FC<ActiveProviderSectionProps> = React.memo(({
  providers,
  activeProviders,
  onSetActive,
  loading = false
}) => {
  const services: ServiceType[] = [ServiceType.LLM, ServiceType.EMBEDDING, ServiceType.RERANKING, ServiceType.VISION, ServiceType.SPEECH];
  
  const getActiveProviderId = (serviceType: ServiceType): string | null => {
    switch (serviceType) {
      case ServiceType.LLM:
        return activeProviders.llm_provider_id;
      case ServiceType.EMBEDDING:
        return activeProviders.embedding_provider_id;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 animate-pulse">
            <div className="h-20 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fadeIn" style={{ animation: 'fadeIn 0.7s ease-out' }}>
      <div>
        <h2 className="text-sm font-normal text-gray-400">Active Service Providers</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
        {services.map(serviceType => {
          const hasProviders = providers.some(p => 
            p.service_types.includes(serviceType) && p.is_active
          );
          const isDisabled = serviceType === ServiceType.RERANKING || serviceType === ServiceType.VISION;
          
          // Always show disabled services, and show enabled services if they have providers or are active
          if (!isDisabled && !hasProviders && !getActiveProviderId(serviceType)) {
            return null;
          }

          return (
            <ServiceCard
              key={serviceType}
              serviceType={serviceType}
              providers={providers}
              activeProviderId={getActiveProviderId(serviceType)}
              onSetActive={(providerId) => onSetActive(serviceType, providerId)}
            />
          );
        })}
      </div>
    </div>
  );
});
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProviderLogo } from './ProviderLogo';
import type { Provider, ServiceType } from '../../types/provider';
import { 
  MoreVertical,
  Activity,
  Key,
  Database,
  BarChart3,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Zap
} from 'lucide-react';

interface EnhancedProviderCardProps {
  provider: Provider;
  isActiveForServices: string[];
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onManageCredentials: (provider: Provider) => void;
  onManageModels: (provider: Provider) => void;
  onCheckHealth: (provider: Provider) => void;
  onViewUsage: (provider: Provider) => void;
  onToggleActive: (provider: Provider) => void;
}

const serviceTypeConfig: Record<ServiceType, { color: string; label: string }> = {
  llm: { color: 'blue', label: 'LLM' },
  embedding: { color: 'green', label: 'Embed' },
  reranking: { color: 'purple', label: 'Rank' },
  speech: { color: 'orange', label: 'Speech' },
  vision: { color: 'pink', label: 'Vision' }
};

export const EnhancedProviderCard: React.FC<EnhancedProviderCardProps> = React.memo(({
  provider,
  isActiveForServices,
  onEdit,
  onDelete,
  onManageCredentials,
  onManageModels,
  onCheckHealth,
  onViewUsage,
  onToggleActive
}) => {
  const hasActiveServices = isActiveForServices.length > 0;
  const [showMenu, setShowMenu] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'unhealthy' | 'checking' | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);

  const handleMenuToggle = () => {
    if (!showMenu && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 350; // Approximate height of dropdown
      
      if (spaceBelow < dropdownHeight) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
    setShowMenu(!showMenu);
  };

  const handleHealthCheck = async () => {
    setHealthStatus('checking');
    try {
      await onCheckHealth(provider);
      setHealthStatus('healthy');
      setTimeout(() => setHealthStatus(null), 3000);
    } catch {
      setHealthStatus('unhealthy');
      setTimeout(() => setHealthStatus(null), 3000);
    }
  };

  const getStatusIcon = () => {
    if (healthStatus === 'checking') return <Clock className="w-3.5 h-3.5 text-yellow-400 animate-spin" />;
    if (healthStatus === 'healthy') return <CheckCircle className="w-3.5 h-3.5 text-emerald-400 animate-bounceIn" />;
    if (healthStatus === 'unhealthy') return <XCircle className="w-3.5 h-3.5 text-red-400 animate-shake" />;
    if (provider.is_active) return <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />;
    return <div className="w-2 h-2 bg-gray-600 rounded-full" />;
  };

  return (
    <div className={`relative rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl animate-fadeIn ${
      hasActiveServices ? 'ring-1 ring-purple-500/30 shadow-lg shadow-purple-500/10' : ''
    }`}
         style={{ 
           background: hasActiveServices 
             ? 'linear-gradient(135deg, rgba(30, 25, 40, 0.9) 0%, rgba(20, 20, 30, 0.95) 100%)'
             : 'linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.9) 100%)',
           backdropFilter: 'blur(10px)',
           animation: 'fadeInUp 0.5s ease-out',
           zIndex: showMenu ? 50 : 'auto'
         }}>
      {/* Gradient border */}
      <div className="absolute inset-0 rounded-xl p-[1px] transition-all duration-300 pointer-events-none" style={{
        background: hasActiveServices
          ? 'linear-gradient(180deg, rgba(168, 85, 247, 0.5) 0%, rgba(7, 180, 130, 0.3) 100%)'
          : 'linear-gradient(180deg, rgba(168, 85, 247, 0.3) 0%, rgba(7, 180, 130, 0.1) 100%)'
      }}>
        <div className="w-full h-full rounded-xl relative overflow-hidden" style={{
          background: hasActiveServices
            ? 'linear-gradient(135deg, rgba(30, 25, 40, 0.9) 0%, rgba(20, 20, 30, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.9) 100%)'
        }}>
          {/* Status Indicator Bar - Only show for active services */}
          {hasActiveServices && (
            <div className="absolute top-0 left-0 right-0 h-[3px] animate-shimmer transition-all duration-500 z-10" 
                 style={{ 
                   background: 'linear-gradient(90deg, transparent 0%, rgba(168, 85, 247, 1) 25%, rgba(7, 180, 130, 1) 75%, transparent 100%)',
                   backgroundSize: '200% 100%',
                   boxShadow: '0 2px 15px rgba(168, 85, 247, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.2)'
                 }} />
          )}
        </div>
      </div>
      
      {/* Content wrapper */}
      <div className="relative rounded-xl" style={{
        background: hasActiveServices
          ? 'linear-gradient(135deg, rgba(30, 25, 40, 0.9) 0%, rgba(20, 20, 30, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.9) 100%)'
      }}>
        <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <ProviderLogo providerType={provider.provider_type} size="md" />
            <div>
              <h3 className="text-sm font-light text-white flex items-center gap-2">
                {provider.display_name}
                {provider.is_primary && (
                  <span className="px-1.5 py-0.5 text-xs rounded bg-purple-600/20 text-purple-400 border border-purple-600/30">
                    Primary
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-600 font-mono">
                {provider.name}
              </p>
            </div>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              type="button"
              aria-label="More options"
              ref={menuButtonRef}
              onClick={handleMenuToggle}
              className="p-2 rounded-lg bg-black/20 hover:bg-purple-600/10 border border-gray-800/30 hover:border-purple-600/30 transition-all duration-200 group"
            >
              <MoreVertical className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0" 
                  style={{ zIndex: 100 }}
                  onClick={() => setShowMenu(false)}
                />
                <div className={`absolute right-0 w-56 rounded-xl shadow-2xl border border-gray-800/50 animate-slideDown overflow-hidden ${
                  dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
                }`} style={{
                  zIndex: 101, 
                  background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.98) 0%, rgba(15, 15, 25, 0.98) 100%)',
                  backdropFilter: 'blur(20px)',
                  animation: 'slideDown 0.2s ease-out'
                }}>
                  {/* Gradient border effect */}
                  <div className="absolute inset-0 rounded-xl p-[1px] pointer-events-none" style={{
                    background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.2) 0%, rgba(7, 180, 130, 0.1) 100%)'
                  }} />
                  <button
                    onClick={() => { onEdit(provider); setShowMenu(false); }}
                    className="relative w-full px-4 py-2.5 text-left text-xs hover:bg-purple-600/10 text-gray-400 hover:text-purple-400 flex items-center gap-3 transition-all duration-200 group"
                  >
                    <div className="p-1.5 rounded-lg bg-black/30 group-hover:bg-purple-600/20 transition-colors">
                      <Settings className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-300 group-hover:text-white">Edit Provider</div>
                      <div className="text-[10px] text-gray-600">Modify settings</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { onManageCredentials(provider); setShowMenu(false); }}
                    className="relative w-full px-4 py-2.5 text-left text-xs hover:bg-purple-600/10 text-gray-400 hover:text-purple-400 flex items-center gap-3 transition-all duration-200 group"
                  >
                    <div className="p-1.5 rounded-lg bg-black/30 group-hover:bg-purple-600/20 transition-colors">
                      <Key className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-300 group-hover:text-white">Credentials</div>
                      <div className="text-[10px] text-gray-600">API keys & tokens</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { onManageModels(provider); setShowMenu(false); }}
                    className="relative w-full px-4 py-2.5 text-left text-xs hover:bg-purple-600/10 text-gray-400 hover:text-purple-400 flex items-center gap-3 transition-all duration-200 group"
                  >
                    <div className="p-1.5 rounded-lg bg-black/30 group-hover:bg-purple-600/20 transition-colors">
                      <Database className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-300 group-hover:text-white">Models</div>
                      <div className="text-[10px] text-gray-600">Available models</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { onViewUsage(provider); setShowMenu(false); }}
                    className="relative w-full px-4 py-2.5 text-left text-xs hover:bg-purple-600/10 text-gray-400 hover:text-purple-400 flex items-center gap-3 transition-all duration-200 group"
                  >
                    <div className="p-1.5 rounded-lg bg-black/30 group-hover:bg-purple-600/20 transition-colors">
                      <BarChart3 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-300 group-hover:text-white">Usage Stats</div>
                      <div className="text-[10px] text-gray-600">View analytics</div>
                    </div>
                  </button>
                  <div className="my-2 mx-3 border-t border-gray-800/50" />
                  <button
                    onClick={() => { onDelete(provider); setShowMenu(false); }}
                    className="relative w-full px-4 py-2.5 text-left text-xs hover:bg-red-900/20 text-red-500 hover:text-red-400 flex items-center gap-3 transition-all duration-200 group"
                  >
                    <div className="p-1.5 rounded-lg bg-red-900/20 group-hover:bg-red-900/30 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-medium text-red-400 group-hover:text-red-300">Delete</div>
                      <div className="text-[10px] text-red-900">Remove provider</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Service Badges */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {provider.service_types.map(service => {
              const config = serviceTypeConfig[service];
              const isActive = isActiveForServices.includes(service);
              return (
                <div
                  key={service}
                  className={`px-2 py-0.5 rounded-md text-xs transition-all duration-200 ${
                    isActive 
                      ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 shadow-sm shadow-emerald-500/20 font-medium' 
                      : 'bg-black/30 text-gray-600 border border-gray-800/50 hover:bg-black/40'
                  }`}
                >
                  {config.label}
                  {isActive && <span className="ml-1">✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
          <div className="text-center p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)' }}>
            <p className="text-xs text-gray-600">Status</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {getStatusIcon()}
              <span className="text-xs font-light text-white">
                {provider.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="text-center p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)' }}>
            <p className="text-xs text-gray-600">Type</p>
            <p className="text-xs font-light text-white mt-1 capitalize">{provider.provider_type}</p>
          </div>
          <div className="text-center p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)' }}>
            <p className="text-xs text-gray-600">Services</p>
            <p className="text-xs font-light text-white mt-1">{isActiveForServices.length} active</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onToggleActive(provider)}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 transform hover:scale-105 ${
              provider.is_active 
                ? 'bg-black/30 hover:bg-purple-600/10 border border-gray-800/50 hover:border-purple-600/30 text-gray-400 hover:text-purple-400'
                : 'bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/30 text-emerald-400'
            }`}
          >
            {provider.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            aria-label="Check health"
            onClick={handleHealthCheck}
            className="px-3 py-1.5 rounded-lg bg-black/30 hover:bg-purple-600/10 border border-gray-800/50 hover:border-purple-600/30 transition-all duration-200 transform hover:scale-105"
          >
            <Activity className="w-3.5 h-3.5 text-gray-400 hover:text-purple-400" />
          </button>
        </div>

        {/* Base URL */}
        {provider.base_url && (
          <div className="mt-3 pt-3 border-t border-gray-800/30">
            <p className="text-xs text-gray-600 truncate font-mono">
              {provider.base_url}
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
});
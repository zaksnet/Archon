import React from 'react';
import { ProviderType } from '../../types/provider';
import { 
  Bot, 
  Brain, 
  Layers, 
  Smile, 
  Package, 
  Settings 
} from 'lucide-react';

interface ProviderLogoProps {
  providerType: ProviderType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const providerIcons: Record<ProviderType, { 
  icon: React.FC<{ className?: string }>; 
  color: string;
}> = {
  openai: {
    icon: Bot,
    color: 'text-emerald-400'
  },
  anthropic: {
    icon: Brain,
    color: 'text-orange-400'
  },
  cohere: {
    icon: Layers,
    color: 'text-purple-400'
  },
  huggingface: {
    icon: Smile,
    color: 'text-yellow-400'
  },
  ollama: {
    icon: Package,
    color: 'text-slate-400'
  },
  custom: {
    icon: Settings,
    color: 'text-blue-400'
  }
};

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
};

export const ProviderLogo: React.FC<ProviderLogoProps> = ({ 
  providerType, 
  size = 'md',
  className = '' 
}) => {
  const provider = providerIcons[providerType] || providerIcons.custom;
  const Icon = provider.icon;
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];
  
  return (
    <div 
      className={`${sizeClass} rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center ${className}`}
    >
      <Icon className={`${iconSize} ${provider.color}`} />
    </div>
  );
};
import React from 'react';
import { 
  TrendingUp, 
  Activity, 
  DollarSign, 
  Zap
} from 'lucide-react';
import type { UsageSummary } from '../../types/provider';

interface ProviderStatsProps {
  usageSummary: UsageSummary | null;
  activeProvidersCount: number;
  totalProviders: number;
  loading?: boolean;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.FC<{ className?: string }>;
  percentage?: number;
  color?: string;
}

const CircularProgress: React.FC<{ percentage: number; size?: number }> = ({ 
  percentage,
  size = 50 
}) => {
  const radius = (size - 4) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative animate-scaleIn" style={{ animation: 'scaleIn 0.5s ease-out' }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gray-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-purple-500 transition-all duration-1000"
          strokeLinecap="round"
          style={{ animation: 'rotateIn 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-white">{percentage}%</span>
      </div>
    </div>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({ 
  label, 
  value, 
  subValue,
  icon: Icon,
  percentage,
  color = 'text-purple-400'
}) => {
  return (
    <div className="relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.01] animate-fadeIn" 
         style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Gradient border */}
      <div className="absolute inset-0 rounded-xl p-[1px] transition-opacity duration-300 hover:opacity-80" style={{
        background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.3) 0%, rgba(7, 180, 130, 0.1) 100%)'
      }}>
        <div className="w-full h-full rounded-xl" style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.9) 100%)'
        }} />
      </div>
      <div className="relative p-3" style={{ 
        backdropFilter: 'blur(10px)'
      }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-lg font-light text-white">{value}</p>
          {subValue && (
            <p className="text-xs text-gray-600 mt-0.5">{subValue}</p>
          )}
        </div>
        {percentage !== undefined ? (
          <CircularProgress percentage={percentage} size={45} />
        ) : (
          <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)' }}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export const ProviderStatsNew: React.FC<ProviderStatsProps> = ({
  usageSummary,
  activeProvidersCount,
  totalProviders,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="relative rounded-xl animate-pulse overflow-hidden">
            <div className="absolute inset-0 rounded-xl p-[1px]" style={{
              background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.3) 0%, rgba(7, 180, 130, 0.1) 100%)'
            }}>
              <div className="w-full h-full rounded-xl" style={{
                background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.9) 100%)'
              }} />
            </div>
            <div className="relative p-3" style={{ backdropFilter: 'blur(10px)' }}>
              <div className="h-16 bg-gray-800/30 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const activePercentage = totalProviders > 0 
    ? Math.round((activeProvidersCount / totalProviders) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      <MetricCard
        label="Total Cost"
        value={usageSummary ? `$${Number(usageSummary.total_cost).toFixed(2)}` : '$0.00'}
        subValue={usageSummary ? "This period" : "No usage"}
        icon={DollarSign}
        color="text-purple-400"
      />
      
      <MetricCard
        label="API Requests"
        value={usageSummary ? formatNumber(usageSummary.total_requests) : '0'}
        subValue={usageSummary ? `${Math.floor(usageSummary.total_requests / 30)}/day` : "No requests"}
        icon={Activity}
        color="text-emerald-400"
      />
      
      <MetricCard
        label="Active Providers"
        value={activeProvidersCount}
        subValue={`of ${totalProviders} total`}
        icon={Zap}
        percentage={activePercentage}
        color="text-purple-400"
      />
      
      <MetricCard
        label="Avg Response"
        value={usageSummary?.avg_response_time ? `${usageSummary.avg_response_time}ms` : '--'}
        subValue={usageSummary ? "All providers" : "No data"}
        icon={TrendingUp}
        color="text-emerald-400"
      />
    </div>
  );
};
import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { ProviderLogo } from './ProviderLogo';
import type { Provider, Credential, CredentialCreate } from '../../types/provider';
import { 
  Key, 
  RotateCw, 
  Shield, 
  Eye, 
  EyeOff, 
  Plus,
  CheckCircle,
  Copy,
  ChevronRight
} from 'lucide-react';

interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: Provider;
  credentials: Credential[];
  onAdd: (data: CredentialCreate) => Promise<void>;
  onRotate: (credentialId: string, newValue: string) => Promise<void>;
}

export const CredentialModal: React.FC<CredentialModalProps> = ({
  isOpen,
  onClose,
  provider,
  credentials,
  onAdd,
  onRotate
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newCredential, setNewCredential] = useState<CredentialCreate>({
    credential_type: 'api_key',
    credential_name: '',
    credential_value: '',
    api_key_header: 'Authorization',
    api_key_prefix: 'Bearer ',
    is_active: true
  });
  const [rotateValue, setRotateValue] = useState('');

  const handleAdd = async () => {
    await onAdd(newCredential);
    setNewCredential({
      credential_type: 'api_key',
      credential_name: '',
      credential_value: '',
      api_key_header: 'Authorization',
      api_key_prefix: 'Bearer ',
      is_active: true
    });
    setShowAddForm(false);
  };

  const handleRotate = async (credentialId: string) => {
    if (rotateValue) {
      await onRotate(credentialId, rotateValue);
      setRotateValue('');
      setRotatingId(null);
    }
  };

  const handleCopy = (value: string, id: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const credentialTypeOptions = [
    { value: 'api_key', label: 'API Key' },
    { value: 'oauth_token', label: 'OAuth Token' },
    { value: 'basic_auth', label: 'Basic Auth' },
    { value: 'custom', label: 'Custom' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
    >
      <div className="space-y-6">
        {/* Custom Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-800/50">
          <ProviderLogo providerType={provider.provider_type} size="md" />
          <div>
            <h2 className="text-lg font-light text-white">
              Credential Management
            </h2>
            <p className="text-sm text-gray-500">
              {provider.display_name} • {provider.provider_type}
            </p>
          </div>
        </div>

        {/* Existing Credentials */}
        {credentials.length > 0 ? (
          <div className="space-y-3">
            {credentials.map((credential, index) => (
              <div
                key={credential.id}
                className="relative rounded-xl transition-all duration-300 hover:scale-[1.01] animate-fadeIn"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.8) 0%, rgba(15, 15, 25, 0.9) 100%)'
                }}
              >
                {/* Gradient border */}
                <div className="absolute inset-0 rounded-xl p-[1px] pointer-events-none" style={{
                  background: credential.is_active 
                    ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.1) 100%)'
                    : 'linear-gradient(180deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.1) 100%)'
                }}>
                  <div className="w-full h-full rounded-xl" style={{
                    background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.9) 0%, rgba(15, 15, 25, 0.95) 100%)'
                  }} />
                </div>

                <div className="relative p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-black/30">
                        <Key className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-light text-white">{credential.credential_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {credential.is_active ? (
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                              <span className="text-xs text-emerald-400">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                              <span className="text-xs text-red-400">Inactive</span>
                            </div>
                          )}
                          <span className="text-xs text-gray-600">•</span>
                          <span className="text-xs text-gray-600 capitalize">
                            {credential.credential_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {credential.api_key_header && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-600 w-20">Header:</span>
                        <code className="px-2 py-1 rounded font-mono text-xs" style={{
                          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)'
                        }}>
                          {credential.api_key_header}
                        </code>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-600 w-20">Value:</span>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex-1 px-3 py-2 rounded-lg font-mono text-xs flex items-center justify-between" style={{
                          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)'
                        }}>
                          <span className="text-gray-400">
                            {showValues[credential.id] 
                              ? '••••••••••••••••' 
                              : '••••••••••••••••'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setShowValues(prev => ({
                                ...prev,
                                [credential.id]: !prev[credential.id]
                              }))}
                              className="p-1 hover:bg-white/5 rounded transition-colors"
                            >
                              {showValues[credential.id] ? (
                                <EyeOff className="w-3.5 h-3.5 text-gray-500 hover:text-purple-400" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 text-gray-500 hover:text-purple-400" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy('••••••••', credential.id)}
                              className="p-1 hover:bg-white/5 rounded transition-colors"
                            >
                              {copiedId === credential.id ? (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-gray-500 hover:text-purple-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {credential.last_rotated && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                        <RotateCw className="w-3 h-3" />
                        Last rotated: {new Date(credential.last_rotated).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Rotation Form */}
                  {rotatingId === credential.id ? (
                    <div className="mt-4 p-3 rounded-lg border border-purple-600/30" style={{
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%)'
                    }}>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          value={rotateValue}
                          onChange={(e) => setRotateValue(e.target.value)}
                          placeholder="New credential value"
                          className="flex-1"
                          size={11}
                        />
                        <button
                          type="button"
                          onClick={() => handleRotate(credential.id)}
                          disabled={!rotateValue}
                          className="px-3 py-1.5 text-xs rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          Rotate
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRotatingId(null);
                            setRotateValue('');
                          }}
                          className="px-3 py-1.5 text-xs rounded-lg border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white transition-all duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRotatingId(credential.id)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-black/30 hover:bg-purple-600/10 border border-gray-800/50 hover:border-purple-600/30 text-gray-400 hover:text-purple-400 transition-all duration-200 flex items-center gap-1.5"
                      >
                        <RotateCw className="w-3 h-3" />
                        Rotate Key
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-xl animate-fadeIn" style={{
            background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.5) 0%, rgba(15, 15, 25, 0.6) 100%)'
          }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-black/30 flex items-center justify-center animate-scaleIn" style={{ animation: 'scaleIn 0.6s ease-out' }}>
              <Shield className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 font-light">No credentials configured</p>
            <p className="text-sm mt-1 text-gray-600">Add credentials to authenticate with this provider</p>
          </div>
        )}

        {/* Add New Credential Form */}
        {showAddForm ? (
          <div className="rounded-xl p-4 animate-slideDown" style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(15, 15, 25, 0.9) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.2)'
          }}>
            <h4 className="font-light text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400" />
              Add New Credential
            </h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
              <Input
                label="Credential Name"
                value={newCredential.credential_name}
                onChange={(e) => setNewCredential(prev => ({
                  ...prev,
                  credential_name: e.target.value
                }))}
                placeholder="e.g., Primary API Key"
              />
              
              <Select
                label="Type"
                value={newCredential.credential_type}
                onChange={(e) => setNewCredential(prev => ({
                  ...prev,
                  credential_type: e.target.value
                }))}
                options={credentialTypeOptions}
              />
              </div>

              <Input
              label="Credential Value"
              type="password"
              value={newCredential.credential_value}
              onChange={(e) => setNewCredential(prev => ({
                ...prev,
                credential_value: e.target.value
              }))}
              placeholder="Your API key or token"
              />

              {newCredential.credential_type === 'api_key' && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Header Name"
                  value={newCredential.api_key_header || ''}
                  onChange={(e) => setNewCredential(prev => ({
                    ...prev,
                    api_key_header: e.target.value
                  }))}
                  placeholder="e.g., Authorization"
                />
                
                <Input
                  label="Key Prefix"
                  value={newCredential.api_key_prefix || ''}
                  onChange={(e) => setNewCredential(prev => ({
                    ...prev,
                    api_key_prefix: e.target.value
                  }))}
                  placeholder="e.g., Bearer "
                />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!newCredential.credential_name || !newCredential.credential_value}
                  className="px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-600/20"
                >
                  Add Credential
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCredential({
                      credential_type: 'api_key',
                      credential_name: '',
                      credential_value: '',
                      api_key_header: 'Authorization',
                      api_key_prefix: 'Bearer ',
                      is_active: true
                    });
                  }}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full px-4 py-3 rounded-xl border border-gray-800/50 hover:border-purple-600/30 text-gray-400 hover:text-purple-400 transition-all duration-200 flex items-center justify-center gap-2 group hover:shadow-lg hover:shadow-purple-600/10"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)'
            }}
          >
            <div className="p-1.5 rounded-lg bg-black/30 group-hover:bg-purple-600/20 transition-colors">
              <Key className="w-4 h-4" />
            </div>
            <span>Add New Credential</span>
            <ChevronRight className="w-4 h-4 ml-auto opacity-50 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1" />
          </button>
        )}
      </div>
    </Modal>
  );
};
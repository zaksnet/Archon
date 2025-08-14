import React from 'react';
import { Key, ExternalLink } from 'lucide-react';

export interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  requiresApiKey: boolean;
  apiKeyField?: string;
  apiKeyPlaceholder?: string;
  apiKeyUrl?: string;
  apiKeyLabel?: string;
  icon?: React.ReactNode;
  accentColor?: 'purple' | 'green' | 'pink' | 'blue';
  settingsMessage?: string;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI provides powerful models like GPT-4. You\'ll need an API key from OpenAI.',
    requiresApiKey: true,
    apiKeyField: 'OPENAI_API_KEY',
    apiKeyPlaceholder: 'sk-...',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    apiKeyLabel: 'OpenAI API Key',
    accentColor: 'purple',
    icon: React.createElement(Key, { className: "w-4 h-4" })
  },
  {
    id: 'google',
    name: 'Google Gemini',
    description: 'Google Gemini offers advanced AI capabilities. Configure in Settings after setup.',
    requiresApiKey: true,
    apiKeyField: 'GOOGLE_API_KEY',
    apiKeyPlaceholder: 'AIza...',
    apiKeyUrl: 'https://makersuite.google.com/app/apikey',
    apiKeyLabel: 'Google API Key',
    accentColor: 'blue',
    icon: React.createElement(Key, { className: "w-4 h-4" }),
    settingsMessage: 'Google Gemini configuration will be available in Settings after setup.'
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Ollama runs models locally on your machine. Configure in Settings after setup.',
    requiresApiKey: false,
    accentColor: 'green',
    settingsMessage: 'Ollama configuration will be available in Settings after setup. Make sure Ollama is running locally.'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Anthropic Claude provides advanced AI capabilities with strong safety features.',
    requiresApiKey: true,
    apiKeyField: 'ANTHROPIC_API_KEY',
    apiKeyPlaceholder: 'sk-ant-...',
    apiKeyUrl: 'https://console.anthropic.com/',
    apiKeyLabel: 'Anthropic API Key',
    accentColor: 'purple',
    icon: React.createElement(Key, { className: "w-4 h-4" })
  }
];

export const getProviderConfig = (providerId: string): ProviderConfig | undefined => {
  return PROVIDERS.find(provider => provider.id === providerId);
};

export const getProviderOptions = () => {
  return PROVIDERS.map(provider => ({
    value: provider.id,
    label: provider.name
  }));
};

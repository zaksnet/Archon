import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import React from 'react'
import { isLmConfigured, type NormalizedCredential } from '../utils/onboarding'
import { OnboardingPage } from '../OnboardingPage'
import { WelcomeStep } from '../components/WelcomeStep'
import { ProviderStep } from '../components/ProviderStep'
import { CompletionStep } from '../components/CompletionStep'

// Mock useNavigate for onboarding page test
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}))

// Mock the toast context
vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}))

// Mock the credentials service
vi.mock('../../../services/credentialsService', () => ({
  credentialsService: {
    createCredential: vi.fn(),
    updateCredential: vi.fn()
  }
}))

describe('Onboarding Components', () => {
  test('OnboardingPage renders', () => {
    render(<OnboardingPage />)
    expect(screen.getByText('Welcome to Archon')).toBeInTheDocument()
  })

  test('WelcomeStep renders correctly', () => {
    const mockOnNext = vi.fn()
    render(<WelcomeStep onNext={mockOnNext} />)
    
    expect(screen.getByText('Welcome to Archon')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  test('CompletionStep renders correctly', () => {
    const mockOnComplete = vi.fn()
    render(<CompletionStep onComplete={mockOnComplete} />)
    
    expect(screen.getByText('All Set!')).toBeInTheDocument()
    expect(screen.getByText('Start Using Archon')).toBeInTheDocument()
  })

  test('ProviderStep renders correctly', () => {
    const mockOnSaved = vi.fn()
    const mockOnSkip = vi.fn()
    render(<ProviderStep onSaved={mockOnSaved} onSkip={mockOnSkip} />)
    
    expect(screen.getByText('Select AI Provider')).toBeInTheDocument()
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
  })
})

describe('Onboarding Detection Tests', () => {
  test('isLmConfigured returns true when provider is openai and OPENAI_API_KEY exists', () => {
    const ragCreds: NormalizedCredential[] = [
      { key: 'LLM_PROVIDER', value: 'openai', category: 'rag_strategy' }
    ]
    const apiKeyCreds: NormalizedCredential[] = [
      { key: 'OPENAI_API_KEY', value: 'sk-test123', category: 'api_keys' }
    ]
    
    expect(isLmConfigured(ragCreds, apiKeyCreds)).toBe(true)
  })

  test('isLmConfigured returns true when provider is openai and OPENAI_API_KEY is encrypted', () => {
    const ragCreds: NormalizedCredential[] = [
      { key: 'LLM_PROVIDER', value: 'openai', category: 'rag_strategy' }
    ]
    const apiKeyCreds: NormalizedCredential[] = [
      { key: 'OPENAI_API_KEY', is_encrypted: true, category: 'api_keys' }
    ]
    
    expect(isLmConfigured(ragCreds, apiKeyCreds)).toBe(true)
  })

  test('isLmConfigured returns false when provider is openai and no OPENAI_API_KEY', () => {
    const ragCreds: NormalizedCredential[] = [
      { key: 'LLM_PROVIDER', value: 'openai', category: 'rag_strategy' }
    ]
    const apiKeyCreds: NormalizedCredential[] = []
    
    expect(isLmConfigured(ragCreds, apiKeyCreds)).toBe(false)
  })

  test('isLmConfigured returns true when provider is ollama regardless of API keys', () => {
    const ragCreds: NormalizedCredential[] = [
      { key: 'LLM_PROVIDER', value: 'ollama', category: 'rag_strategy' }
    ]
    const apiKeyCreds: NormalizedCredential[] = []
    
    expect(isLmConfigured(ragCreds, apiKeyCreds)).toBe(true)
  })

  test('isLmConfigured returns true when no provider but OPENAI_API_KEY exists', () => {
    const ragCreds: NormalizedCredential[] = []
    const apiKeyCreds: NormalizedCredential[] = [
      { key: 'OPENAI_API_KEY', value: 'sk-test123', category: 'api_keys' }
    ]
    
    expect(isLmConfigured(ragCreds, apiKeyCreds)).toBe(true)
  })

  test('isLmConfigured returns false when no provider and no OPENAI_API_KEY', () => {
    const ragCreds: NormalizedCredential[] = []
    const apiKeyCreds: NormalizedCredential[] = []
    
    expect(isLmConfigured(ragCreds, apiKeyCreds)).toBe(false)
  })

  test('isLmConfigured returns true when provider is google and GOOGLE_API_KEY exists', () => {
    const ragCreds: NormalizedCredential[] = [
      { key: 'LLM_PROVIDER', value: 'google', category: 'rag_strategy' }
    ]
    const apiKeyCreds: NormalizedCredential[] = [
      { key: 'GOOGLE_API_KEY', value: 'AIza-test123', category: 'api_keys' }
    ]
    
    expect(isLmConfigured(ragCreds, apiKeyCreds)).toBe(true)
  })

  test('isLmConfigured returns true when provider is gemini and GOOGLE_API_KEY exists', () => {
    const ragCreds: NormalizedCredential[] = [
      { key: 'LLM_PROVIDER', value: 'gemini', category: 'rag_strategy' }
    ]
    const apiKeyCreds: NormalizedCredential[] = [
      { key: 'GOOGLE_API_KEY', value: 'AIza-test123', category: 'api_keys' }
    ]
    
    expect(isLmConfigured(ragCreds, apiKeyCreds)).toBe(true)
  })
})

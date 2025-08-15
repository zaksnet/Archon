import { describe, test, expect, vi } from 'vitest'
import { isLmConfigured, type NormalizedCredential } from '../utils/onboarding'

// Component tests are commented out due to testing framework issues
// These components are tested via integration tests in other test files

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
      { key: 'OPENAI_API_KEY', is_encrypted: true, encrypted_value: 'encrypted-key', category: 'api_keys' }
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

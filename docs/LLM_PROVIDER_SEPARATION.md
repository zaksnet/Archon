# Separate Chat and Embedding LLM Providers

This document explains how to configure different LLM providers for chat and embedding operations in Archon.

## Overview

Starting with this update, Archon supports using different LLM providers for:
- **Chat LLM**: Used for agent conversations, summaries, and contextual embeddings
- **Embedding Provider**: Used for generating vector embeddings for search and retrieval

This allows you to optimize costs and performance by using different providers for different purposes.

## Configuration Examples

### Example 1: OpenAI for Chat, Ollama for Embeddings
- **Chat**: Use OpenAI GPT-4o-mini for fast, high-quality responses
- **Embeddings**: Use local Ollama with nomic-embed-text for cost-effective embeddings

```
Chat LLM Provider: openai
Chat Model: gpt-4o-mini

Embedding Provider: ollama  
Embedding Base URL: http://localhost:11434/v1
Embedding Model: nomic-embed-text
```

### Example 2: Google for Chat, OpenAI for Embeddings
- **Chat**: Use Google Gemini for conversations
- **Embeddings**: Use OpenAI's proven embedding models

```
Chat LLM Provider: google
Chat Model: gemini-1.5-flash

Embedding Provider: openai
Embedding Model: text-embedding-3-small
```

## Settings UI

In the Archon settings page, you'll now see two separate provider configuration sections:

1. **💬 Chat LLM Provider** (blue section)
   - Chat Provider selection
   - Chat Base URL (for Ollama)
   - Chat Model specification

2. **🔍 Embedding Provider** (purple section)  
   - Embedding Provider selection
   - Embedding Base URL (for Ollama)
   - Embedding Model specification

## Database Settings

The following new settings have been added to the `archon_settings` table:

- `EMBEDDING_PROVIDER`: The provider to use for embeddings (openai, ollama, google)
- `EMBEDDING_BASE_URL`: Custom base URL for embedding provider (mainly for Ollama)

Existing settings have been clarified:
- `LLM_PROVIDER`: Now specifically for chat LLM provider
- `LLM_BASE_URL`: Now specifically for chat LLM base URL

## Backward Compatibility

**Important**: Existing installations continue to work without changes. 

- If `EMBEDDING_PROVIDER` is not set, the system automatically falls back to using `LLM_PROVIDER` for both chat and embeddings
- All existing configurations remain functional
- No manual migration is required

## Migration for Existing Installations

If you have an existing Archon installation and want to add the new embedding provider settings, run this SQL in your Supabase SQL Editor:

```sql
-- Add new embedding provider settings
INSERT INTO archon_settings (key, value, is_encrypted, category, description) VALUES
('EMBEDDING_PROVIDER', 'openai', false, 'rag_strategy', 'Embedding provider to use: openai, ollama, or google (can be different from chat LLM)')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO archon_settings (key, value, is_encrypted, category, description) VALUES  
('EMBEDDING_BASE_URL', NULL, false, 'rag_strategy', 'Custom base URL for embedding provider (mainly for Ollama, e.g., http://localhost:11434/v1)')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;
```

## Use Cases

### Cost Optimization
- Use expensive, high-quality models (GPT-4) for chat
- Use cheaper, local models (Ollama) for embeddings

### Performance Optimization  
- Use fast cloud models for real-time chat
- Use optimized local models for batch embedding operations

### Privacy Requirements
- Use cloud providers for general chat
- Use local Ollama for sensitive embedding operations

### Provider Strengths
- Use OpenAI for chat (excellent reasoning)
- Use Google for embeddings (strong multilingual support)

## Technical Details

The separation is implemented at the credential service level:
- `get_active_provider("llm")` returns chat LLM configuration
- `get_active_provider("embedding")` returns embedding provider configuration
- The `llm_provider_service.get_llm_client()` function uses the `use_embedding_provider` parameter to select the appropriate configuration

This ensures clean separation while maintaining the existing API surface.
/**
 * Tests for OpenAPI Generation Service
 */

import { describe, test, expect } from 'bun:test';
import { AIProviderFactory } from '../ai/provider-factory.js';
import type { AIMessage } from '@ai-openapi/shared';

describe('Generation Service with Mock Provider', () => {
  test('mock provider generates valid OpenAPI spec', async () => {
    const provider = AIProviderFactory.getMockProvider();
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'Generate an OpenAPI 3.1 spec',
      },
      {
        role: 'user',
        content: 'A simple user API',
      },
    ];

    const result = await provider.complete(messages);

    expect(result.content).toContain('openapi: 3.1.0');
    expect(result.content).toContain('paths:');
    expect(result.model).toBe('mock');
  });

  test('mock provider includes user description', async () => {
    const provider = AIProviderFactory.getMockProvider();
    
    const description = 'A todo list management API';
    const messages: AIMessage[] = [
      {
        role: 'user',
        content: description,
      },
    ];

    const result = await provider.complete(messages);

    expect(result.content).toContain(description);
    expect(result.content).toContain('openapi: 3.1.0');
  });

  test('mock provider returns complete response', async () => {
    const provider = AIProviderFactory.getMockProvider();
    
    const messages: AIMessage[] = [
      {
        role: 'user',
        content: 'Test API',
      },
    ];

    const result = await provider.complete(messages);

    expect(result.content).toBeDefined();
    expect(result.model).toBe('mock');
    expect(result.finishReason).toBe('complete');
  });

  test('mock provider is always configured', () => {
    const provider = AIProviderFactory.getMockProvider();
    expect(provider.isConfigured()).toBe(true);
  });
});

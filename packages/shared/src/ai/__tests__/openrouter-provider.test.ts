/**
 * OpenRouter Provider Integration Test
 * 
 * This test verifies that the OpenRouter provider is correctly integrated.
 * To run this test with a real API key, set OPENROUTER_API_KEY environment variable.
 */

import { describe, it, expect } from 'vitest';
import { AIProviderFactory } from '../providers/provider-factory.js';
import { OpenRouterProvider } from '../providers/openrouter-provider.js';

describe('OpenRouter Provider', () => {
  describe('Configuration', () => {
    it('should throw error when API key is missing', () => {
      expect(() => {
        AIProviderFactory.getProvider({
          provider: 'openrouter',
          // No API key provided
        });
      }).toThrow(/OpenRouter API key is required/);
    });

    it('should create provider with valid configuration', () => {
      const provider = new OpenRouterProvider({
        apiKey: 'test-key',
        defaultModel: 'openai/gpt-3.5-turbo',
      });

      expect(provider).toBeDefined();
      expect(provider.name).toBe('openrouter');
      expect(provider.isConfigured()).toBe(true);
    });

    it('should return not configured when no API key', () => {
      const provider = new OpenRouterProvider({
        apiKey: '',
      });

      expect(provider.isConfigured()).toBe(false);
    });
  });

  describe('Provider Factory', () => {
    it('should return GitHub Copilot provider by default', () => {
      const provider = AIProviderFactory.getProvider();
      expect(provider.name).toBe('github-copilot');
    });

    it('should return OpenRouter provider when configured', () => {
      const provider = AIProviderFactory.getProvider({
        provider: 'openrouter',
        openRouterApiKey: 'test-key',
      });

      expect(provider.name).toBe('openrouter');
      expect(provider.isConfigured()).toBe(true);
    });

    it('should maintain singleton per provider type', () => {
      const provider1 = AIProviderFactory.getProvider({
        provider: 'openrouter',
        openRouterApiKey: 'test-key',
      });

      const provider2 = AIProviderFactory.getProvider({
        provider: 'openrouter',
        openRouterApiKey: 'test-key',
      });

      expect(provider1).toBe(provider2);
    });

    it('should reset provider when type changes', async () => {
      // Get OpenRouter provider
      const openRouterProvider = AIProviderFactory.getProvider({
        provider: 'openrouter',
        openRouterApiKey: 'test-key',
      });
      expect(openRouterProvider.name).toBe('openrouter');

      // Switch to GitHub Copilot
      await AIProviderFactory.cleanup();
      const copilotProvider = AIProviderFactory.getProvider({
        provider: 'github-copilot',
      });
      expect(copilotProvider.name).toBe('github-copilot');
    });
  });

  describe('API Integration (requires OPENROUTER_API_KEY)', () => {
    const apiKey = process.env.OPENROUTER_API_KEY;

    it.skipIf(!apiKey)('should complete a simple prompt', async () => {
      const provider = new OpenRouterProvider({
        apiKey: apiKey!,
        defaultModel: 'openai/gpt-3.5-turbo',
      });

      const result = await provider.complete([
        {
          role: 'user',
          content: 'Say "hello" and nothing else.',
        },
      ], {
        maxTokens: 10,
        temperature: 0,
      });

      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
      expect(result.model).toBeTruthy();
      expect(result.content.toLowerCase()).toContain('hello');
    });

    it.skipIf(!apiKey)('should list available models', async () => {
      const provider = new OpenRouterProvider({
        apiKey: apiKey!,
      });

      const models = await provider.listModels();
      
      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      
      // Check for some expected models
      expect(models.some(m => m.includes('gpt'))).toBe(true);
    });

    it.skipIf(!apiKey)('should handle system messages', async () => {
      const provider = new OpenRouterProvider({
        apiKey: apiKey!,
        defaultModel: 'openai/gpt-3.5-turbo',
      });

      const result = await provider.complete([
        {
          role: 'system',
          content: 'You are a helpful assistant that only responds with "OK".',
        },
        {
          role: 'user',
          content: 'Hello',
        },
      ], {
        maxTokens: 5,
        temperature: 0,
      });

      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
    });
  });
});

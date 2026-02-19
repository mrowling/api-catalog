/**
 * AI Provider Factory
 * Creates and manages AI provider instances
 */

import type { AIProvider, AIProviderConfig } from '../types.js';
import { CopilotProvider } from './copilot-provider.js';
import { MockProvider } from './mock-provider.js';
import { OpenRouterProvider } from './openrouter-provider.js';

export type AIProviderType = 'github-copilot' | 'openrouter' | 'mock';

export interface ProviderFactoryConfig extends AIProviderConfig {
  /** Provider type to use */
  provider?: AIProviderType;
  /** OpenRouter API key (required if using openrouter provider) */
  openRouterApiKey?: string;
  /** OpenRouter site URL (optional) */
  openRouterSiteUrl?: string;
  /** OpenRouter site name (optional) */
  openRouterSiteName?: string;
}

export class AIProviderFactory {
  private static provider: AIProvider | null = null;
  private static currentProviderType: AIProviderType | null = null;

  /**
   * Get an AI provider instance (singleton per provider type)
   * @param config - Provider configuration
   * @returns AI provider instance
   */
  static getProvider(config?: ProviderFactoryConfig): AIProvider {
    const providerType = config?.provider || 'github-copilot';
    
    // If provider type changed, reset the current provider
    if (this.currentProviderType !== providerType) {
      this.provider = null;
      this.currentProviderType = providerType;
    }

    if (!this.provider) {
      switch (providerType) {
        case 'openrouter':
          if (!config?.openRouterApiKey) {
            throw new Error(
              'OpenRouter API key is required. ' +
              'Set OPENROUTER_API_KEY environment variable or pass openRouterApiKey in config. ' +
              'Get your API key at: https://openrouter.ai/keys'
            );
          }
          this.provider = new OpenRouterProvider({
            apiKey: config.openRouterApiKey,
            defaultModel: config.defaultModel,
            siteUrl: config.openRouterSiteUrl,
            siteName: config.openRouterSiteName,
          });
          break;

        case 'github-copilot':
          this.provider = new CopilotProvider({
            defaultModel: config?.defaultModel,
          });
          break;

        default:
          throw new Error(`Unknown provider type: ${providerType}`);
      }
    }
    
    return this.provider;
  }

  /**
   * Get a mock provider for testing
   * @returns Mock AI provider instance
   */
  static getMockProvider(): AIProvider {
    return new MockProvider();
  }

  /**
   * Clean up the provider
   */
  static async cleanup(): Promise<void> {
    if (this.provider && 'cleanup' in this.provider && typeof this.provider.cleanup === 'function') {
      try {
        await (this.provider.cleanup as () => Promise<void>)();
      } catch (err) {
        console.warn('Failed to cleanup provider:', err);
      }
    }
    this.provider = null;
    this.currentProviderType = null;
  }
}

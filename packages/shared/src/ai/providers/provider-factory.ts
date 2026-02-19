/**
 * AI Provider Factory
 * Creates and manages AI provider instances
 */

import type { AIProvider, AIProviderConfig } from '../types.js';
import { CopilotProvider } from './copilot-provider.js';
import { MockProvider } from './mock-provider.js';

export class AIProviderFactory {
  private static provider: AIProvider | null = null;

  /**
   * Get the GitHub Copilot provider instance (singleton)
   * @param config - Provider configuration
   * @returns AI provider instance
   */
  static getProvider(config?: AIProviderConfig): AIProvider {
    if (!this.provider) {
      this.provider = new CopilotProvider({
        defaultModel: config?.defaultModel,
      });
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
  }
}

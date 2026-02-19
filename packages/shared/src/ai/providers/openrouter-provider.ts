/**
 * OpenRouter AI Provider
 * Implementation using OpenRouter.ai API
 * Supports multiple AI models through a single API
 */

import type { AIProvider, AIMessage, AICompletionOptions, AICompletionResult } from '../types.js';

export interface OpenRouterConfig {
  /** OpenRouter API key */
  apiKey: string;
  /** Default model to use */
  defaultModel?: string;
  /** Optional site URL for rankings */
  siteUrl?: string;
  /** Optional app name for rankings */
  siteName?: string;
  /** Base URL for OpenRouter API */
  baseUrl?: string;
}

export class OpenRouterProvider implements AIProvider {
  readonly name = 'openrouter';
  private apiKey: string;
  private defaultModel: string;
  private siteUrl?: string;
  private siteName?: string;
  private baseUrl: string;

  constructor(config: OpenRouterConfig) {
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel || 'openrouter/free';
    this.siteUrl = config.siteUrl;
    this.siteName = config.siteName;
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'OpenRouter provider is not configured. ' +
        'Please set OPENROUTER_API_KEY environment variable. ' +
        'Get your API key at: https://openrouter.ai/keys'
      );
    }

    const model = options?.model || this.defaultModel;

    try {
      console.log(`Making OpenRouter API request with model: ${model}`);

      // Convert messages to OpenRouter format
      const openRouterMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Build request body
      const requestBody: any = {
        model,
        messages: openRouterMessages,
      };

      // Add optional parameters
      if (options?.maxTokens) {
        requestBody.max_tokens = options.maxTokens;
      }
      if (options?.temperature !== undefined) {
        requestBody.temperature = options.temperature;
      }
      if (options?.stopSequences && options.stopSequences.length > 0) {
        requestBody.stop = options.stopSequences;
      }

      // Build headers
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      };

      // Add optional headers for rankings
      if (this.siteUrl) {
        headers['HTTP-Referer'] = this.siteUrl;
      }
      if (this.siteName) {
        headers['X-Title'] = this.siteName;
      }

      // Make API request
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `OpenRouter API error (${response.status})`;

        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json() as any;

      // Extract the response
      const choice = data.choices?.[0];
      if (!choice) {
        throw new Error('No completion choices returned from OpenRouter');
      }

      const content = choice.message?.content || '';
      const finishReason = choice.finish_reason || 'complete';

      // Extract token usage if available
      const tokensUsed = data.usage?.total_tokens;

      console.log('OpenRouter response received successfully');

      return {
        content,
        model: data.model || model,
        tokensUsed,
        finishReason,
      };
    } catch (error) {
      console.error('OpenRouter completion error:', error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        `OpenRouter completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * List available models from OpenRouter
   * @returns Array of available model IDs
   */
  async listModels(): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter provider is not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json() as any;
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      console.error('Failed to list OpenRouter models:', error);
      return [];
    }
  }
}

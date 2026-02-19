/**
 * AI Provider Types
 * Abstract interfaces for AI provider implementations
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Temperature for response randomness (0-1) */
  temperature?: number;
  /** Model to use for completion */
  model?: string;
  /** Stop sequences */
  stopSequences?: string[];
}

export interface AICompletionResult {
  /** Generated text content */
  content: string;
  /** Model used for generation */
  model: string;
  /** Number of tokens used */
  tokensUsed?: number;
  /** Finish reason */
  finishReason?: string;
}

export interface AIProvider {
  /** Provider name (currently only 'github-copilot' is supported) */
  readonly name: string;
  
  /**
   * Generate a completion from messages
   * @param messages - Conversation messages
   * @param options - Generation options
   * @returns Completion result
   */
  complete(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResult>;
  
  /**
   * Check if the provider is properly configured
   * @returns True if provider can be used
   */
  isConfigured(): boolean;
}

export interface AIProviderConfig {
  /** Default model to use (defaults to gpt-5-mini for GitHub Copilot) */
  defaultModel?: string;
  /** Additional provider-specific options */
  options?: Record<string, unknown>;
}

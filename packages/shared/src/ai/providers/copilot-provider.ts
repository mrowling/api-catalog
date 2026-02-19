/**
 * GitHub Copilot AI Provider
 * Implementation using @github/copilot-sdk
 */

import { CopilotClient, CopilotSession } from '@github/copilot-sdk';
import type { AIProvider, AIMessage, AICompletionOptions, AICompletionResult } from '../types.js';

export class CopilotProvider implements AIProvider {
  readonly name = 'github-copilot';
  private client: CopilotClient | null = null;
  private defaultModel: string;

  constructor(config?: { defaultModel?: string }) {
    this.defaultModel = config?.defaultModel || 'gpt-5-mini';
  }

  private async ensureClient(): Promise<CopilotClient> {
    if (!this.client) {
      try {
        this.client = new CopilotClient({
          autoStart: true,
          autoRestart: true,
        });
        
        console.log('Starting GitHub Copilot client...');
        await this.client.start();
        console.log('GitHub Copilot client started successfully');
      } catch (error) {
        this.client = null;
        throw new Error(
          'Failed to initialize GitHub Copilot client. ' +
          'Please ensure GitHub Copilot CLI is installed and authenticated. ' +
          'Install: gh extension install github/gh-copilot\n' +
          'Authenticate: gh auth login\n' +
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
    return this.client;
  }

  isConfigured(): boolean {
    // Client is lazily initialized, so always return true
    // Actual configuration is checked when making requests
    return true;
  }

  async complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResult> {
    let client: CopilotClient;
    
    try {
      client = await this.ensureClient();
    } catch (error) {
      // If client initialization fails, clean up and rethrow
      this.client = null;
      throw error;
    }
    
    let session: CopilotSession | null = null;

    try {
      // Extract system message and user messages
      const systemMessages = messages.filter(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role === 'user');

      if (userMessages.length === 0) {
        throw new Error('At least one user message is required');
      }

      // Build the prompt by combining all user messages
      const prompt = userMessages.map(m => m.content).join('\n\n');

      // Create session with optional system message
      const sessionConfig: any = {
        model: options?.model || this.defaultModel,
      };

      if (systemMessages.length > 0) {
        sessionConfig.systemMessage = {
          type: 'replace' as const,
          content: systemMessages.map(m => m.content).join('\n\n'),
        };
      }

      console.log(`Creating Copilot session with model: ${sessionConfig.model}`);
      session = await client.createSession(sessionConfig);
      console.log('Copilot session created successfully');

      // Collect the response
      let responseContent = '';
      let finishReason = '';

      // Set up event handlers
      const done = new Promise<void>((resolve, reject) => {
        session!.on('assistant.message', (event) => {
          responseContent = event.data.content;
        });

        session!.on('session.idle', () => {
          resolve();
        });

        session!.on('session.error', (event) => {
          reject(new Error(`Copilot error: ${JSON.stringify(event)}`));
        });

        // Set timeout
        setTimeout(() => {
          reject(new Error('Copilot request timed out after 60 seconds'));
        }, 60000);
      });

      // Send the message
      console.log('Sending prompt to Copilot...');
      await session.send({ prompt });

      // Wait for completion
      await done;
      console.log('Copilot response received');

      return {
        content: responseContent,
        model: options?.model || this.defaultModel,
        finishReason: finishReason || 'complete',
      };
    } catch (error) {
      console.error('Copilot completion error:', error);
      
      // If connection error, reset the client for next attempt
      if (error instanceof Error && error.message.includes('Connection is closed')) {
        console.log('Connection closed, resetting client for next request');
        this.client = null;
      }
      
      throw new Error(
        `Copilot completion failed: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        'Please ensure GitHub Copilot CLI is installed and authenticated.'
      );
    } finally {
      // Clean up session
      if (session) {
        try {
          await session.destroy();
        } catch (err) {
          console.warn('Failed to destroy Copilot session:', err);
        }
      }
    }
  }

  /**
   * Clean up the Copilot client
   */
  async cleanup(): Promise<void> {
    if (this.client) {
      try {
        await this.client.stop();
      } catch (err) {
        console.warn('Failed to stop Copilot client:', err);
      }
      this.client = null;
    }
  }
}

/**
 * GitHub Copilot AI Provider
 * Implementation using @github/copilot-sdk
 */

import { CopilotClient, CopilotSession } from '@github/copilot-sdk';
import type { AIProvider, AIMessage, AICompletionOptions, AICompletionResult } from '@ai-openapi/shared';

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
        await this.client.start();
      } catch (error) {
        throw new Error(
          'Failed to initialize GitHub Copilot client. ' +
          'Please ensure GitHub Copilot CLI is installed and authenticated. ' +
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
    const client = await this.ensureClient();
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

      session = await client.createSession(sessionConfig);

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
      await session.send({ prompt });

      // Wait for completion
      await done;

      return {
        content: responseContent,
        model: options?.model || this.defaultModel,
        finishReason: finishReason || 'complete',
      };
    } catch (error) {
      console.error('Copilot completion error:', error);
      throw new Error(
        `Copilot completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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

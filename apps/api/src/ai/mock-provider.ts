/**
 * Mock AI Provider
 * Used for testing or when no real provider is configured
 */

import type { AIProvider, AIMessage, AICompletionOptions, AICompletionResult } from '@ai-openapi/shared';

export class MockProvider implements AIProvider {
  readonly name = 'mock';

  isConfigured(): boolean {
    return true;
  }

  async complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResult> {
    // Extract the user's description
    const userMessages = messages.filter(m => m.role === 'user');
    const description = userMessages.map(m => m.content).join('\n\n');
    
    // Generate a simple mock OpenAPI spec
    const mockSpec = `openapi: 3.1.0
info:
  title: Generated API
  version: 1.0.0
  description: ${description.slice(0, 200)}
paths:
  /users:
    get:
      summary: List users
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
    post:
      summary: Create user
      responses:
        '201':
          description: Created
`;

    return {
      content: mockSpec,
      model: 'mock',
      finishReason: 'complete',
    };
  }
}

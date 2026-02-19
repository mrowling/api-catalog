/**
 * Test script for AI generation with mock provider
 */

import { AIProviderFactory } from '../src/ai/provider-factory';
import type { AIMessage } from '@ai-openapi/shared';

async function main() {
  console.log('Testing AI generation with mock provider...\n');

  try {
    const provider = AIProviderFactory.getMockProvider();

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'Generate an OpenAPI 3.1 spec for a user management API',
      },
      {
        role: 'user',
        content: 'A REST API for managing users with CRUD operations (GET, POST, PUT, DELETE)',
      },
    ];

    const result = await provider.complete(messages);

    console.log('✅ Generation successful!\n');
    console.log('Generated OpenAPI spec:');
    console.log('─'.repeat(60));
    console.log(result.content);
    console.log('─'.repeat(60));
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

main();

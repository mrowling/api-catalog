/**
 * Generation routes
 * HTTP endpoints for natural language to OpenAPI generation
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { streamSSE } from 'hono/streaming';
import { generationService } from '../services/generation';
import { agenticGenerationService } from '../services/agentic-generation';
import { conversationManager } from '../services/conversation-manager';

const generationRoutes = new Hono();

// Generation request schema
const generateSchema = z.object({
  description: z.string().min(10),
  existingSpec: z.string().optional(),
  mode: z.enum(['create', 'modify']).default('create')
});

// Streaming generation request schema
const generateStreamSchema = z.object({
  description: z.string().min(10),
  existingSpec: z.string().optional(),
  mode: z.enum(['create', 'modify']).default('create'),
  conversationId: z.string().optional(),
  templateName: z.string().optional(),
  userPreferences: z.object({
    includePagination: z.boolean().optional(),
    includeAuth: z.boolean().optional(),
    authType: z.enum(['bearer', 'apiKey', 'oauth2']).optional(),
    includeErrorHandling: z.boolean().optional(),
  }).optional()
});

/**
 * POST /api/generate
 * Generate OpenAPI spec from natural language
 */
generationRoutes.post('/', zValidator('json', generateSchema), async (c) => {
  try {
    const { description, existingSpec, mode } = c.req.valid('json');
    
    console.log(`🤖 Generating OpenAPI spec (mode: ${mode})...`);
    
    // Generate spec using AI service
    const spec = await generationService.generate({
      description,
      existingSpec,
      mode
    });

    return c.json({
      spec,
      format: 'yaml',
      version: '3.1.0',
      message: 'OpenAPI spec generated successfully'
    });
  } catch (error) {
    console.error('❌ Generation error:', error);
    return c.json({
      error: 'Generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/generate/stream
 * Generate OpenAPI spec with SSE streaming
 * Supports interactive questions, diff previews, and quality iterations
 */
generationRoutes.post('/stream', zValidator('json', generateStreamSchema), async (c) => {
  const { 
    description, 
    existingSpec, 
    mode, 
    conversationId,
    templateName,
    userPreferences 
  } = c.req.valid('json');

  console.log(`🤖 Starting streaming generation (mode: ${mode})...`);
  
  // Create or resume conversation
  let convId = conversationId;
  if (!convId) {
    const conversation = conversationManager.create({
      description,
      existingSpec,
      mode
    });
    convId = conversation.id;
    console.log(`📝 Created conversation: ${convId}`);
  } else {
    console.log(`📝 Resuming conversation: ${convId}`);
  }

  return streamSSE(c, async (stream) => {
    try {
      // Send conversation ID first so client can track it
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'conversation',
          conversationId: convId
        })
      });

      // Start agentic generation
      const generator = agenticGenerationService.generateStream({
        description,
        mode,
        currentSpec: existingSpec,
        templateName,
        userPreferences
      });

      // Stream all events to client
      for await (const event of generator) {
        console.log(`📡 Streaming event: ${event.type}`);
        
        // Update conversation with each event
        conversationManager.update(convId!, {
          addMessage: {
            role: 'assistant',
            content: JSON.stringify(event),
            timestamp: new Date()
          }
        });

        // Send event to client
        await stream.writeSSE({
          data: JSON.stringify(event)
        });

        // If this is a final result, mark conversation complete
        if (event.type === 'result') {
          conversationManager.complete(convId!, event.spec);
        }
      }

    } catch (error) {
      console.error('❌ Streaming error:', error);
      
      // Send error event
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      });

      // Mark conversation as errored
      if (convId) {
        conversationManager.error(convId, 
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  });
});

export { generationRoutes };

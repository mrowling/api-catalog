/**
 * Generation routes
 * HTTP endpoints for natural language to OpenAPI generation
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { generationService } from '../services/generation';

const generationRoutes = new Hono();

// Generation request schema
const generateSchema = z.object({
  description: z.string().min(10),
  existingSpec: z.string().optional(),
  mode: z.enum(['create', 'modify']).default('create')
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

export { generationRoutes };

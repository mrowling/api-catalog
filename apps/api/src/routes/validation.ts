/**
 * Validation routes
 * HTTP endpoints for OpenAPI spec validation
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { validationService } from '@ai-openapi/shared';

const validationRoutes = new Hono();

// Validation request schema
const validateSchema = z.object({
  spec: z.union([z.string(), z.record(z.unknown())]),
  format: z.enum(['yaml', 'json']).optional()
});

/**
 * POST /api/validate
 * Validate an OpenAPI specification
 */
validationRoutes.post('/', zValidator('json', validateSchema), async (c) => {
  try {
    const { spec } = c.req.valid('json');
    
    console.log('🔍 Validating OpenAPI specification...');
    const startTime = Date.now();
    
    const result = await validationService.validate(spec);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Validation completed in ${duration}ms`);

    return c.json(result, result.valid ? 200 : 400);
  } catch (error) {
    console.error('❌ Validation error:', error);
    return c.json({
      valid: false,
      errors: [{
        message: error instanceof Error ? error.message : 'Unknown error',
        severity: 'error'
      }]
    }, 500);
  }
});

/**
 * POST /api/validate/dereference
 * Dereference a spec (resolve all $ref pointers)
 */
validationRoutes.post('/dereference', zValidator('json', validateSchema), async (c) => {
  try {
    const { spec } = c.req.valid('json');
    const dereferenced = await validationService.dereference(spec);
    
    return c.json({
      success: true,
      spec: dereferenced
    });
  } catch (error) {
    console.error('❌ Dereference error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/validate/bundle
 * Bundle a spec (resolve $ref but keep references)
 */
validationRoutes.post('/bundle', zValidator('json', validateSchema), async (c) => {
  try {
    const { spec } = c.req.valid('json');
    const bundled = await validationService.bundle(spec);
    
    return c.json({
      success: true,
      spec: bundled
    });
  } catch (error) {
    console.error('❌ Bundle error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export { validationRoutes };

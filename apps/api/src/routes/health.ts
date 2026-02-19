/**
 * Health check routes
 * Simple health and status endpoints
 */

import { Hono } from 'hono';

const healthRoutes = new Hono();

/**
 * GET /api/health
 * Health check endpoint
 */
healthRoutes.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.0.1',
    services: {
      copilot: 'connected', // TODO: Check actual status
      validation: 'ok'
    }
  });
});

export { healthRoutes };

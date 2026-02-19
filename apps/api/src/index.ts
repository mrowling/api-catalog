/**
 * Backend server entry point
 * Hono-based API server for OpenAPI validation and Copilot integration
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { validationRoutes } from './routes/validation.js';
import { generationRoutes } from './routes/generation.js';
import { healthRoutes } from './routes/health.js';
import { githubRoutes } from './routes/github.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Routes
app.route('/api/validate', validationRoutes);
app.route('/api/generate', generationRoutes);
app.route('/api/github', githubRoutes);
app.route('/api/health', healthRoutes);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Natural Language OpenAPI Editor API',
    version: '0.0.1',
    status: 'running',
    endpoints: {
      validation: '/api/validate',
      generation: '/api/generate',
      github: '/api/github',
      health: '/api/health'
    }
  });
});

// Error handling
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({
    error: 'Internal server error',
    message: err.message
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  }, 404);
});

// Start server
const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

console.log(`🚀 Starting Natural Language OpenAPI Editor API...`);
console.log(`📡 Server running on http://localhost:${port}`);
console.log(`📝 API documentation available at http://localhost:${port}/`);

serve({
  fetch: app.fetch,
  port
});

export default app;

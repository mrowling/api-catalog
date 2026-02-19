/**
 * Environment loader
 * MUST be imported first before any other modules
 */

import { config } from 'dotenv';

// Load .env file immediately
config();

// Log that env is loaded (for debugging)
console.log('[ENV] Environment variables loaded from .env');

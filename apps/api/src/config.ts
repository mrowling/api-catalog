/**
 * API Configuration
 * Environment-based configuration for the API
 */

export interface Config {
  /** AI model to use (defaults to gpt-4o) */
  aiModel?: string;
  /** Port to run the server on */
  port: number;
  /** Environment */
  env: 'development' | 'production' | 'test';
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): Config {
  const aiModel = process.env.AI_MODEL;
  const port = parseInt(process.env.PORT || '3001', 10);
  const env = (process.env.NODE_ENV || 'development') as Config['env'];

  return {
    aiModel,
    port,
    env,
  };
}

/**
 * Global config instance
 */
export const config = loadConfig();

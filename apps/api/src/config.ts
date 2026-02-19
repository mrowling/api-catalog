/**
 * API Configuration
 * Environment-based configuration for the API
 */

export interface Config {
  /** AI provider to use (defaults to github-copilot) */
  aiProvider: 'github-copilot' | 'openrouter';
  /** AI model to use (defaults to gpt-4o) */
  aiModel?: string;
  /** OpenRouter API key (required if using openrouter provider) */
  openRouterApiKey?: string;
  /** OpenRouter site URL (optional) */
  openRouterSiteUrl?: string;
  /** OpenRouter site name (optional) */
  openRouterSiteName?: string;
  /** Port to run the server on */
  port: number;
  /** Environment */
  env: 'development' | 'production' | 'test';
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): Config {
  const aiProvider = (process.env.AI_PROVIDER || 'github-copilot') as Config['aiProvider'];
  const aiModel = process.env.AI_MODEL;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const openRouterSiteUrl = process.env.OPENROUTER_SITE_URL;
  const openRouterSiteName = process.env.OPENROUTER_SITE_NAME;
  const port = parseInt(process.env.PORT || '3001', 10);
  const env = (process.env.NODE_ENV || 'development') as Config['env'];

  return {
    aiProvider,
    aiModel,
    openRouterApiKey,
    openRouterSiteUrl,
    openRouterSiteName,
    port,
    env,
  };
}

/**
 * Global config instance
 */
export const config = loadConfig();

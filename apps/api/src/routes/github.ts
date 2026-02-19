/**
 * GitHub discovery routes
 * Endpoints for discovering OpenAPI specs in GitHub organizations
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { GitHubService } from '../services/github.js';

const githubRoutes = new Hono();

// Initialize GitHub service once at startup to show auth status
let githubServiceInstance: GitHubService | null = null;

const getGitHubService = () => {
  if (!githubServiceInstance) {
    const token = process.env.GITHUB_TOKEN;
    githubServiceInstance = new GitHubService(token);
  }
  return githubServiceInstance;
};

// Initialize on module load to show auth message at startup
getGitHubService();

// Validation schemas
const searchSchema = z.object({
  org: z.string().min(1, 'Organization name is required'),
  refresh: z.boolean().optional().default(false),
});

const fetchContentSchema = z.object({
  owner: z.string().min(1, 'Owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
  path: z.string().min(1, 'File path is required'),
});

/**
 * POST /api/github/search
 * Search for OpenAPI specs in a GitHub organization
 */
githubRoutes.post(
  '/search',
  zValidator('json', searchSchema),
  async (c) => {
    try {
      const { org, refresh } = c.req.valid('json');
      console.log(`[GitHub Route] POST /api/github/search - org: ${org}, refresh: ${refresh}`);
      
      const githubService = getGitHubService();
      
      const result = await githubService.searchOpenAPISpecs(org, refresh);
      
      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('GitHub search error:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search GitHub',
      }, 500);
    }
  }
);

/**
 * POST /api/github/fetch
 * Fetch content of a specific OpenAPI spec from GitHub
 */
githubRoutes.post(
  '/fetch',
  zValidator('json', fetchContentSchema),
  async (c) => {
    try {
      const { owner, repo, path } = c.req.valid('json');
      const githubService = getGitHubService();
      
      const content = await githubService.fetchSpecContent(owner, repo, path);
      
      return c.json({
        success: true,
        data: {
          content,
          owner,
          repo,
          path,
        },
      });
    } catch (error) {
      console.error('GitHub fetch error:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch spec from GitHub',
      }, 500);
    }
  }
);

/**
 * POST /api/github/clear-cache
 * Clear the GitHub search cache
 */
githubRoutes.post('/clear-cache', async (c) => {
  try {
    const githubService = getGitHubService();
    githubService.clearCache();
    
    return c.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return c.json({
      success: false,
      error: 'Failed to clear cache',
    }, 500);
  }
});

export { githubRoutes };

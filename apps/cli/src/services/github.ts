/**
 * GitHub API service for discovering OpenAPI specifications in repositories
 */

import { Octokit } from '@octokit/core';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { getCache } from '@ai-openapi/shared';

export interface OpenAPISpec {
  repoName: string;
  repoFullName: string;
  filePath: string;
  fileUrl: string;
  downloadUrl: string;
  lastModified: string;
  htmlUrl: string;
}

export interface GitHubSearchResult {
  specs: OpenAPISpec[];
  totalCount: number;
  lastUpdated: string;
}

/**
 * Get GitHub token from GitHub CLI if available
 */
function getGitHubCliToken(): string | undefined {
  try {
    const token = execSync('gh auth token', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (token && token.length > 0) {
      console.log(chalk.dim('✓ Using GitHub CLI authentication'));
      return token;
    }
  } catch (error) {
    return undefined;
  }
  return undefined;
}

/**
 * Service for interacting with GitHub API to find OpenAPI specs
 */
export class GitHubService {
  private octokit: Octokit;
  private cache = getCache();

  constructor(token?: string) {
    const authToken = token || getGitHubCliToken() || process.env.GITHUB_TOKEN;
    
    if (!authToken) {
      console.warn(chalk.yellow('\n⚠️  No GitHub token found. API rate limits will be restricted (60 requests/hour).'));
      console.warn(chalk.dim('   Set GITHUB_TOKEN or authenticate with: gh auth login\n'));
    }
    
    this.octokit = new Octokit({
      auth: authToken,
    });
  }

  /**
   * Search for OpenAPI specification files in a GitHub organization
   */
  async searchOpenAPISpecs(org: string, forceRefresh = false): Promise<GitHubSearchResult> {
    const cacheKey = `github:search:${org}`;

    // Return cached results if available and not forcing refresh
    if (!forceRefresh) {
      const cached = this.cache.get<GitHubSearchResult>(cacheKey);
      if (cached) {
        console.log(chalk.dim(`✓ Using cached results for org: ${org}`));
        return cached;
      }
    }

    const specs: OpenAPISpec[] = [];
    const searchPatterns = [
      'openapi.yaml',
      'openapi.yml',
      'swagger.yaml',
      'swagger.yml',
    ];

    try {
      // Search for each pattern
      for (const pattern of searchPatterns) {
        const query = `org:${org} filename:${pattern}`;
        
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await this.octokit.request('GET /search/code', {
            q: query,
            per_page: 100,
            page,
          });

          // Process results
          for (const item of response.data.items) {
            specs.push({
              repoName: item.repository.name,
              repoFullName: item.repository.full_name,
              filePath: item.path,
              fileUrl: item.url,
              downloadUrl: item.html_url.replace('/blob/', '/raw/'),
              lastModified: new Date().toISOString(),
              htmlUrl: item.html_url,
            });
          }

          // Check if there are more pages
          hasMore = response.data.items.length === 100;
          page++;

          // GitHub API rate limiting
          if (hasMore) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      // Remove duplicates
      const uniqueSpecs = Array.from(
        new Map(specs.map((spec) => [spec.fileUrl, spec])).values()
      );

      const result: GitHubSearchResult = {
        specs: uniqueSpecs,
        totalCount: uniqueSpecs.length,
        lastUpdated: new Date().toISOString(),
      };

      // Cache the result (5 minute TTL)
      this.cache.set(cacheKey, result, 5 * 60 * 1000);

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to search GitHub: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Fetch content of a specific OpenAPI spec from GitHub
   */
  async fetchSpecContent(owner: string, repo: string, path: string): Promise<string> {
    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path,
      });

      if ('content' in response.data && typeof response.data.content === 'string') {
        // Decode base64 content
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }

      throw new Error('Invalid response format');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch spec content: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Clear the cache for a specific org or all GitHub cache entries
   */
  clearCache(org?: string): void {
    if (org) {
      this.cache.delete(`github:search:${org}`);
    } else {
      this.cache.deletePattern('github:search:%');
    }
  }
}

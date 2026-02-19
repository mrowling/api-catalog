/**
 * GitHub API service for discovering OpenAPI specifications in repositories
 */

import { Octokit } from '@octokit/core';
import { execSync } from 'child_process';
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
    // Try to get token from gh CLI
    const token = execSync('gh auth token', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (token && token.length > 0) {
      console.log('✓ Using GitHub CLI authentication');
      return token;
    }
  } catch (error) {
    // gh CLI not available or not authenticated
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
    // Use provided token, or fallback to GitHub CLI token
    const authToken = token || getGitHubCliToken();
    
    if (!authToken) {
      console.warn('⚠️  No GitHub token found. API rate limits will be restricted (60 requests/hour).');
      console.warn('   Set GITHUB_TOKEN in .env or authenticate with: gh auth login');
    }
    
    this.octokit = new Octokit({
      auth: authToken,
    });
  }

  /**
   * Search for OpenAPI specification files in a GitHub organization with pagination
   */
  async searchOpenAPISpecs(org: string, forceRefresh = false): Promise<GitHubSearchResult> {
    const cacheKey = `github:search:${org}`;

    console.log(`[GitHub Service] searchOpenAPISpecs called for org: ${org}, forceRefresh: ${forceRefresh}`);

    // Return cached results if available and not forcing refresh
    if (!forceRefresh) {
      console.log(`[GitHub Service] Checking cache for key: ${cacheKey}`);
      const cached = this.cache.get<GitHubSearchResult>(cacheKey);
      if (cached) {
        console.log(`✓ Using cached results for org: ${org}`);
        return cached;
      }
      console.log(`[GitHub Service] Cache miss, proceeding with GitHub API call`);
    } else {
      console.log(`[GitHub Service] Force refresh enabled, skipping cache check`);
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
        
        // Fetch all pages of results
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await this.octokit.request('GET /search/code', {
            q: query,
            per_page: 100,
            page,
          });

          // Only process if we got a successful response (2xx status)
          if (response.status < 200 || response.status >= 300) {
            console.warn(`⚠️  Received non-success status ${response.status} for pattern ${pattern}, skipping cache`);
            continue;
          }

          // Validate response has expected structure
          if (!response.data || !Array.isArray(response.data.items)) {
            console.warn(`⚠️  Invalid response structure for pattern ${pattern}, skipping cache`);
            continue;
          }

          // Process each result
          for (const item of response.data.items) {
            const spec: OpenAPISpec = {
              repoName: item.repository.name,
              repoFullName: item.repository.full_name,
              filePath: item.path,
              fileUrl: item.url,
              downloadUrl: item.html_url.replace('/blob/', '/raw/'),
              lastModified: new Date().toISOString(), // GitHub Code Search API doesn't provide this
              htmlUrl: item.html_url,
            };

            // Avoid duplicates
            if (!specs.find(s => s.repoFullName === spec.repoFullName && s.filePath === spec.filePath)) {
              specs.push(spec);
            }
          }

          // Check if there are more pages
          // GitHub's Code Search API returns at most 1000 results
          const totalCount = response.data.total_count;
          const fetchedSoFar = page * 100;
          hasMore = fetchedSoFar < totalCount && fetchedSoFar < 1000 && response.data.items.length === 100;
          
          if (hasMore) {
            page++;
            console.log(`  Fetching page ${page} for pattern: ${pattern}`);
          }
        }
      }

      const result: GitHubSearchResult = {
        specs,
        totalCount: specs.length,
        lastUpdated: new Date().toISOString(),
      };

      // Only cache if we successfully retrieved results
      if (specs.length > 0 || result.totalCount === 0) {
        // Store in SQLite cache (5 minutes TTL)
        this.cache.set(cacheKey, result, 5 * 60 * 1000);
        console.log(`✓ Cached ${specs.length} specs for org: ${org}`);
      } else {
        console.warn(`⚠️  No valid specs found, skipping cache for org: ${org}`);
      }

      return result;
    } catch (error) {
      console.error('Error searching GitHub for OpenAPI specs:', error);
      
      // Try to return cached data if available
      const cached = this.cache.get<GitHubSearchResult>(cacheKey);
      if (cached) {
        console.warn('⚠️  Using stale cache due to API error');
        return cached;
      }
      
      throw new Error(`Failed to search GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch the content of an OpenAPI spec file from GitHub
   */
  async fetchSpecContent(owner: string, repo: string, path: string): Promise<string> {
    const cacheKey = `github:content:${owner}/${repo}/${path}`;

    // Check cache first
    const cached = this.cache.get<string>(cacheKey);
    if (cached) {
      console.log(`✓ Using cached content for: ${owner}/${repo}/${path}`);
      return cached;
    }

    try {
      const response = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path,
        headers: {
          accept: 'application/vnd.github.raw+json',
        },
      });

      // Only cache if we got a successful response (2xx status)
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Received non-success status ${response.status}`);
      }

      // Validate response has content
      if (!response.data || typeof response.data !== 'string') {
        throw new Error('Invalid response: expected string content');
      }

      const content = response.data as unknown as string;
      
      // Only cache non-empty content
      if (content.length > 0) {
        // Cache for 1 hour (spec content doesn't change as frequently)
        this.cache.set(cacheKey, content, 60 * 60 * 1000);
        console.log(`✓ Cached content for: ${owner}/${repo}/${path}`);
      } else {
        console.warn(`⚠️  Empty content received for ${owner}/${repo}/${path}, skipping cache`);
      }

      return content;
    } catch (error) {
      console.error('Error fetching spec content from GitHub:', error);
      throw new Error(`Failed to fetch spec content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all GitHub-related cache
   */
  clearCache(): void {
    const deletedCount = this.cache.deletePattern('github:%');
    console.log(`✓ Cleared ${deletedCount} GitHub cache entries`);
  }
}

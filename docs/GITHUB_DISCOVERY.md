# GitHub OpenAPI Discovery Feature

## Overview

This feature allows you to automatically discover and import OpenAPI specifications from GitHub organizations. It periodically searches for `openapi.yaml`, `openapi.yml`, `swagger.yaml`, and `swagger.yml` files across all repositories in a specified GitHub organization.

## Setup

### Authentication Options

The GitHub Discovery feature supports **two authentication methods**:

#### Option 1: Use GitHub CLI (Recommended - Easiest!)

If you already have GitHub CLI installed and authenticated, **no additional setup is required!** The API will automatically use your `gh` CLI credentials.

```bash
# Check if you're authenticated
gh auth status

# If not authenticated, login
gh auth login
```

**Advantages:**
- No manual token management
- Tokens are securely stored by GitHub CLI
- Automatically refreshed
- Same credentials across all tools

#### Option 2: Manual GitHub Personal Access Token

If you prefer to use a separate token or don't have GitHub CLI:

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a descriptive name (e.g., "OpenAPI Editor - Spec Discovery")
4. Select scopes:
   - For **public repositories only**: Select `public_repo`
   - For **public and private repositories**: Select `repo`
5. Click "Generate token" and copy it immediately (you won't see it again)

Add your GitHub token to `apps/api/.env`:

```bash
# GitHub Configuration
GITHUB_TOKEN=ghp_your_token_here
GITHUB_ORG=your-default-org  # Optional default organization
```

**Note:** If `GITHUB_TOKEN` is set in `.env`, it takes precedence over GitHub CLI authentication.

### Restart the Development Server

```bash
pnpm run dev
```

You should see either:
- `✓ Using GitHub CLI authentication` (if using gh CLI)
- No message (if using GITHUB_TOKEN from .env)
- `⚠️ No GitHub token found...` (if neither is configured)

## Usage

### In the Web UI

1. Open the application at http://localhost:5173
2. You'll see a top navigation menu with two tabs: **Catalog** and **Editor**
3. Click on **Catalog** to access the GitHub OpenAPI Specs browser
4. Enter your GitHub organization name in the input field
5. Click "Search" or press Enter
6. The browser will display all discovered OpenAPI specs
7. Click on any spec to load it into the editor (automatically switches to the Editor tab)

### Features

- **Dedicated Catalog Page**: Browse specs in a full-page view with easy navigation
- **Automatic Discovery**: Searches for multiple OpenAPI file naming conventions
- **Pagination Support**: Fetches all available results (up to 1000 per pattern) from GitHub
- **SQLite Caching**: Persistent cache shared between API and CLI
  - Search results cached for 5 minutes
  - File contents cached for 1 hour
  - Cache stored in `~/.ai-openapi-cache/cache.db`
- **Always Fresh Results**: Manual searches always bypass cache to get the latest specs
- **Auto-Refresh**: Automatically re-searches every 5 minutes (uses cache if available)
- **Persistent Settings**: Your organization name is saved in localStorage
- **Direct Links**: Click "View on GitHub" to open the spec in GitHub
- **Seamless Loading**: Clicking a spec automatically loads it in the Editor

### API Endpoints

#### Search for Specs

```bash
POST /api/github/search
Content-Type: application/json

{
  "org": "your-org-name",
  "refresh": false  # Set to true to bypass cache
}
```

Response:
```json
{
  "success": true,
  "data": {
    "specs": [
      {
        "repoName": "api-service",
        "repoFullName": "your-org/api-service",
        "filePath": "docs/openapi.yaml",
        "fileUrl": "https://api.github.com/repos/...",
        "downloadUrl": "https://raw.githubusercontent.com/...",
        "lastModified": "2026-02-19T...",
        "htmlUrl": "https://github.com/your-org/api-service/blob/main/docs/openapi.yaml"
      }
    ],
    "totalCount": 1,
    "lastUpdated": "2026-02-19T..."
  }
}
```

#### Fetch Spec Content

```bash
POST /api/github/fetch
Content-Type: application/json

{
  "owner": "your-org",
  "repo": "api-service",
  "path": "docs/openapi.yaml"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "content": "openapi: 3.1.0\n...",
    "owner": "your-org",
    "repo": "api-service",
    "path": "docs/openapi.yaml"
  }
}
```

#### Clear Cache

```bash
POST /api/github/clear-cache
```

Response:
```json
{
  "success": true,
  "message": "Cache cleared successfully"
}
```

## Configuration

### Auto-Refresh Interval

In `apps/web/src/App.tsx`, you can adjust the auto-refresh interval:

```tsx
<GitHubSpecsBrowser 
  onSelectSpec={handleImport}
  autoRefreshMinutes={5}  // Change this value (0 = disabled)
/>
```

### Cache Duration

In `apps/api/src/services/github.ts`, adjust the cache duration:

```typescript
private cacheDuration: number = 5 * 60 * 1000; // 5 minutes in milliseconds
```

## Rate Limits

- **Authenticated**: 5,000 requests per hour
- **Unauthenticated**: 60 requests per hour

The cache helps minimize API calls. With 5-minute caching, you'll use at most:
- 12 requests/hour with auto-refresh
- Plus any manual searches/refreshes

## Troubleshooting

### "Failed to search GitHub" error

- Verify your `GITHUB_TOKEN` is set correctly in `.env`
- Ensure the token has the correct scopes (`public_repo` or `repo`)
- Check that the organization name is spelled correctly
- Verify you have access to the organization's repositories

### No specs found

- Check if the organization actually has OpenAPI files
- Try searching for `openapi.yaml` manually in the GitHub organization
- Ensure files are in the root or in standard locations
- Some files might be in private repos (requires `repo` scope)

### Rate limit exceeded

- Wait for the rate limit to reset (check response headers)
- Reduce auto-refresh frequency
- Use manual search instead of continuous auto-refresh

## File Locations Searched

The search finds OpenAPI files with these names:
- `openapi.yaml`
- `openapi.yml`  
- `swagger.yaml`
- `swagger.yml`

Files can be located anywhere in the repository (root, subdirectories, etc.).

## Future Enhancements

Potential improvements:
- Filter by repository
- Search in specific branches
- Support for JSON OpenAPI files
- Batch import multiple specs
- Compare different versions
- Automatic spec syncing
- Pull request creation for spec updates

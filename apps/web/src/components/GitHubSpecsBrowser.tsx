import { useState, useEffect, useCallback, useRef } from 'react';
import './GitHubSpecsBrowser.css';

interface OpenAPISpec {
  repoName: string;
  repoFullName: string;
  filePath: string;
  fileUrl: string;
  downloadUrl: string;
  lastModified: string;
  htmlUrl: string;
}

interface GitHubSearchResult {
  specs: OpenAPISpec[];
  totalCount: number;
  lastUpdated: string;
}

interface GitHubSpecsBrowserProps {
  onSelectSpec: (content: string) => void;
  autoRefreshMinutes?: number; // Auto-refresh interval in minutes (default: disabled)
  showCollapseButton?: boolean; // Show collapse/expand button (default: true for backward compatibility)
}

export function GitHubSpecsBrowser({ onSelectSpec, autoRefreshMinutes = 0, showCollapseButton = true }: GitHubSpecsBrowserProps) {
  const [org, setOrg] = useState(() => {
    return localStorage.getItem('github-org') || '';
  });
  const [specs, setSpecs] = useState<OpenAPISpec[]>([]);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const localSearchInputRef = useRef<HTMLInputElement>(null);
  // Start expanded if no org is saved (first-time user experience)
  const [isExpanded, setIsExpanded] = useState(() => {
    const savedOrg = localStorage.getItem('github-org');
    return !savedOrg || savedOrg.trim() === '';
  });

  // Save org to localStorage
  useEffect(() => {
    if (org) {
      localStorage.setItem('github-org', org);
    }
  }, [org]);

  const searchSpecs = useCallback(async (refresh = false) => {
    if (!org.trim()) {
      setError('Please enter a GitHub organization name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/github/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          org: org.trim(),
          refresh,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data as GitHubSearchResult;
        setSpecs(data.specs);
        setLastUpdated(data.lastUpdated);
        setIsExpanded(true);
      } else {
        setError(result.error || 'Failed to search GitHub');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to API');
    } finally {
      setIsLoading(false);
    }
  }, [org]);

  const loadSpec = useCallback(async (spec: OpenAPISpec) => {
    setIsLoading(true);
    setError(null);

    try {
      const [owner, repo] = spec.repoFullName.split('/');
      
      const response = await fetch('http://localhost:3001/api/github/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner,
          repo,
          path: spec.filePath,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        onSelectSpec(result.data.content);
      } else {
        setError(result.error || 'Failed to fetch spec content');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load spec');
    } finally {
      setIsLoading(false);
    }
  }, [onSelectSpec]);

  // Auto-search on mount if org is saved
  useEffect(() => {
    if (org) {
      searchSpecs();
    }
  }, []); // Only run on mount

  // Set up periodic refresh if enabled
  useEffect(() => {
    if (autoRefreshMinutes > 0 && org) {
      const intervalMs = autoRefreshMinutes * 60 * 1000;
      const intervalId = setInterval(() => {
        searchSpecs(true); // Force refresh
      }, intervalMs);

      return () => clearInterval(intervalId);
    }
  }, [autoRefreshMinutes, org, searchSpecs]);

  // Filter specs based on local search query
  const filteredSpecs = specs.filter((spec) => {
    if (!localSearchQuery.trim()) return true;
    
    const query = localSearchQuery.toLowerCase();
    return (
      spec.repoName.toLowerCase().includes(query) ||
      spec.repoFullName.toLowerCase().includes(query) ||
      spec.filePath.toLowerCase().includes(query)
    );
  });

  // Keyboard shortcut: Ctrl/Cmd + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        localSearchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="github-specs-browser" aria-busy={isLoading} aria-live="polite">
      <div className="github-specs-header">
        <h3>
          <span className="github-icon" aria-hidden="true">📦</span>
          GitHub OpenAPI Specs
        </h3>
        {showCollapseButton && (
          <button 
            className="collapse-button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse GitHub specs section' : 'Expand GitHub specs section'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
      </div>

      {(isExpanded || !showCollapseButton) && (
        <>
          <div className="github-search" role="search">
            <label htmlFor="github-org-input" className="sr-only">
              GitHub organization name
            </label>
            <input
              id="github-org-input"
              type="text"
              placeholder="GitHub organization name"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchSpecs(false);
                }
              }}
              disabled={isLoading}
              className="github-org-input"
              aria-describedby={error ? 'github-error' : undefined}
            />
            <button
              onClick={() => searchSpecs(false)}
              disabled={isLoading || !org.trim()}
              className="search-button"
              aria-label="Search for OpenAPI specs in GitHub organization"
            >
              <span aria-hidden="true">{isLoading ? '⏳' : '🔍'}</span> Search
            </button>
            <button
              onClick={() => searchSpecs(true)}
              disabled={isLoading || !org.trim()}
              className="refresh-button hard-refresh-button"
              aria-label="Hard refresh - bypass cache and fetch fresh data from GitHub"
            >
              <span aria-hidden="true">{isLoading ? '⏳' : '🔄'}</span> Hard Refresh
            </button>
          </div>

          {error && (
            <div id="github-error" className="github-error" role="alert">
              <span aria-hidden="true">⚠️</span> {error}
            </div>
          )}

          {lastUpdated && (
            <div className="github-last-updated" aria-live="polite">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </div>
          )}

          {specs.length > 0 && (
            <>
              <div className="local-search-container">
                <label htmlFor="local-search-input" className="sr-only">
                  Filter repositories by name or path
                </label>
                <input
                  ref={localSearchInputRef}
                  id="local-search-input"
                  type="text"
                  placeholder="Filter by repo name or file path... (Ctrl+K)"
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="local-search-input"
                  aria-label="Filter repositories locally"
                />
                {localSearchQuery && (
                  <button
                    onClick={() => setLocalSearchQuery('')}
                    className="clear-search-button"
                    aria-label="Clear search filter"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="github-specs-list">
                <div className="specs-count">
                  {filteredSpecs.length === specs.length ? (
                    <>Found {specs.length} spec{specs.length !== 1 ? 's' : ''}</>
                  ) : (
                    <>Showing {filteredSpecs.length} of {specs.length} spec{specs.length !== 1 ? 's' : ''}</>
                  )}
                </div>
                {filteredSpecs.length > 0 ? (
                  filteredSpecs.map((spec) => (
                    <div
                      key={`${spec.repoFullName}-${spec.filePath}`}
                      className="spec-item"
                      onClick={() => loadSpec(spec)}
                    >
                      <div className="spec-repo-name">
                        📁 {spec.repoName}
                      </div>
                      <div className="spec-file-path">
                        {spec.filePath}
                      </div>
                      <a
                        href={spec.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="spec-github-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on GitHub →
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="github-empty">
                    No specs match your filter "{localSearchQuery}"
                  </div>
                )}
              </div>
            </>
          )}

          {specs.length === 0 && !isLoading && !error && org && (
            <div className="github-empty">
              No OpenAPI specs found in {org}
            </div>
          )}
        </>
      )}
    </div>
  );
}

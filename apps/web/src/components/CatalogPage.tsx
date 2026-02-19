import { GitHubSpecsBrowser } from './GitHubSpecsBrowser';
import './CatalogPage.css';

interface CatalogPageProps {
  onSelectSpec: (content: string) => void;
  onNavigateToEditor: () => void;
}

export function CatalogPage({ onSelectSpec, onNavigateToEditor }: CatalogPageProps) {
  const handleSelectSpec = (content: string) => {
    onSelectSpec(content);
    // Automatically navigate to editor after loading a spec
    onNavigateToEditor();
  };

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h1>OpenAPI Specification Catalog</h1>
        <p className="catalog-description">
          Browse and import OpenAPI specifications from your GitHub organization
        </p>
      </div>

      <div className="catalog-content">
        <GitHubSpecsBrowser 
          onSelectSpec={handleSelectSpec}
          autoRefreshMinutes={5}
          showCollapseButton={false}
        />
      </div>
    </div>
  );
}

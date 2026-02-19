import './Navigation.css';

interface NavigationProps {
  currentPage: 'catalog' | 'editor';
  onNavigate: (page: 'catalog' | 'editor') => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav className="navigation" aria-label="Main navigation">
      <button
        className={`nav-button ${currentPage === 'catalog' ? 'active' : ''}`}
        onClick={() => onNavigate('catalog')}
        aria-label="Navigate to catalog page"
        aria-current={currentPage === 'catalog' ? 'page' : undefined}
      >
        Catalog
      </button>
      <button
        className={`nav-button ${currentPage === 'editor' ? 'active' : ''}`}
        onClick={() => onNavigate('editor')}
        aria-label="Navigate to editor page"
        aria-current={currentPage === 'editor' ? 'page' : undefined}
      >
        Editor
      </button>
    </nav>
  );
}

import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { CatalogPage } from './components/CatalogPage';
import { EditorPage } from './components/EditorPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<'catalog' | 'editor'>('catalog');
  const [loadedSpec, setLoadedSpec] = useState<string | undefined>(undefined);

  const handleSelectSpec = (content: string) => {
    setLoadedSpec(content);
  };

  const handleNavigateToEditor = () => {
    setCurrentPage('editor');
  };

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <Navigation 
        currentPage={currentPage} 
        onNavigate={setCurrentPage}
      />
      
      <main id="main-content" className="app-content" tabIndex={-1}>
        {currentPage === 'catalog' ? (
          <CatalogPage 
            onSelectSpec={handleSelectSpec}
            onNavigateToEditor={handleNavigateToEditor}
          />
        ) : (
          <EditorPage initialSpec={loadedSpec} />
        )}
      </main>
    </div>
  );
}

export default App;

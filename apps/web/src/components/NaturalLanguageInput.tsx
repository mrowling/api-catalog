import { useState } from 'react';
import { Sparkles, Edit3, FilePlus, X } from 'lucide-react';

interface NaturalLanguageInputProps {
  onGenerate: (description: string, mode: 'create' | 'modify') => void;
  isGenerating: boolean;
  currentSpec: string;
}

export function NaturalLanguageInput({ 
  onGenerate, 
  isGenerating, 
  currentSpec 
}: NaturalLanguageInputProps) {
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'create' | 'modify'>('create');
  const [showTips, setShowTips] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isGenerating) return;
    
    onGenerate(description.trim(), mode);
    if (mode === 'create') {
      setDescription('');
    }
  };

  const getPlaceholder = () => {
    if (mode === 'create') {
      return 'Describe your API... e.g., "A REST API for a blog with posts, comments, and users"';
    }
    return 'Describe what to change... e.g., "Add pagination to the GET /posts endpoint"';
  };

  return (
    <div className="nl-input-container">
      <div className="nl-input-header">
        <h2>
          <Sparkles size={20} />
          AI Assistant
        </h2>
        
        <div className="mode-toggle">
          <button
            type="button"
            className={mode === 'create' ? 'active' : ''}
            onClick={() => setMode('create')}
            disabled={isGenerating}
          >
            <FilePlus size={16} />
            Create
          </button>
          <button
            type="button"
            className={mode === 'modify' ? 'active' : ''}
            onClick={() => setMode('modify')}
            disabled={isGenerating || !currentSpec}
          >
            <Edit3 size={16} />
            Modify
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="nl-input-form">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={getPlaceholder()}
          disabled={isGenerating}
          rows={6}
        />
        
        <button 
          type="submit" 
          disabled={!description.trim() || isGenerating}
          className="generate-button"
        >
          {isGenerating ? (
            <>
              <span className="spinner" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              {mode === 'create' ? 'Generate Spec' : 'Apply Changes'}
            </>
          )}
        </button>
      </form>

      {showTips && (
        <div className="nl-input-tips">
          <div className="nl-input-tips-header">
            <h3>Tips:</h3>
            <button 
              type="button" 
              className="close-tips-button"
              onClick={() => setShowTips(false)}
              aria-label="Close tips"
            >
              <X size={16} />
            </button>
          </div>
          <ul>
            <li>Be specific about endpoints and data models</li>
            <li>Mention authentication if needed</li>
            <li>Include example use cases</li>
            <li>Specify response formats (JSON, XML)</li>
          </ul>
        </div>
      )}
    </div>
  );
}

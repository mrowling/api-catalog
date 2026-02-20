import { useState, useCallback, useEffect } from 'react';
import { validateSpec } from '../generated/api/sdk.gen';
import type { ValidationResponse } from '../generated/api/types.gen';
import { ChatPanel } from './Chat';
import { SwaggerPreview } from './SwaggerPreview';
import { ValidationStatus } from './ValidationStatus';
import { Toolbar } from './Toolbar';
import './EditorPage.css';

const STORAGE_KEY = 'openapi-editor-spec';

interface EditorPageProps {
  initialSpec?: string;
}

export function EditorPage({ initialSpec }: EditorPageProps) {
  // Initialize state from localStorage or initialSpec
  const [currentSpec, setCurrentSpec] = useState<string>(() => {
    if (initialSpec) return initialSpec;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved || '';
    } catch (err) {
      console.error('Failed to load spec from localStorage:', err);
      return '';
    }
  });
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);

  // Determine mode based on whether we have a spec
  const mode: 'create' | 'modify' = currentSpec ? 'modify' : 'create';

  // Update spec when initialSpec changes (from catalog)
  useEffect(() => {
    if (initialSpec) {
      setCurrentSpec(initialSpec);
      handleValidate(initialSpec);
    }
  }, [initialSpec]);

  // Save spec to localStorage whenever it changes
  useEffect(() => {
    try {
      if (currentSpec) {
        localStorage.setItem(STORAGE_KEY, currentSpec);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error('Failed to save spec to localStorage:', err);
    }
  }, [currentSpec]);

  // Validate initial spec on mount
  useEffect(() => {
    if (currentSpec) {
      handleValidate(currentSpec);
    }
  }, []); // Only run on mount

  const handleSpecUpdate = useCallback((spec: string) => {
    setCurrentSpec(spec);
    // Auto-validate the updated spec
    handleValidate(spec);
  }, []);

  const handleValidate = useCallback(async (spec: string) => {
    try {
      const result = await validateSpec({
        body: { spec },
      });
      
      if (result.data) {
        setValidationResult(result.data);
      } else if (result.error) {
        // Handle 400 response (invalid spec) - error contains ValidationResponse
        setValidationResult(result.error as ValidationResponse);
      }
    } catch (err) {
      console.error('Validation error:', err);
      // Set validation as invalid when API call fails
      setValidationResult({
        valid: false,
        errors: [{
          message: err instanceof Error ? err.message : 'Validation failed',
          severity: 'error'
        }]
      });
    }
  }, []);

  const handleImport = useCallback(async (content: string) => {
    setCurrentSpec(content);
    await handleValidate(content);
  }, [handleValidate]);

  const handleExport = useCallback(() => {
    if (!currentSpec) return;
    
    const blob = new Blob([currentSpec], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'openapi.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentSpec]);

  const handleClear = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the editor? This cannot be undone.')) {
      setCurrentSpec('');
      setValidationResult(null);
    }
  }, []);

  return (
    <div className="editor-page">
      <header className="editor-header">
        <h1>Natural Language OpenAPI Editor</h1>
        <ValidationStatus 
          validation={validationResult} 
          isGenerating={false}
        />
      </header>

      <div className="editor-container">
        <aside className="editor-sidebar">
          <ChatPanel
            currentSpec={currentSpec}
            onSpecUpdate={handleSpecUpdate}
            mode={mode}
          />
        </aside>

        <main className="editor-main">
          <Toolbar
            onImport={handleImport}
            onExport={handleExport}
            onClear={handleClear}
            hasSpec={!!currentSpec}
          />
          
          <SwaggerPreview 
            spec={currentSpec}
            onSpecChange={setCurrentSpec}
            onValidate={handleValidate}
            validationErrors={validationResult?.valid === false ? validationResult.errors : []}
          />
        </main>
      </div>
    </div>
  );
}

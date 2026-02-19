import { useState, useEffect, useRef, useCallback } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import Editor, { useMonaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { FileJson, Eye, Columns, GripVertical, Edit3 } from 'lucide-react';
import type { ValidationError } from '../generated/api/types.gen';

interface SwaggerPreviewProps {
  spec: string;
  onSpecChange: (spec: string) => void;
  onValidate: (spec: string) => void;
  validationErrors?: ValidationError[];
}

type ViewMode = 'split' | 'preview' | 'editor';

const MIN_PANEL_WIDTH = 300;
const DEFAULT_SPLIT_PERCENT = 50;

export function SwaggerPreview({ spec, onSpecChange, onValidate, validationErrors = [] }: SwaggerPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [splitPercent, setSplitPercent] = useState(DEFAULT_SPLIT_PERCENT);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monaco = useMonaco();

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1200);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleTouchStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = (x / rect.width) * 100;
      
      // Constrain between min and max
      const minPercent = (MIN_PANEL_WIDTH / rect.width) * 100;
      const maxPercent = 100 - minPercent;
      
      setSplitPercent(Math.max(minPercent, Math.min(maxPercent, percent)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const percent = (x / rect.width) * 100;
      
      const minPercent = (MIN_PANEL_WIDTH / rect.width) * 100;
      const maxPercent = 100 - minPercent;
      
      setSplitPercent(Math.max(minPercent, Math.min(maxPercent, percent)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);
      
      // Add cursor style to body while dragging
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Handle editor change with debounce
  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    
    // Update spec immediately
    onSpecChange(value);
    
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Debounce validation
    debounceTimeoutRef.current = setTimeout(() => {
      onValidate(value);
      debounceTimeoutRef.current = null;
    }, 500);
  };

  // Cleanup timeout and observer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Cleanup hover observer
      const editor = editorRef.current;
      if (editor) {
        const observer = (editor as any)._hoverObserver;
        if (observer) {
          observer.disconnect();
        }
      }
      
      // Cleanup style element
      const style = document.getElementById('monaco-hover-fix');
      if (style) {
        style.remove();
      }
    };
  }, []);

  // Set validation error markers on editor
  useEffect(() => {
    if (!monaco || !editorRef.current) return;
    
    const model = editorRef.current.getModel();
    if (!model) return;

    const markers: monaco.editor.IMarkerData[] = validationErrors.map(error => {
      // Default to line 1, column 1 if no line info
      const lineNumber = error.line ?? 1;
      const column = error.column ?? 1;
      
      return {
        message: error.message,
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: lineNumber,
        startColumn: column,
        endLineNumber: lineNumber,
        endColumn: column + 1,
      };
    });

    monaco.editor.setModelMarkers(model, 'validation', markers);
  }, [monaco, validationErrors]);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
    editorRef.current = editor;
    
    if (!monacoInstance) return;
    
    // Add CSS to constrain hover positioning
    const style = document.createElement('style');
    style.id = 'monaco-hover-fix';
    style.textContent = `
      .monaco-hover {
        position: fixed !important;
        z-index: 1000;
      }
    `;
    document.head.appendChild(style);
    
    // Use MutationObserver with RAF for timing
    let isAdjusting = false;
    const observer = new MutationObserver(() => {
      if (isAdjusting) return;
      
      requestAnimationFrame(() => {
        const hoverWidget = document.querySelector('.monaco-hover');
        if (hoverWidget instanceof HTMLElement && hoverWidget.offsetParent !== null) {
          const rect = hoverWidget.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          
          // Get current cursor position
          const currentEditor = editorRef.current;
          if (!currentEditor) return;
          
          const position = currentEditor.getPosition();
          if (!position) return;
          
          const editorDom = currentEditor.getDomNode();
          if (!editorDom) return;
          
          const editorRect = editorDom.getBoundingClientRect();
          const lineHeight = currentEditor.getOption(monacoInstance.editor.EditorOption.lineHeight);
          
          // Calculate line position in viewport
          const scrollTop = currentEditor.getScrollTop();
          const lineTop = currentEditor.getTopForLineNumber(position.lineNumber);
          const linePositionInViewport = editorRect.top + (lineTop - scrollTop);
          
          isAdjusting = true;
          
          // Check if hover overflows top
          if (rect.top < 0) {
            // Position below the line
            const newTop = linePositionInViewport + lineHeight + 2;
            hoverWidget.style.top = `${newTop}px`;
            hoverWidget.style.bottom = 'auto';
          }
          // Check if hover overflows bottom
          else if (rect.bottom > viewportHeight) {
            // Position above the line
            const newTop = linePositionInViewport - rect.height - 2;
            if (newTop >= 0) {
              hoverWidget.style.top = `${newTop}px`;
              hoverWidget.style.bottom = 'auto';
            } else {
              // If can't fit above either, position at top with scroll
              hoverWidget.style.top = '10px';
              hoverWidget.style.bottom = 'auto';
            }
          }
          
          setTimeout(() => { isAdjusting = false; }, 100);
        }
      });
    });
    
    // Observe the body for hover widget changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
    
    // Store observer for cleanup
    (editor as any)._hoverObserver = observer;
  };

  const parsedSpec = (() => {
    if (!spec) return null;
    try {
      // Try to parse as JSON first
      return JSON.parse(spec);
    } catch {
      // Assume YAML and return as-is (SwaggerUI can handle YAML strings)
      return spec;
    }
  })();

  const renderPreview = () => (
    <div className="swagger-ui-wrapper">
      {parsedSpec ? (
        <SwaggerUI spec={parsedSpec} />
      ) : (
        <div className="empty-state">
          <FileJson size={48} />
          <p>No OpenAPI specification loaded</p>
          <span>Use the AI assistant to generate one or import an existing spec</span>
        </div>
      )}
    </div>
  );

  const renderEditor = () => (
    <div className="monaco-editor-wrapper">
      <Editor
        height="100%"
        defaultLanguage="yaml"
        value={spec}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          lineNumbers: 'on',
          glyphMargin: true,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          hover: {
            enabled: true,
            sticky: true, // Keep hover visible when mouse moves into it
            delay: 300, // Show hover after 300ms
          },
        }}
      />
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={`swagger-preview ${viewMode === 'split' && isLargeScreen ? 'split-view' : ''}`}
    >
      <div className="swagger-tabs">
        {isLargeScreen && (
          <button
            className={viewMode === 'split' ? 'active' : ''}
            onClick={() => setViewMode('split')}
            title="Split view"
          >
            <Columns size={16} />
            Split
          </button>
        )}
        <button
          className={viewMode === 'preview' ? 'active' : ''}
          onClick={() => setViewMode('preview')}
        >
          <Eye size={16} />
          Preview
        </button>
        <button
          className={viewMode === 'editor' ? 'active' : ''}
          onClick={() => setViewMode('editor')}
        >
          <Edit3 size={16} />
          Editor
        </button>
      </div>

      <div className="swagger-content">
        {viewMode === 'split' && isLargeScreen ? (
          <>
            <div 
              className="split-pane split-pane-preview"
              style={{ width: `${splitPercent}%`, flex: 'none' }}
            >
              {renderPreview()}
            </div>
            
            <div 
              className={`split-divider ${isDragging ? 'dragging' : ''}`}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              <GripVertical size={16} />
            </div>
            
            <div 
              className="split-pane split-pane-editor"
              style={{ width: `${100 - splitPercent}%`, flex: 'none' }}
            >
              {renderEditor()}
            </div>
          </>
        ) : viewMode === 'preview' ? (
          renderPreview()
        ) : (
          renderEditor()
        )}
      </div>
    </div>
  );
}

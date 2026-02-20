import { Check, X, RefreshCw } from 'lucide-react';
import './ChatMessage.css';

interface DiffMessageProps {
  content: string;
  diff: {
    before?: string;
    after?: string;
    preview: string;
    added: string[];
    removed: string[];
    modified: string[];
  };
  onApprove: () => void;
  onCancel: () => void;
  onRefine: () => void;
}

export function DiffMessage({ content, diff, onApprove, onCancel, onRefine }: DiffMessageProps) {
  // Parse the preview string which has format like "+ line" or "- line" or "  line"
  const previewLines = diff.preview.split('\n');
  
  return (
    <div className="chat-message assistant diff">
      <div className="message-content">
        <p className="diff-description">{content}</p>
        
        <div className="diff-stats" style={{ 
          fontSize: '0.85rem', 
          color: 'var(--text-secondary)', 
          marginBottom: '0.75rem',
          display: 'flex',
          gap: '1rem'
        }}>
          {diff.added.length > 0 && (
            <span style={{ color: 'var(--success)' }}>+{diff.added.length} added</span>
          )}
          {diff.removed.length > 0 && (
            <span style={{ color: 'var(--error)' }}>-{diff.removed.length} removed</span>
          )}
          {diff.modified.length > 0 && (
            <span style={{ color: 'var(--warning)' }}>~{diff.modified.length} modified</span>
          )}
        </div>
        
        <div style={{ 
          background: 'var(--bg-primary)', 
          border: '1px solid var(--border-primary)', 
          borderRadius: '8px', 
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '0.5rem 0.75rem',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-secondary)'
          }}>
            Changes Preview
          </div>
          <pre className="diff-code" style={{ maxHeight: '400px', overflow: 'auto' }}>
            {previewLines.map((line, i) => {
              const isAdded = line.startsWith('+ ');
              const isRemoved = line.startsWith('- ');
              const content = line.substring(2); // Remove "+ " or "- " or "  " prefix
              
              return (
                <div 
                  key={`diff-${i}`} 
                  className={`diff-line ${isAdded ? 'added' : isRemoved ? 'removed' : ''}`}
                >
                  <span className="line-number">{i + 1}</span>
                  <span className="line-content">{content || ' '}</span>
                </div>
              );
            })}
          </pre>
        </div>
        
        <div className="diff-actions">
          <button className="diff-action approve" onClick={onApprove}>
            <Check size={16} />
            Apply
          </button>
          <button className="diff-action refine" onClick={onRefine}>
            <RefreshCw size={16} />
            Refine
          </button>
          <button className="diff-action cancel" onClick={onCancel}>
            <X size={16} />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

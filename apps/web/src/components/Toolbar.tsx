import { Upload, Download, Trash2 } from 'lucide-react';
import { useRef } from 'react';

interface ToolbarProps {
  onImport: (content: string) => void;
  onExport: () => void;
  onClear: () => void;
  hasSpec: boolean;
}

export function Toolbar({ 
  onImport, 
  onExport,
  onClear, 
  hasSpec 
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImport(content);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="toolbar-button"
        >
          <Upload size={16} />
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".yaml,.yml,.json"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        
        <button 
          onClick={onExport}
          disabled={!hasSpec}
          className="toolbar-button"
        >
          <Download size={16} />
          Export
        </button>

        <button 
          onClick={onClear}
          disabled={!hasSpec}
          className="toolbar-button"
          title="Clear editor"
        >
          <Trash2 size={16} />
          Clear
        </button>
      </div>
    </div>
  );
}

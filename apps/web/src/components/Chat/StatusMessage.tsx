import { Loader2 } from 'lucide-react';
import './ChatMessage.css';

interface StatusMessageProps {
  content: string;
}

export function StatusMessage({ content }: StatusMessageProps) {
  return (
    <div className="chat-message assistant status">
      <div className="message-content">
        <div className="status-indicator">
          <Loader2 className="spinner-icon" />
          <span className="status-text">{content}</span>
        </div>
      </div>
    </div>
  );
}
